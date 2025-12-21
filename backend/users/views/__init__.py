"""
Users app views package
Organized by functionality across modules
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
    PublicUserRetrieveView,
)
from .address import AddressViewSet
from .points import UserPointsView
from .wallet import (
    WalletBalanceView,
    WalletTransactionHistoryView,
    WalletDepositView,
    WalletWithdrawView,
)
from .notifications import (
    NotificationViewSet,
    notification_sse_view,
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
    UserListView,
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
    'PublicUserRetrieveView',
    
    # Address
    'AddressViewSet',
    
    # Points
    'UserPointsView',
    
    # Wallet
    'WalletBalanceView',
    'WalletTransactionHistoryView',
    'WalletDepositView',
    'WalletWithdrawView',
    
    # Notifications
    'NotificationViewSet',
    'notification_sse_view',
    'TriggerNotificationView',
    'send_notification_to_user',
    
    # Admin
    'UserManagementViewSet',
    'UserViewSet',
    'UserListView',
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
