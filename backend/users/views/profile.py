"""
User profile views
Handles profile management, email/phone changes, avatar uploads
"""

import random
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import default_token_generator
from django.urls import reverse
from django.utils import timezone

from rest_framework import generics, permissions, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

from ..serializers import UserSerializer, AccountSerializer, CustomUserSerializer
from ..utils_views import send_email_change_verification, send_phone_otp_email

# Import models through apps
from django.apps import apps
CustomUser = apps.get_model('users', 'CustomUser')

FRONTEND_URL = "http://localhost:3000"


class UserProfileView(APIView):
    """
    Get and update user profile
    Handles pending email/phone changes with verification
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        """Get current user profile"""
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        """
        Update user profile
        Email and phone changes are staged as pending and require verification
        """
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        messages = []

        # Handle pending email change
        if user.pending_email and user.pending_email != user.email:
            try:
                uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                path = reverse('confirm-email-change', kwargs={"uidb64": uidb64, "token": token})
                verify_link = request.build_absolute_uri(path)
                send_email_change_verification(user, user.pending_email)
                messages.append("Đã gửi email xác nhận thay đổi email.")
            except Exception:
                messages.append("Không thể gửi email xác nhận. Vui lòng thử lại sau.")

        # Handle pending phone change
        if user.pending_phone and user.pending_phone != (user.phone or ""):
            otp = f"{random.randint(0, 999999):06d}"
            user.phone_otp = otp
            user.phone_otp_expires = timezone.now() + timezone.timedelta(minutes=10)
            user.save(update_fields=["phone_otp", "phone_otp_expires"])
            
            if send_phone_otp_email(user, otp):
                messages.append("Đã gửi OTP xác nhận thay đổi số điện thoại qua email.")
            else:
                messages.append("OTP đã được tạo cho số điện thoại mới.")

        # Return updated data with messages
        data = UserSerializer(user, context={'request': request}).data
        data["messages"] = messages
        return Response(data)


class ConfirmEmailChangeView(APIView):
    """
    Confirm email change via verification link
    Redirects to profile page after confirmation
    """
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = int(urlsafe_base64_decode(uidb64).decode())
            user = get_object_or_404(CustomUser, pk=uid)
            
            if default_token_generator.check_token(user, token) and user.pending_email:
                user.email = user.pending_email
                user.pending_email = None
                user.save(update_fields=["email", "pending_email"])
                return HttpResponseRedirect(f"{FRONTEND_URL}/profile")
            
            return HttpResponseRedirect(f"{FRONTEND_URL}/profile?email_change=failed")
        except Exception:
            return HttpResponseRedirect(f"{FRONTEND_URL}/profile?email_change=error")


class ConfirmPhoneChangeView(APIView):
    """
    Confirm phone change via OTP
    """
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


class CurrentUserView(APIView):
    """
    Get current authenticated user info
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)


class AccountView(generics.RetrieveUpdateAPIView):
    """
    Retrieve and update user account settings
    """
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserMeView(APIView):
    """
    Get and update current user information
    Supports both full and partial updates
    """
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        """Get current user info"""
        serializer = CustomUserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        """Full update of user info"""
        serializer = CustomUserSerializer(request.user, data=request.data, partial=False, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            messages = []

            # Handle pending email change
            if user.pending_email and user.pending_email != user.email:
                try:
                    send_email_change_verification(user, user.pending_email)
                    messages.append("Đã gửi email xác nhận thay đổi email.")
                except Exception as e:
                    messages.append("Không thể gửi email xác nhận. Vui lòng thử lại sau.")

            # Handle pending phone change
            if user.pending_phone and user.pending_phone != (user.phone or ""):
                try:
                    send_phone_otp_email(user, user.phone_otp)
                    messages.append("Đã gửi OTP xác nhận thay đổi số điện thoại qua email.")
                except Exception:
                    messages.append("OTP đã được tạo cho số điện thoại mới.")

            data = CustomUserSerializer(user, context={'request': request}).data
            data["messages"] = messages
            return Response(data)
        return Response(serializer.errors, status=400)

    def patch(self, request):
        """Partial update of user info"""
        serializer = CustomUserSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            messages = []

            # Handle pending email change
            if user.pending_email and user.pending_email != user.email:
                try:
                    send_email_change_verification(user, user.pending_email)
                    messages.append("Đã gửi email xác nhận thay đổi email.")
                except Exception as e:
                    messages.append("Không thể gửi email xác nhận. Vui lòng thử lại sau.")

            # Handle pending phone change
            if user.pending_phone and user.pending_phone != (user.phone or ""):
                try:
                    send_phone_otp_email(user, user.phone_otp)
                    messages.append("Đã gửi OTP xác nhận thay đổi số điện thoại qua email.")
                except Exception:
                    messages.append("OTP đã được tạo cho số điện thoại mới.")

            data = CustomUserSerializer(user, context={'request': request}).data
            data["messages"] = messages
            return Response(data)
        return Response(serializer.errors, status=400)


class UploadAvatarView(APIView):
    """
    Upload user avatar
    """
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        avatar = request.FILES.get("avatar")
        if not avatar:
            return Response({"error": "No file uploaded"}, status=400)
        
        request.user.avatar = avatar
        request.user.save()
        
        # Build absolute URL for avatar
        avatar_url = request.user.avatar.url
        if not avatar_url.startswith('http'):
            avatar_url = request.build_absolute_uri(avatar_url)
        
        return Response({"avatar": avatar_url})
    

class PublicUserSerializer(serializers.ModelSerializer):
    """
    Serializer rút gọn chỉ lấy thông tin hiển thị Chat
    """
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'avatar', 'full_name']

    def get_full_name(self, obj):
        # Ưu tiên lấy tên đầy đủ, nếu không có thì lấy username
        return obj.get_full_name() or obj.username

class PublicUserRetrieveView(generics.RetrieveAPIView):
    """
    API lấy thông tin cơ bản của user theo ID.
    Dùng cho: Chat, hiển thị người bán/người mua.
    Quyền hạn: Chỉ cần đăng nhập là xem được (IsAuthenticated).
    """
    queryset = CustomUser.objects.filter(is_active=True)
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.IsAuthenticated]


class BankAccountView(APIView):
    """
    Get and update user bank account information for refunds
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current user bank account info"""
        user = request.user
        return Response({
            "bank_name": user.bank_name or "",
            "account_number": user.account_number or "",
            "account_holder_name": user.account_holder_name or "",
        })

    def put(self, request):
        """Update user bank account info"""
        user = request.user
        
        bank_name = request.data.get('bank_name', '').strip()
        account_number = request.data.get('account_number', '').strip()
        account_holder_name = request.data.get('account_holder_name', '').strip()
        
        # Validate inputs
        if not bank_name or not account_number or not account_holder_name:
            return Response(
                {"error": "Vui lòng điền đầy đủ thông tin ngân hàng"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update user bank info
        user.bank_name = bank_name
        user.account_number = account_number
        user.account_holder_name = account_holder_name
        user.save(update_fields=['bank_name', 'account_number', 'account_holder_name'])
        
        return Response({
            "message": "Cập nhật thông tin ngân hàng thành công",
            "bank_name": user.bank_name,
            "account_number": user.account_number,
            "account_holder_name": user.account_holder_name,
        })
