from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (AddressViewSet, WalletBalanceView,
    VerifyAdminView, UserProfileView, ForgotPasswordView, VerifyCodeAPIView, ResetPasswordAPIView, GoogleLoginAPIView, RegisterView, LoginView,)
from .views import UserPointsView
from .views import EmployeeViewSet
from users import views
from .views import CurrentUserView
from .views import UserMeView, UploadAvatarView 
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import DashboardAPIView



# Router tự động cho ViewSet
router = DefaultRouter()

router.register(r'users', views.UserViewSet, basename='user')
router.register(r'roles', views.RoleViewSet, basename='role')
router.register(r'addresses', views.AddressViewSet, basename='address')
router.register("employees", EmployeeViewSet, basename="employee")
router.register(r'user-management', views.UserManagementViewSet, basename='user-management')


urlpatterns = [
    # Authentication
    path("register/", views.RegisterView.as_view(), name='register'),
    path("login/", views.LoginView.as_view(), name='login'),
    path("token/", TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path("token/refresh/", TokenRefreshView.as_view(), name='token_refresh'),
    path("google-login/", views.GoogleLoginAPIView.as_view(), name='google-login'),

    # User profile & password
    path("me/", views.UserProfileView.as_view(), name='me'),
    path("forgot-password/", views.ForgotPasswordView.as_view(), name='forgot-password'),
    path("verify-code/", views.VerifyCodeAPIView.as_view(), name="verify-code"),
    path("reset-password/", views.ResetPasswordAPIView.as_view(), name='reset-password'),
    path("change-password/", views.ChangePasswordView.as_view(), name='change-password'),

    # Points
    path("points/", views.UserPointsView.as_view(), name="user-points"),

    # Roles management
    path("roles/", views.RoleCreateView.as_view(), name="role-create"),
    path("roles/list/", views.RoleListView.as_view(), name="role-list"),

    # User list/detail
    path("", views.UserListView.as_view(), name="user-list"),
    path("<int:pk>/", views.UserDetailView.as_view(), name='user-detail'),

    # Include router urls
    path('', include(router.urls)),

    path("dashboard/", DashboardAPIView.as_view(), name="dashboard"),

    # path('user/me/', CurrentUserView.as_view(), name='current-user'),

    path('user/me/', UserMeView.as_view(), name='user-me'),

    path("user/upload-avatar/", UploadAvatarView.as_view(), name="upload-avatar"),
]
