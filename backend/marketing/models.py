# apps/marketing/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()

class AdSlot(models.Model):
    """Định nghĩa khu vực hiển thị quảng cáo (slot)"""
    code = models.SlugField(unique=True, help_text="Mã định danh vị trí, ví dụ: homepage_top, sidebar_right")
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    max_banners = models.PositiveIntegerField(default=1)

    width_hint = models.IntegerField(default=0, help_text="Chiều rộng gợi ý (px)")
    height_hint = models.IntegerField(default=0, help_text="Chiều cao gợi ý (px)")

    def __str__(self):
        return self.name


class Banner(models.Model):
    """Banner / quảng cáo cụ thể"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, blank=True)
    image = models.ImageField(upload_to="banners/%Y/%m/")
    click_url = models.URLField(blank=True, null=True)
    slot = models.ForeignKey(AdSlot, on_delete=models.CASCADE, related_name="banners")
    priority = models.IntegerField(default=0)
    start_at = models.DateTimeField(default=timezone.now)
    end_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-priority", "-start_at"]

    def __str__(self):
        return self.title or f"{self.slot.name} banner"

    def is_live(self):
        now = timezone.now()
        return (
            self.is_active
            and self.start_at <= now
            and (self.end_at is None or now <= self.end_at)
        )
