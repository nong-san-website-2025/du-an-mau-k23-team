from django.db.models.signals import post_migrate, post_save, post_delete
from django.dispatch import receiver
from .models import Role, CustomUser
from .serializers import UserSerializer
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from decimal import Decimal
from datetime import datetime, date
import uuid


@receiver(post_migrate)
def create_default_roles(sender, **kwargs):
    if sender.name != 'users':
        return
    if sender.name == "users":  # chỉ chạy khi migrate app users
        default_roles = ["admin", "seller", "customer"]
        for role_name in default_roles:
            Role.objects.get_or_create(name=role_name)


def make_json_safe(obj):
    """Recursively convert non-JSON-serializable types to primitives.

    - Decimal -> float
    - datetime/date -> isoformat string
    - UUID -> str
    - bytes -> decode utf-8 or repr
    """
    if isinstance(obj, dict):
        return {k: make_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [make_json_safe(v) for v in obj]
    if isinstance(obj, tuple):
        return tuple(make_json_safe(v) for v in obj)
    if isinstance(obj, Decimal):
        try:
            return float(obj)
        except Exception:
            return str(obj)
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, uuid.UUID):
        return str(obj)
    if isinstance(obj, bytes):
        try:
            return obj.decode("utf-8")
        except Exception:
            return str(obj)
    return obj


def send_user_event(action, instance):
    try:
        serializer = UserSerializer(instance)
        data = make_json_safe(serializer.data)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "admin_users",
            {"type": "user_update", "action": action, "data": data},
        )
    except Exception as e:
        # Avoid raising in signal handlers
        print("[users.signals] Error sending user event:", e)


@receiver(post_save, sender=CustomUser)
def user_post_save(sender, instance, created, **kwargs):
    action = "CREATE" if created else "UPDATE"
    send_user_event(action, instance)


@receiver(post_delete, sender=CustomUser)
def user_post_delete(sender, instance, **kwargs):
    send_user_event("DELETE", instance)
