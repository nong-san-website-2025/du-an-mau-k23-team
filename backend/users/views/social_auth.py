"""
Social authentication views
Handles Google and Facebook OAuth login
"""

import requests
from django.contrib.auth import get_user_model
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

User = get_user_model()


@method_decorator(csrf_exempt, name="dispatch")
class GoogleLoginView(APIView):
    """
    Google OAuth2 login endpoint
    Receives token from frontend, validates with Google, returns JWT
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Get token from frontend
            token = request.data.get("token")
            if not token:
                return Response(
                    {"error": "Thiếu token từ frontend"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verify token with Google
            try:
                idinfo = id_token.verify_oauth2_token(
                    token, 
                    google_requests.Request()
                )
            except ValueError:
                return Response(
                    {"error": "Token không hợp lệ hoặc đã hết hạn"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Extract user info from Google
            google_user_id = idinfo.get("sub")
            email = idinfo.get("email")
            name = idinfo.get("name")
            picture = idinfo.get("picture", "")

            if not email:
                return Response(
                    {"error": "Không thể xác định email từ Google"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get or create user
            user, created = User.objects.get_or_create(
                username=email,
                defaults={
                    "email": email,
                    "first_name": name
                }
            )

            # Update existing user info
            if not created:
                updated = False
                if user.first_name != name:
                    user.first_name = name
                    updated = True
                if updated:
                    user.save()

            # Generate JWT tokens
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
    """
    Facebook OAuth login endpoint
    Validates access token with Facebook Graph API, returns JWT
    """
    permission_classes = [AllowAny]

    def post(self, request):
        access_token = request.data.get("accessToken")

        if not access_token:
            return Response(
                {"error": "Access token không hợp lệ"}, 
                status=400
            )

        # Call Facebook Graph API to get user info
        url = f"https://graph.facebook.com/me?fields=id,name,email&access_token={access_token}"
        response = requests.get(url)
        data = response.json()

        if "error" in data:
            return Response(
                {"error": "Token Facebook không hợp lệ"}, 
                status=400
            )

        facebook_id = data.get("id")
        name = data.get("name")
        email = data.get("email", f"{facebook_id}@facebook.com")  # Fallback if no email

        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": name,
                "password": User.objects.make_random_password(),
            },
        )

        # Generate JWT tokens
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