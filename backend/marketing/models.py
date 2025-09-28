# apps/marketing/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()

class Banner(models.Model):
    POSITION_CHOICES = [
        ("hero", "Hero - top"),
        ("carousel", "Carousel"),
        ("side", "Sidebar"),
        ("mobile", "Mobile only"),
        ("modal", "Modal popup"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, blank=True)
    image = models.ImageField(upload_to="banners/%Y/%m/")
    click_url = models.URLField(blank=True, null=True)
    position = models.CharField(max_length=20, choices=POSITION_CHOICES, default="carousel")
    priority = models.IntegerField(default=0)  # higher renders first
    start_at = models.DateTimeField(default=timezone.now)
    end_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    target_category = models.ForeignKey("products.Category", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ["-priority", "-start_at"]

    def __str__(self):
        return self.title or f"Banner {self.id}"

    def is_live(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if self.start_at and now < self.start_at:
            return False
        if self.end_at and now > self.end_at:
            return False
        return True
