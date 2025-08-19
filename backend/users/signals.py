from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, Role

@receiver(post_save, sender=CustomUser)
def assign_default_role(sender, instance, created, **kwargs):
    if created and instance.role is None:
        try:
            default_role = Role.objects.get(name="khách hàng")
            instance.role = default_role
            instance.save()
        except Role.DoesNotExist:
            pass  # Nếu chưa có role "khách hàng" thì bỏ qua
