from django.db.models.signals import post_migrate
from django.dispatch import receiver
from .models import Role

@receiver(post_migrate)
def create_default_roles(sender, **kwargs):
    if sender.name != 'users': 
        return
    if sender.name == "users":  # chỉ chạy khi migrate app users
        default_roles = ["admin", "seller", "customer"]
        for role_name in default_roles:
            Role.objects.get_or_create(name=role_name)
