"""
Authentication views
Handles login, register, logout, password reset, email verification
"""

import json
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.utils.encoding import force_str, force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import default_token_generator

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import TokenError, AuthenticationFailed
from rest_framework_simplejwt.views import TokenRefreshView as SimpleJWTTokenRefreshView

from ..serializers import RegisterSerializer
from ..utils import token_generator, generate_reset_link
from ..utils_views import send_verification_email, get_client_ip

# Import models through apps to avoid circular imports
from django.apps import apps
CustomUser = apps.get_model('users', 'CustomUser')

FRONTEND_URL = "http://localhost:3000"
User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint
    Creates user with 'pending' status and sends verification email
    """
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Save user with pending status
        user = serializer.save(status="pending")

        # Send verification email
        send_verification_email(user, request)

        return Response({
            "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
            "username": user.username,
            "email": user.email
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    User login endpoint
    Authenticates user and returns JWT tokens
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"detail": "Vui lòng nhập username và password"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate user
        user = authenticate(username=username, password=password)
        if not user:
            return Response(
                {"detail": "Tên đăng nhập hoặc mật khẩu không chính xác"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check user active/locked state
        # Block login when core flag is_active=False OR custom status != "active"
        if not user.is_active:
            return Response(
                {"detail": "Tài khoản đã bị khóa.", "code": "account_locked"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check custom status
        if user.status != "active":
            if user.status == "pending":
                return Response(
                    {"detail": "Tài khoản chưa được xác thực. Vui lòng kiểm tra email!", "code": "account_pending"},
                    status=status.HTTP_403_FORBIDDEN
                )
            elif user.status == "inactive":
                return Response(
                    {"detail": "Tài khoản đã bị khóa.", "code": "account_locked"},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Additional business rule: block seller if their shop is locked
        try:
            if user.role and user.role.name.lower() == "seller" and hasattr(user, "seller") and user.seller:
                if user.seller.status == "locked":
                    return Response(
                        {"detail": "Tài khoản người bán của bạn đã bị khóa.", "code": "seller_locked"},
                        status=status.HTTP_403_FORBIDDEN
                    )
        except Exception as e:
            # Do not fail login due to check error; just log
            print("Seller lock check failed:", e)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        # Get role info
        role_data = {
            "id": user.role.id,
            "name": user.role.name
        } if user.role else None

        # Log seller activity
        if user.role and user.role.name.lower() == "seller":
            try:
                from sellers.models import SellerActivityLog
                seller = user.seller
                SellerActivityLog.objects.create(
                    seller=seller,
                    action="login",
                    description=f"Đăng nhập từ IP: {get_client_ip(request)}"
                )
            except Exception as e:
                print(f"Failed to log seller activity: {e}")

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": role_data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_200_OK)


@csrf_exempt
@require_POST
def logout_view(request):
    """
    User logout endpoint
    Blacklists refresh token and logs seller activity
    """
    try:
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"detail": "Invalid JSON in request body"}, status=400)

        refresh_token = body.get("refresh")
        if not refresh_token:
            return JsonResponse({"detail": "Refresh token is required"}, status=400)

        # Decode refresh token to get user
        token = RefreshToken(refresh_token)
        user = User.objects.get(id=token["user_id"])

        # Log seller activity
        if hasattr(user, 'role') and user.role and user.role.name.lower() == "seller":
            try:
                if hasattr(user, 'seller') and user.seller:
                    from sellers.models import SellerActivityLog
                    log = SellerActivityLog.objects.create(
                        seller=user.seller,
                        action="logout",
                        description=f"Đăng xuất từ IP: {get_client_ip(request)}"
                    )
                    print(f"✅ Seller logout log created: {log.id}")
            except Exception as log_error:
                print(f"Warning: Failed to log seller activity: {log_error}")

        # Blacklist token
        try:
            token.blacklist()
        except Exception as blacklist_error:
            print(f"Warning: Failed to blacklist token: {blacklist_error}")

        return JsonResponse({"detail": "Đăng xuất thành công"}, status=200)

    except TokenError:
        return JsonResponse({"detail": "Invalid or expired refresh token"}, status=400)
    except User.DoesNotExist:
        return JsonResponse({"detail": "User not found"}, status=400)
    except Exception as e:
        print("Logout error:", e)
        return JsonResponse({"detail": "Logout failed"}, status=500)


class PasswordResetRequestView(generics.GenericAPIView):
    """
    Request password reset
    Sends reset link via email
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")

        if not email:
            return Response(
                {"error": "Vui lòng nhập email."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "Email không tồn tại trong hệ thống."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Generate reset link
        uidb64, token = generate_reset_link(user)
        reset_link = f"{FRONTEND_URL}/reset-password/{uidb64}/{token}/"

        # Send email
        send_mail(
            subject="Đặt lại mật khẩu - GreenFarm",
            message=f"Nhấn vào link sau để đặt lại mật khẩu: {reset_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
        )

        return Response(
            {"message": "Email đặt lại mật khẩu đã được gửi."},
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(generics.GenericAPIView):
    """
    Confirm password reset
    Verifies token and updates password
    """
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token, *args, **kwargs):
        password = request.data.get("password")

        if not password:
            return Response(
                {"error": "Vui lòng nhập mật khẩu mới."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                {"error": "Người dùng không tồn tại."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify token
        if not token_generator.check_token(user, token):
            return Response(
                {"error": "Token không hợp lệ hoặc đã hết hạn."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update password
        user.set_password(password)
        user.save()

        return Response(
            {"message": "Mật khẩu đã được thay đổi thành công."},
            status=status.HTTP_200_OK
        )


class VerifyEmailView(APIView):
    """
    Email verification endpoint
    Activates user account and redirects to frontend
    """
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            # Decode UID
            uid = int(urlsafe_base64_decode(uidb64).decode())
            print("uidb64:", uidb64, "token:", token)
            user = get_object_or_404(CustomUser, pk=uid)
            print("User found:", user.username, user.status)

            # Verify token
            if default_token_generator.check_token(user, token):
                if user.status != "active":
                    user.status = "active"
                    user.save()

                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)

                # Redirect to frontend with tokens
                redirect_url = (
                    f"{FRONTEND_URL}/verify-email?"
                    f"access={access_token}&"
                    f"refresh={refresh_token}&"
                    f"username={user.username}"
                )
                return HttpResponseRedirect(redirect_url)
            else:
                redirect_url = f"{FRONTEND_URL}/verify-failed"
                return HttpResponseRedirect(redirect_url)

        except Exception as e:
            print("Lỗi xác thực email:", e)
            redirect_url = f"{FRONTEND_URL}/verify-failed"
            return HttpResponseRedirect(redirect_url)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer
    Validates user status before issuing tokens
    """
    def validate(self, attrs):
        data = super().validate(attrs)

        # Block if core flag is_active False
        if not self.user.is_active:
            raise AuthenticationFailed("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.")

        # Only allow login if custom status is active
        if self.user.status != "active":
            if self.user.status == "pending":
                raise AuthenticationFailed("Tài khoản chưa được xác thực. Vui lòng kiểm tra email!")
            elif self.user.status == "inactive":
                raise AuthenticationFailed("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.")
            else:
                raise AuthenticationFailed("Tài khoản không hợp lệ.")

        # Block seller when their seller profile is locked
        try:
            role_name = (self.user.role.name if self.user.role else "").lower()
            if role_name == "seller" and hasattr(self.user, "seller") and self.user.seller:
                if self.user.seller.status == "locked":
                    raise AuthenticationFailed("Tài khoản người bán của bạn đã bị khóa.")
        except Exception:
            pass

        return data


class CustomTokenRefreshView(SimpleJWTTokenRefreshView):
    """
    Custom TokenRefreshView to handle cases where user has been deleted
    but token is still valid (in the database).
    """
    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except CustomUser.DoesNotExist:
            return Response(
                {"detail": "Tài khoản không tồn tại. Vui lòng đăng nhập lại.", "code": "user_not_found"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except TokenError as e:
            return Response(
                {"detail": "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.", "code": "token_invalid"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Token refresh error: {str(e)}")
            return Response(
                {"detail": "Lỗi xác thực. Vui lòng đăng nhập lại.", "code": "auth_error"},
                status=status.HTTP_401_UNAUTHORIZED
            )