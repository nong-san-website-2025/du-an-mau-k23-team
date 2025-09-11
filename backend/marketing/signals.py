# apps/marketing/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Banner

@receiver(post_save, sender=Banner)
def clear_homepage_cache(sender, instance, **kwargs):
    """
    Khi banner thay đổi, clear cache homepage để frontend nhận data mới
    """
    from django.core.cache import cache
    cache.delete("homepage_config_cache")
