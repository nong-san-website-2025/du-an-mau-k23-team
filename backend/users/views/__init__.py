"""
Users app views package
Tách các views thành modules nhỏ theo chức năng
"""

from .auth import (
    LoginView,
    RegisterView,
    logout_view,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    VerifyEmailView,
    CustomTokenObtainPairSerializer,
)
from .profile import (
    UserProfileView,
    ConfirmEmailChangeView,
    ConfirmPhoneChangeView,
    UploadAvatarView,
    UserMeView,
    CurrentUserView,
    AccountView,
)
from .address import AddressViewSet
from .points import UserPointsView
from .wallet import WalletBalanceView
from .notifications import (
    NotificationViewSet,
    NotificationSSEView,
    TriggerNotificationView,
    send_notification_to_user,
)
from .admin import (
    UserManagementViewSet,
    UserViewSet,
    DashboardAPIView,
    EmployeeViewSet,
    RoleViewSet,
    RoleCreateView,
    RoleListView,
    VerifyAdminView,
    customer_statistics_report,
    toggle_user_active,
    delete_user,
)
from .social_auth import GoogleLoginView, FacebookLoginView

__all__ = [
    # Auth
    'LoginView',
    'RegisterView',
    'logout_view',
    'PasswordResetRequestView',
    'PasswordResetConfirmView',
    'VerifyEmailView',
    'CustomTokenObtainPairSerializer',
    
    # Profile
    'UserProfileView',
    'ConfirmEmailChangeView',
    'ConfirmPhoneChangeView',
    'UploadAvatarView',
    'UserMeView',
    'CurrentUserView',
    'AccountView',
    
    # Address
    'AddressViewSet',
    
    # Points & Wallet
    'UserPointsView',
    'WalletBalanceView',
    
    # Notifications
    'NotificationViewSet',
    'NotificationSSEView',
    'TriggerNotificationView',
    'send_notification_to_user',
    
    # Admin
    'UserManagementViewSet',
    'UserViewSet',
    'DashboardAPIView',
    'EmployeeViewSet',
    'RoleViewSet',
    'RoleCreateView',
    'RoleListView',
    'VerifyAdminView',
    'customer_statistics_report',
    'toggle_user_active',
    'delete_user',
    
    # Social Auth
    'GoogleLoginView',
    'FacebookLoginView',
]