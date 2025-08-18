from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import (AddressViewSet, WalletBalanceView,
    VerifyAdminView, UserProfileView, ForgotPasswordView, VerifyCodeAPIView, ResetPasswordAPIView, GoogleLoginAPIView, RegisterView, LoginView,)
from .views import UserPointsView
from .views import EmployeeViewSet


router = DefaultRouter()
router.register("addresses", AddressViewSet, basename="address")
router.register("employees", EmployeeViewSet, basename="employee")

# Remove router from here, move to main urls.py for /api/addresses/

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
    path("points/", UserPointsView.as_view(), name="user-points"),
    
]
urlpatterns += router.urls