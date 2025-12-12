from django.db import models

class ShippingSetting(models.Model):
    PROVIDER_CHOICES = [
        ('ghn', 'Giao Hàng Nhanh'),
        ('ghtk', 'Giao Hàng Tiết Kiệm'),
        ('viettelpost', 'Viettel Post'),
    ]

    provider = models.CharField(
        max_length=50,
        choices=PROVIDER_CHOICES,
        blank=True,
        null=True
    )
    fee_rule = models.TextField(blank=True, null=True)
    delivery_time = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Shipping Setting ({self.provider or 'Chưa chọn'})"



class ReturnPolicySetting(models.Model):
    return_days = models.PositiveIntegerField(default=7)
    return_products = models.JSONField(default=list, blank=True, null=True)
    complaint_process = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Return Policy ({self.return_days} days)"
    

class MarketingAutomationSetting(models.Model):
    enable_email = models.BooleanField(default=False)
    enable_sms = models.BooleanField(default=False)
    season_campaign = models.CharField(max_length=255, blank=True, null=True)
    discount_schedule = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return "Marketing Automation Settings"
    


class LoyaltySetting(models.Model):
    point_rule = models.CharField(max_length=255, blank=True, null=True)
    point_exchange = models.CharField(max_length=255, blank=True, null=True)
    ranks = models.JSONField(default=list, blank=True, null=True)

    class Meta:
        verbose_name = "Loyalty Setting"
        verbose_name_plural = "Loyalty Settings"

    def __str__(self):
        return "Loyalty Setting"

class ThemeSetting(models.Model):
    logo = models.ImageField(upload_to="settings/logo/", null=True, blank=True)
    banner = models.ImageField(upload_to="settings/banner/", null=True, blank=True)
    brand_color = models.CharField(max_length=20, default="#ffffff")
    theme_event = models.CharField(
        max_length=50,
        choices=[
            ("default", "Mặc định"),
            ("tet", "Tết"),
            ("noel", "Noel"),
            ("summer", "Mùa hè"),
        ],
        default="default",
    )

    def __str__(self):
        return f"Giao diện ({self.theme_event})"