from django.contrib.auth.hashers import make_password

from rest_framework import generics, permissions, status
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from .models import CustomUser
from .serializers import UserSerializer, RegisterSerializer, ForgotPasswordSerializer
import random
from django.core.mail import send_mail


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if username is None or password is None:
            return Response({'error': 'Vui lòng cung cấp username và password.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)

        if not user:
            return Response({'error': 'Tài khoản hoặc mật khẩu không chính xác.'}, status=status.HTTP_401_UNAUTHORIZED)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key})
class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = CustomUser.objects.get(email=email)
                code = random.randint(100000, 999999)

                cache.set(f"forgot_password_code_{email}", code, timeout=300)
                # Lưu mã vào database hoặc cache tùy bạn, ví dụ đơn giản:
                user.reset_code = code
                user.save()
                # Gửi email (bạn phải cấu hình SMTP trong settings.py)
                send_mail(
                    'Mã khôi phục mật khẩu',
                    f'Mã xác nhận của bạn là: {code}',
                    'noreply@greenfarm.com',
                    [email],
                    fail_silently=False,
                )
                return Response({"message": "Đã gửi mã khôi phục về email!"})
            except CustomUser.DoesNotExist:
                return Response({"error": "Email không tồn tại!"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyCodeAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")

        if not email or not code:
            return Response({"error": "Thiếu thông tin"}, status=status.HTTP_400_BAD_REQUEST)

        saved_code = cache.get(f"forgot_password_code_{email}")
        print(f"[DEBUG] VERIFY-CODE: email={email}, code={code}, saved_code={saved_code}")
        if saved_code is None:
            print(f"[DEBUG] VERIFY-CODE: Không tìm thấy mã trong cache hoặc đã hết hạn cho email={email}")
            return Response({"error": "Mã đã hết hạn hoặc không tồn tại"}, status=status.HTTP_400_BAD_REQUEST)
        if str(saved_code) != str(code):
            print(f"[DEBUG] VERIFY-CODE: Mã xác thực không đúng cho email={email}")
            return Response({"error": "Mã xác thực không đúng"}, status=status.HTTP_400_BAD_REQUEST)

        # Đặt cache cho phép đặt lại mật khẩu sau khi xác thực thành công
        cache.set(f"reset_password_allowed_{email}", True, timeout=600)  # 10 phút
        print(f"[DEBUG] VERIFY-CODE: Đã set reset_password_allowed_{email} = True")
        return Response({"message": "Xác thực thành công, bạn có thể đặt lại mật khẩu."})

class ResetPasswordAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        email = request.data.get("email")
        new_password = request.data.get("password")

        if not email or not new_password:
            return Response({"error": "Thiếu thông tin"}, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra quyền đặt lại mật khẩu qua cache
        allowed = cache.get(f"reset_password_allowed_{email}")
        print(f"[DEBUG] RESET-PASSWORD: email={email}, allowed={allowed}")
        if not allowed:
            print(f"[DEBUG] RESET-PASSWORD: Không tìm thấy quyền reset_password_allowed cho email={email}")
            return Response({"error": "Bạn chưa xác thực mã hoặc phiên đã hết hạn."}, status=status.HTTP_403_FORBIDDEN)

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({"error": "Tài khoản không tồn tại"}, status=status.HTTP_404_NOT_FOUND)

        user.password = make_password(new_password)
        user.save()

        # Xóa cache sau khi đổi mật khẩu thành công
        cache.delete(f"reset_password_allowed_{email}")
        cache.delete(f"forgot_password_code_{email}")

        return Response({"message": "Đặt lại mật khẩu thành công!"}, status=status.HTTP_200_OK)