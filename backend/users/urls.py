from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, UserProfileView, LoginView, ForgotPasswordView,
    VerifyCodeAPIView, ResetPasswordAPIView, GoogleLoginAPIView,
    get_chat_rooms, get_chat_history, AddressViewSet
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register("addresses", AddressViewSet, basename="address")

urlpatterns = [
    path("register/", RegisterView.as_view(), name='register'),
    path("login/", LoginView.as_view(), name='login'),
    path("token/", TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path("token/refresh/", TokenRefreshView.as_view(), name='token_refresh'),
    path("me/", UserProfileView.as_view(), name='me'),
    path("forgot-password/", ForgotPasswordView.as_view(), name='forgot-password'),
    path("verify-code/", VerifyCodeAPIView.as_view(), name="verify-code"),
    path("reset-password/", ResetPasswordAPIView.as_view(), name='reset-password'),
    path("google-login/", GoogleLoginAPIView.as_view(), name='google-login'),
    path("chat/rooms/", get_chat_rooms, name="chat-rooms"),
    path("chat/history/<str:room_name>/", get_chat_history),
]

# 👇 Đây là phần bạn thiếu
urlpatterns += router.urls
