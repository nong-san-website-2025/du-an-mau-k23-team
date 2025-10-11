from rest_framework import serializers
from .models import ShippingSetting, ReturnPolicySetting, MarketingAutomationSetting, LoyaltySetting, ThemeSetting

class ShippingSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingSetting
        fields = '__all__'


class ReturnPolicySettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReturnPolicySetting
        fields = "__all__"


class MarketingAutomationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketingAutomationSetting
        fields = "__all__"


class LoyaltySettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltySetting
        fields = "__all__"

class ThemeSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThemeSetting
        fields = "__all__"
