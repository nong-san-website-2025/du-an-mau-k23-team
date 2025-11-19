"""
Users app URL configuration
Routes organized by functionality
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    # Auth
    auth,
    # Profile
    profile,
    # Address
    address,
    # Points & Wallet
    points,
    wallet,
    # Notifications
    notifications,
    # Admin
    admin,
    # Social Auth
    social_auth,
)

# Router for ViewSets
router = DefaultRouter()
router.register('addresses', address.AddressViewSet, basename='address')
router.register('users', admin.UserViewSet, basename='user')
router.register('management', admin.UserManagementViewSet, basename='user-management')
router.register('employees', admin.EmployeeViewSet, basename='employee')
router.register('roles', admin.RoleViewSet, basename='role')
router.register('notifications', notifications.NotificationViewSet, basename='notification')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # ==================== AUTHENTICATION ====================
    path('register/', auth.RegisterView.as_view(), name='register'),
    path('login/', auth.LoginView.as_view(), name='login'),
    path('logout/', auth.logout_view, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Password Reset
    path('password-reset/', auth.PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset-confirm/<str:uidb64>/<str:token>/', 
         auth.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # Email Verification
    path('verify-email/<str:uidb64>/<str:token>/', 
         auth.VerifyEmailView.as_view(), name='verify-email'),
    
    # ==================== PROFILE ====================
    path('profile/', profile.UserProfileView.as_view(), name='profile'),
    path('me/', profile.UserMeView.as_view(), name='user-me'),
    path('current/', profile.CurrentUserView.as_view(), name='current-user'),
    path('account/', profile.AccountView.as_view(), name='account'),
    path('upload-avatar/', profile.UploadAvatarView.as_view(), name='upload-avatar'),
    
    # Email/Phone Change Confirmation
    path('confirm-email-change/<str:uidb64>/<str:token>/', 
         profile.ConfirmEmailChangeView.as_view(), name='confirm-email-change'),
    path('confirm-phone-change/', 
         profile.ConfirmPhoneChangeView.as_view(), name='confirm-phone-change'),
    
    # ==================== POINTS & WALLET ====================
    path('points/', points.UserPointsView.as_view(), name='user-points'),
    path('wallet/balance/', wallet.WalletBalanceView.as_view(), name='wallet-balance'),
    path('wallet/history/', wallet.WalletTransactionHistoryView.as_view(), name='wallet-history'),
    path('wallet/deposit/', wallet.WalletDepositView.as_view(), name='wallet-deposit'),
    path('wallet/withdraw/', wallet.WalletWithdrawView.as_view(), name='wallet-withdraw'),
    
    # ==================== NOTIFICATIONS ====================
    path('notifications/sse/', 
         notifications.NotificationSSEView.as_view(), name='notifications-sse'),
    path('notifications/trigger/', 
         notifications.TriggerNotificationView.as_view(), name='trigger-notification'),
    
    # ==================== SOCIAL AUTH ====================
    path('auth/google/', social_auth.GoogleLoginView.as_view(), name='google-login'),
    path('auth/facebook/', social_auth.FacebookLoginView.as_view(), name='facebook-login'),
    
    # ==================== ADMIN ====================
    path('dashboard/', admin.DashboardAPIView.as_view(), name='dashboard'),
    path('verify-admin/', admin.VerifyAdminView.as_view(), name='verify-admin'),
    
    # User Management
    path('toggle-active/<int:pk>/', admin.toggle_user_active, name='toggle-user-active'),
    path('delete/<int:pk>/', admin.delete_user, name='delete-user'),
    path('list/', admin.UserListView.as_view(), name='user-list'),
    
    # Statistics
    path('statistics/customers/', 
         admin.customer_statistics_report, name='customer-statistics'),
    
    # Roles
    path('roles/create/', admin.RoleCreateView.as_view(), name='role-create'),
    path('roles/list/', admin.RoleListView.as_view(), name='role-list'),
]