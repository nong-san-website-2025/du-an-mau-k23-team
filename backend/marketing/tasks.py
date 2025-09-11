# apps/marketing/tasks.py
from celery import shared_task
from django.utils import timezone
from .models import Banner, FlashSale

@shared_task
def activate_scheduled_campaigns():
    now = timezone.now()
    # Activate banners
    Banner.objects.filter(is_active=False, start_at__lte=now, end_at__gte=now).update(is_active=True)
    # Activate flashsales
    FlashSale.objects.filter(is_active=False, start_at__lte=now, end_at__gte=now).update(is_active=True)

@shared_task
def deactivate_expired_campaigns():
    now = timezone.now()
    # Deactivate banners
    Banner.objects.filter(is_active=True, end_at__lt=now).update(is_active=False)
    # Deactivate flashsales
    FlashSale.objects.filter(is_active=True, end_at__lt=now).update(is_active=False)
