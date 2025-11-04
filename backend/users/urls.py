from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (AddressViewSet, WalletBalanceView,
    VerifyAdminView, UserProfileView, GoogleLoginView, RegisterView, LoginView,)
from .views import EmployeeViewSet
from users import views
from .views import UserMeView, UploadAvatarView
from .views import toggle_user_active
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import DashboardAPIView
from django.views.decorators.csrf import csrf_exempt
from .views import PasswordResetRequestView, PasswordResetConfirmView, FacebookLoginView, VerifyEmailView
from .views import NotificationSSEView, TriggerNotificationView
from django.contrib.auth.views import LogoutView
# from .views import UserManagementView




# Router tự động cho ViewSet
router = DefaultRouter()

router.register(r'roles', views.RoleViewSet, basename='role')
router.register(r'addresses', views.AddressViewSet, basename='address')
router.register(r"employees", EmployeeViewSet, basename="employee")
router.register(r'user-management', views.UserManagementViewSet, basename='user-management')
router.register(r'notifications', views.NotificationViewSet, basename='notification')


urlpatterns = [
    # Authentication
    path("register/", views.RegisterView.as_view(), name='register'),
    path("login/", views.LoginView.as_view(), name='login'),
    path('logout/', views.logout_view, name='logout'),

    path("token/", TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path("token/refresh/", TokenRefreshView.as_view(), name='token_refresh'),
    path("auth/google-login/", GoogleLoginView.as_view(), name="google-login"),
    path("auth/facebook-login/", FacebookLoginView.as_view(), name="facebook-login"),
    path('verify-email/<uidb64>/<token>/', VerifyEmailView.as_view(), name='verify-email'),

    # User profile & password
    path("me/", views.UserProfileView.as_view(), name='me'),
    path("confirm-email-change/<uidb64>/<token>/", views.ConfirmEmailChangeView.as_view(), name="confirm-email-change"),
    path("confirm-phone-change/", views.ConfirmPhoneChangeView.as_view(), name="confirm-phone-change"),
    path('password-reset-request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset-confirm/<uidb64>/<token>/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

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

    # Dashboard
    path("dashboard/", DashboardAPIView.as_view(), name="dashboard"),

    # path('user/me/', CurrentUserView.as_view(), name='current-user'),

    path('users/me/', UserMeView.as_view(), name='user-me'),

    path("user/upload-avatar/", UploadAvatarView.as_view(), name="upload-avatar"),
    path("api/user/profile/", UserProfileView.as_view(), name="user-profile"),
    path("<int:pk>/toggle-active/", toggle_user_active, name="toggle-user-active"),

    # SSE for notifications
    path("notifications/sse/", NotificationSSEView.as_view(), name="notification-sse"),
    path("notifications/trigger/", TriggerNotificationView.as_view(), name="notification-trigger"),

    # path("api/user-management/", UserManagementViewSet.as_view(), name="user-management"),
    
]
