from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import make_password
from django.core.cache import cache
from django.core.mail import send_mail
from django.db.models import Sum, Count
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .serializers import AccountSerializer, ChangePasswordSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import ProfileSerializer
from .serializers import CustomUserSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser



import random

from payments.models import Payment
from .models import CustomUser, Address, Role
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ForgotPasswordSerializer,
    AddressSerializer,
    EmployeeSerializer,
    RoleSerializer,
)
from .permissions import IsAdmin, IsSeller, IsNormalUser
from products.models import Product
from orders.models import Order


User = get_user_model()

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
class GoogleLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response(
                {"error": "Thiếu token"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            CLIENT_ID = "638143772671-m6e09jr0o9smb5l1n24bhv7tpeskmvu3.apps.googleusercontent.com"
            idinfo = id_token.verify_oauth2_token(
                token, google_requests.Request(), CLIENT_ID
            )

            email = idinfo.get("email")
            name = idinfo.get("name", "")

            if not email:
                return Response(
                    {"error": "Không lấy được email từ Google"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user, _ = CustomUser.objects.get_or_create(
                email=email,
                defaults={
                    "username": email.split("@")[0],
                    "first_name": name,
                    "is_active": True,
                },
            )

            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "email": email,
                    "username": user.username,
                    "is_admin": user.is_admin,
                    "is_seller": user.is_seller,
                }
            )

        except ValueError:
            return Response(
                {"error": "Token Google không hợp lệ"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=500)


# -------------------- AUTH / USER --------------------
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"error": "Vui lòng cung cấp username và password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(username=username, password=password)
        if not user:
            return Response(
                {"error": "Tài khoản hoặc mật khẩu không chính xác."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)

        # Determine role consistently
        if user.is_superuser or getattr(user, "is_admin", False) or (getattr(user, "role", None) and getattr(user.role, "name", None) == "admin"):
            role_name = "admin"
        elif getattr(user, "is_seller", False) or (getattr(user, "role", None) and getattr(user.role, "name", None) == "seller"):
            role_name = "seller"
        else:
            role_name = "customer"

        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "username": user.username,
                "email": user.email,
                "role": role_name,
                "is_admin": role_name == "admin",
                "is_seller": role_name == "seller",
            }
        )


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class UserListView(ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer


@method_decorator(csrf_exempt, name="dispatch")
class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]


# -------------------- PASSWORD RESET --------------------
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            try:
                user = CustomUser.objects.get(email=email)
                code = random.randint(100000, 999999)

                cache.set(f"forgot_password_code_{email}", code, timeout=300)
                user.reset_code = code
                user.save()

                send_mail(
                    "Mã khôi phục mật khẩu",
                    f"Mã xác nhận của bạn là: {code}",
                    "noreply@greenfarm.com",
                    [email],
                )
                return Response({"message": "Đã gửi mã khôi phục về email!"})
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "Email không tồn tại!"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return Response(serializer.errors, status=400)


class VerifyCodeAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")

        if not email or not code:
            return Response({"error": "Thiếu thông tin"}, status=400)

        saved_code = cache.get(f"forgot_password_code_{email}")
        if saved_code is None:
            return Response({"error": "Mã đã hết hạn"}, status=400)
        if str(saved_code) != str(code):
            return Response({"error": "Mã xác thực không đúng"}, status=400)

        cache.set(f"reset_password_allowed_{email}", True, timeout=600)
        return Response({"message": "Xác thực thành công"})


class ResetPasswordAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        new_password = request.data.get("password")

        allowed = cache.get(f"reset_password_allowed_{email}")
        if not allowed:
            return Response(
                {"error": "Bạn chưa xác thực mã hoặc phiên đã hết hạn."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            user = CustomUser.objects.get(email=email)
            user.password = make_password(new_password)
            user.save()
        except CustomUser.DoesNotExist:
            return Response({"error": "Tài khoản không tồn tại"}, status=404)

        cache.delete(f"reset_password_allowed_{email}")
        cache.delete(f"forgot_password_code_{email}")
        return Response({"message": "Đặt lại mật khẩu thành công!"})


# -------------------- PASSWORD CHANGE --------------------
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            old_password = serializer.validated_data["old_password"]
            new_password = serializer.validated_data["new_password"]

            if not request.user.check_password(old_password):
                return Response(
                    {"error": "Mật khẩu hiện tại không đúng."}, status=400
                )

            request.user.set_password(new_password)
            request.user.save()
            return Response({"message": "Đổi mật khẩu thành công!"})
        return Response(serializer.errors, status=400)


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

    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)
    
    
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

@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_user(request, pk):
    try:
        user = CustomUser.objects.get(pk=pk)
    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    # Kiểm tra nếu có hoạt động → không cho xóa
    has_products = Product.objects.filter(seller__user=user).exists()
    has_orders = Order.objects.filter(user=user).exists()

    if has_products or has_orders:
        return Response(
            {"error": "Không thể xóa user đã có hoạt động, hãy khóa thay vì xóa."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)