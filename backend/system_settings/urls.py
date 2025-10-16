from django.urls import path
from .views import ShippingSettingView, ReturnPolicySettingView, MarketingAutomationSettingView, LoyaltySettingView, ThemeSettingView

urlpatterns = [
    path('settings/shipping/', ShippingSettingView.as_view(), name='shipping-setting'),
    path("settings/return-policy/", ReturnPolicySettingView.as_view(), name="return-policy-settings"),
    path("settings/marketing/", MarketingAutomationSettingView.as_view(), name="marketing-settings"),
    path("settings/loyalty/", LoyaltySettingView.as_view(), name="loyalty-settings"),
    path("settings/theme/", ThemeSettingView.as_view(), name="theme-settings"),
]

