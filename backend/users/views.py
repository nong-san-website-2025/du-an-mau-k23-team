from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.db.models import Sum, Count
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from django.apps import apps
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from .utils import token_generator, generate_reset_link
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from django.utils.encoding import force_bytes

from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.urls import reverse

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests
from django.http import StreamingHttpResponse
import json
from queue import Queue
from threading import Lock


FRONTEND_URL = "http://localhost:3000"

# SSE globals
user_queues = {}
queue_lock = Lock()

def send_notification_to_user(user_id, data):
    with queue_lock:
        if user_id in user_queues:
            for q in user_queues[user_id][:]:  # copy to avoid modification during iteration
                try:
                    q.put_nowait(data)
                except:
                    user_queues[user_id].remove(q)

from .serializers import (
    UserSerializer,
    RegisterSerializer,
    AddressSerializer,
    EmployeeSerializer,
    RoleSerializer,
    AccountSerializer,
    CustomUserSerializer
)


from .permissions import IsAdmin, IsSeller, IsNormalUser

# Lấy model động tránh vòng lặp import
User = get_user_model()

# Lấy model bằng apps.get_model (tránh import vòng)
CustomUser = apps.get_model('users', 'CustomUser')
Role = apps.get_model('users', 'Role')
Address = apps.get_model('users', 'Address')
PointHistory = apps.get_model('users', 'PointHistory')
Seller = apps.get_model('sellers', 'Seller')
Store = apps.get_model('store', 'Store')
Product = apps.get_model('products', 'Product')
Order = apps.get_model('orders', 'Order')
# Optional: dùng thanh toán trong WalletBalanceView
from payments.models import Payment

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        # Ensure multipart parsing works for avatar uploads
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Save to stage non-sensitive updates; email/phone are staged in pending fields
        user = serializer.save()

        # Handle pending email: send verification link
        messages = []
        if user.pending_email and user.pending_email != user.email:
            try:
                uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                # Build backend URL for email confirmation then redirect to profile
                path = reverse('confirm-email-change', kwargs={"uidb64": uidb64, "token": token})
                verify_link = request.build_absolute_uri(path)
                # Send email
                send_mail(
                    subject="Xác nhận thay đổi email",
                    message=f"Nhấn vào liên kết để xác nhận: {verify_link}",
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                    recipient_list=[user.pending_email],
                    fail_silently=True,
                )
                messages.append("Đã gửi email xác nhận thay đổi email.")
            except Exception:
                messages.append("Không thể gửi email xác nhận. Vui lòng thử lại sau.")

        # Handle pending phone: generate OTP and 'send' via log/email fallback
        if user.pending_phone and user.pending_phone != (user.phone or ""):
            import random
            from django.utils import timezone
            otp = f"{random.randint(0, 999999):06d}"
            user.phone_otp = otp
            user.phone_otp_expires = timezone.now() + timezone.timedelta(minutes=10)
            user.save(update_fields=["phone_otp", "phone_otp_expires"])
            # TODO: Integrate real SMS provider here. For dev, send via email fallback if available.
            if user.email:
                try:
                    send_mail(
                        subject="Mã OTP xác nhận thay đổi số điện thoại",
                        message=f"Mã OTP của bạn là: {otp} (hết hạn sau 10 phút)",
                        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                        recipient_list=[user.email],
                        fail_silently=True,
                    )
                    messages.append("Đã gửi OTP xác nhận thay đổi số điện thoại qua email.")
                except Exception:
                    messages.append("Không thể gửi OTP. Vui lòng thử lại sau.")
            else:
                messages.append("OTP đã được tạo cho số điện thoại mới.")

        # Return masked data and messages
        data = UserSerializer(user).data
        data["messages"] = messages
        return Response(data)

class ConfirmEmailChangeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = int(urlsafe_base64_decode(uidb64).decode())
            user = get_object_or_404(CustomUser, pk=uid)
            if default_token_generator.check_token(user, token) and user.pending_email:
                user.email = user.pending_email
                user.pending_email = None
                user.save(update_fields=["email", "pending_email"])
                # Redirect về trang profile sau khi cập nhật
                return HttpResponseRedirect(f"{FRONTEND_URL}/profile")
            return HttpResponseRedirect(f"{FRONTEND_URL}/profile?email_change=failed")
        except Exception:
            return HttpResponseRedirect(f"{FRONTEND_URL}/profile?email_change=error")


class ConfirmPhoneChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        otp = str(request.data.get("otp", "")).strip()
        user = request.user
        if not otp or not user.phone_otp or not user.phone_otp_expires:
            return Response({"error": "OTP không hợp lệ."}, status=400)
        if timezone.now() > user.phone_otp_expires:
            return Response({"error": "OTP đã hết hạn."}, status=400)
        if otp != user.phone_otp:
            return Response({"error": "OTP không đúng."}, status=400)

        # Apply phone change
        user.phone = user.pending_phone
        user.pending_phone = None
        user.phone_otp = None
        user.phone_otp_expires = None
        user.save(update_fields=["phone", "pending_phone", "phone_otp", "phone_otp_expires"])
        return Response({"message": "Số điện thoại đã được cập nhật thành công."})


class UserListView(ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

@method_decorator(csrf_exempt, name="dispatch")
class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # --- Dùng cùng logic với serializer ---
        has_activity = (
            Seller.objects.filter(user=instance).exists()
            or Store.objects.filter(owner=instance).exists()
            or Order.all_objects.filter(user=instance).exists()
            or Product.objects.filter(seller__user=instance).exists()
            or PointHistory.objects.filter(user=instance).exists()
            or Address.objects.filter(user=instance).exists()
        )

        if has_activity:
            return Response(
                {"detail": "Không thể xoá user này vì đã có hoạt động trong hệ thống."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    

# -------------------- WALLET --------------------
class WalletBalanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if hasattr(user, "wallet_balance"):
            balance = user.wallet_balance
        else:
            balance = (
                Payment.objects.filter(user=user, status="success")
                .aggregate(total=Sum("amount"))["total"]
                or 0
            )
        return Response({"balance": balance})


# -------------------- GOOGLE LOGIN --------------------
@method_decorator(csrf_exempt, name="dispatch")

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]
    """
    API xử lý đăng nhập bằng Google OAuth2
    Nhận token từ frontend, xác thực với Google, sau đó trả về JWT.
    """
    def post(self, request):
        try:
            # 1. Lấy token từ frontend
            token = request.data.get("token")
            if not token:
                return Response(
                    {"error": "Thiếu token từ frontend"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. Xác thực token với Google
            try:
                idinfo = id_token.verify_oauth2_token(token, google_requests.Request())
            except ValueError:
                return Response(
                    {"error": "Token không hợp lệ hoặc đã hết hạn"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # 3. Lấy thông tin từ Google
            google_user_id = idinfo.get("sub")  # ID duy nhất của user trong hệ thống Google
            email = idinfo.get("email")
            name = idinfo.get("name")
            picture = idinfo.get("picture", "")

            if not email:
                return Response(
                    {"error": "Không thể xác định email từ Google"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 4. Kiểm tra hoặc tạo user trong database
            user, created = User.objects.get_or_create(
                username=email,  # Username duy nhất
                defaults={
                    "email": email,
                    "first_name": name
                }
            )

            # Nếu user đã tồn tại, có thể cập nhật tên, ảnh...
            if not created:
                updated = False
                if user.first_name != name:
                    user.first_name = name
                    updated = True
                if updated:
                    user.save()

            # 5. Tạo JWT token cho user này
            refresh = RefreshToken.for_user(user)

            return Response({
                "message": "Đăng nhập Google thành công",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "avatar": picture
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Lỗi hệ thống: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class FacebookLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        access_token = request.data.get("accessToken")

        if not access_token:
            return Response({"error": "Access token không hợp lệ"}, status=400)

        # 1. Gọi Facebook Graph API để lấy thông tin user
        url = f"https://graph.facebook.com/me?fields=id,name,email&access_token={access_token}"
        response = requests.get(url)
        data = response.json()

        if "error" in data:
            return Response({"error": "Token Facebook không hợp lệ"}, status=400)

        facebook_id = data.get("id")
        name = data.get("name")
        email = data.get("email", f"{facebook_id}@facebook.com")  # fallback nếu không có email

        # 2. Kiểm tra user trong database
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": name,
                "password": User.objects.make_random_password(),
            },
        )

        # 3. Tạo JWT token
        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Đăng nhập Facebook thành công",
            "user": {
                "username": user.username,
                "email": user.email,
            },
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=200)



# -------------------- AUTH / USER --------------------

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        """
        Khi người dùng đăng ký:
        - Tạo user mới với status="pending"
        - Gửi email xác thực
        - Không trả JWT token ngay
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Lưu user với trạng thái pending
        user = serializer.save(status="pending")

        # Gửi email xác thực
        self.send_verification_email(user)

        return Response({
            "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
            "username": user.username,
            "email": user.email
        }, status=status.HTTP_201_CREATED)

    def send_verification_email(self, user):
        """
        Gửi email xác thực cho người dùng.
        """
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # Gửi link tới BACKEND để xử lý xác thực, sau đó backend sẽ redirect về FRONTEND kèm token
        verification_url = f"http://localhost:8000/api/users/verify-email/{uid}/{token}/"

        subject = "Xác thực tài khoản của bạn"
        message = (
            f"Xin chào {user.username},\n\n"
            f"Vui lòng nhấn vào liên kết dưới đây để xác thực tài khoản:\n{verification_url}\n\n"
            "Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này."
        )

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
    

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"detail": "Vui lòng nhập username và password"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Xác thực user
        user = authenticate(username=username, password=password)
        if not user:
            return Response(
                {"detail": "Tên đăng nhập hoặc mật khẩu không chính xác"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # **Kiểm tra trạng thái trước khi tạo token**
        if user.status != "active":
            if user.status == "pending":
                return Response(
                    {"detail": "Tài khoản chưa được xác thực. Vui lòng kiểm tra email!"},
                    status=status.HTTP_403_FORBIDDEN
                )
            elif user.status == "inactive":
                return Response(
                    {"detail": "Tài khoản đã bị khóa."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Tạo JWT token chỉ khi status = active
        refresh = RefreshToken.for_user(user)

        return Response({
            "username": user.username,
            "email": user.email,
            "role": {
                "id": user.role.id,
                "name": user.role.name
            } if hasattr(user, "role") and user.role else None,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_200_OK)


class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")

        if not email:
            return Response({"error": "Vui lòng nhập email."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Email không tồn tại trong hệ thống."}, status=status.HTTP_404_NOT_FOUND)

        # Tạo link reset
        uidb64, token = generate_reset_link(user)
        reset_link = f"http://localhost:3000/reset-password/{uidb64}/{token}/"

        # Gửi email
        send_mail(
            subject="Đặt lại mật khẩu - GreenFarm",
            message=f"Nhấn vào link sau để đặt lại mật khẩu: {reset_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
        )

        return Response({"message": "Email đặt lại mật khẩu đã được gửi."}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token, *args, **kwargs):
        password = request.data.get("password")

        if not password:
            return Response({"error": "Vui lòng nhập mật khẩu mới."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({"error": "Người dùng không tồn tại."}, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra token
        if not token_generator.check_token(user, token):
            return Response({"error": "Token không hợp lệ hoặc đã hết hạn."}, status=status.HTTP_400_BAD_REQUEST)

        # Đổi mật khẩu
        user.set_password(password)
        user.save()

        return Response({"message": "Mật khẩu đã được thay đổi thành công."}, status=status.HTTP_200_OK)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            # Giải mã UID
            uid = int(urlsafe_base64_decode(uidb64).decode())
            print("uidb64:", uidb64, "token:", token)
            user = get_object_or_404(CustomUser, pk=uid)
            print("User found:", user.username, user.status)
            # Kiểm tra token
            if default_token_generator.check_token(user, token):
                if user.status != "active":
                    user.status = "active"
                    user.save()

                # Tạo access + refresh token JWT
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)

                # Redirect sang frontend kèm token
                redirect_url = f"{FRONTEND_URL}/verify-email?access={access_token}&refresh={refresh_token}&username={user.username}"
                return HttpResponseRedirect(redirect_url)

            else:
                redirect_url = f"{FRONTEND_URL}/verify-failed"
                return HttpResponseRedirect(redirect_url)

        except Exception as e:
            print("Lỗi xác thực email:", e)
            redirect_url = f"{FRONTEND_URL}/verify-failed"
            return HttpResponseRedirect(redirect_url)
        
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        # Chỉ cho phép login nếu status = active
        if self.user.status != "active":
            if self.user.status == "pending":
                raise AuthenticationFailed("Tài khoản chưa được xác thực. Vui lòng kiểm tra email!")
            elif self.user.status == "inactive":
                raise AuthenticationFailed("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.")
            else:
                raise AuthenticationFailed("Tài khoản không hợp lệ.")

        return data
# -------------------- ROLE --------------------
class RoleCreateView(APIView):
    def post(self, request):
        serializer = RoleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class RoleListView(ListAPIView):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [AllowAny]


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]


# -------------------- ADDRESS --------------------
class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["patch"])
    def set_default(self, request, pk=None):
        address = self.get_object()
        Address.objects.filter(user=request.user).update(is_default=False)
        address.is_default = True
        address.save()
        return Response({"status": "Đã đặt địa chỉ mặc định"})


# -------------------- POINTS --------------------
class UserPointsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            change = int(request.data.get("points", 0))
        except (ValueError, TypeError):
            return Response({"error": "Điểm không hợp lệ"}, status=400)

        request.user.points += change
        request.user.save()
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        try:
            change = int(request.data.get("points", 0))
        except (ValueError, TypeError):
            return Response({"error": "Điểm không hợp lệ"}, status=400)

        if change < 0:
            return Response({"error": "Điểm cần giảm phải dương"}, status=400)

        if request.user.points >= change:
            request.user.points -= change
            request.user.save()
            return Response(UserSerializer(request.user).data)
        return Response({"error": "Không đủ điểm"}, status=400)


# -------------------- PERMISSION TEST --------------------
class AdminOnlyView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response({"message": "Chỉ Admin xem được"})


class VerifyAdminView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        is_admin = user.is_superuser or getattr(user, "is_admin", False)
        return Response(
            {
                "is_admin": is_admin,
                "username": user.username,
                "email": user.email,
                "role": "admin"
                if is_admin
                else ("seller" if getattr(user, "is_seller", False) else "user"),
            }
        )


class SellerOnlyView(APIView):
    permission_classes = [IsAuthenticated, IsSeller]

    def get(self, request):
        return Response({"message": "Chỉ Seller xem được"})


class NormalUserOnlyView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def get(self, request):
        return Response({"message": "Chỉ người dùng thường xem được"})


# -------------------- EMPLOYEE --------------------
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.filter(role__name="employee")
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

# API quản lý người dùng
class UserManagementViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        print("DEBUG USERS:", list(queryset.values("id", "username", "role__name", "is_active")))
        return super().list(request, *args, **kwargs)


    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """Cập nhật thông tin người dùng"""
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Xóa người dùng"""
        return super().destroy(request, *args, **kwargs)

# -------------------- DASHBOARD --------------------
class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Tổng số liệu cơ bản
        total_users = CustomUser.objects.count()
        total_products = Product.objects.count()
        total_orders = Order.objects.count()

        # Tổng doanh thu: chỉ tính các đơn hàng thành công
        total_revenue = (
            Order.objects.filter(status="success")
            .aggregate(Sum("total_price"))["total_price__sum"] or 0
        )

        # Seller đang hoạt động và pending
        active_sellers = CustomUser.objects.filter(role__name="seller", is_active=True).count()
        pending_sellers = CustomUser.objects.filter(role__name="seller", is_active=False).count()

        # Top sản phẩm bán chạy
        top_products = (
            Product.objects.annotate(sales=Count("order_items"))  # <- đã sửa đúng
            .order_by("-sales")[:5]
        )
        top_products_data = [
            {"name": product.name, "sales": product.sales} for product in top_products
        ]

        # Trả về dữ liệu
        return Response({
            "total_users": total_users,
            "total_products": total_products,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "active_sellers": active_sellers,
            "pending_sellers": pending_sellers,
            "top_products": top_products_data,
        })

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class AccountView(generics.RetrieveUpdateAPIView):
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
    
class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    # Lấy thông tin user
    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)

    # Update toàn bộ thông tin user
    def put(self, request):
        serializer = CustomUserSerializer(request.user, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    # Update một phần (ví dụ chỉ sửa email, phone,...)
    def patch(self, request):
        serializer = CustomUserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
class UploadAvatarView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        avatar = request.FILES.get("avatar")
        if not avatar:
            return Response({"error": "No file uploaded"}, status=400)
        request.user.avatar = avatar
        request.user.save()
        return Response({"avatar": request.user.avatar.url})



@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def toggle_user_active(request, pk):
    try:
        user = CustomUser.objects.get(pk=pk)
    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    user.is_active = not user.is_active
    user.save()
    return Response({"id": user.id, "is_active": user.is_active})

class NotificationSSEView(APIView):
    permission_classes = [AllowAny]  # We'll authenticate manually via token

    def get(self, request):
        # Authenticate via token in query string (EventSource doesn't support headers)
        token = request.GET.get('token')
        if not token:
            return Response({"error": "Token required"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            # Verify JWT token
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
        except Exception as e:
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        
        q = Queue()
        with queue_lock:
            if user.id not in user_queues:
                user_queues[user.id] = []
            user_queues[user.id].append(q)

        def event_stream():
            try:
                while True:
                    try:
                        data = q.get(timeout=30)  # wait up to 30s
                        yield f"data: {json.dumps(data)}\n\n"
                    except:
                        # timeout, send ping to keep connection
                        yield f"data: {json.dumps({'type': 'ping'})}\n\n"
            finally:
                with queue_lock:
                    if user.id in user_queues and q in user_queues[user.id]:
                        user_queues[user.id].remove(q)

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class TriggerNotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = request.data.get('user_id')
        notification = request.data.get('notification', {})
        
        if not user_id:
            return Response({"error": "user_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Send notification to user via SSE
        send_notification_to_user(user_id, {
            'type': 'notification',
            'data': notification
        })
        
        return Response({"status": "sent"}, status=status.HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_user(request, pk):
    try:
        user = CustomUser.objects.get(pk=pk)
    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    # Check đã phát sinh đơn hàng
    if Order.all_objects.filter(user=user).exists():
        return Response(
            {"error": "Người dùng đã phát sinh đơn hàng, không thể xóa."},
            status=400
        )

    # Check đã mở cửa hàng
    if Store.objects.filter(owner=user).exists():
        return Response(
            {"error": "Người dùng đã đăng ký cửa hàng, không thể xóa."},
            status=400
        )

    user.delete()
    return Response(status=204)


# -------------------- NOTIFICATIONS --------------------
class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user notifications
    """
    serializer_class = None  # Will be set dynamically
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        from .serializers import NotificationSerializer
        return NotificationSerializer
    
    def get_queryset(self):
        """Return notifications for current user only"""
        Notification = apps.get_model('users', 'Notification')
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        Notification = apps.get_model('users', 'Notification')
        updated = Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'marked_read': updated}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a single notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return Response({'status': 'marked_read'}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        Notification = apps.get_model('users', 'Notification')
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count}, status=status.HTTP_200_OK)
