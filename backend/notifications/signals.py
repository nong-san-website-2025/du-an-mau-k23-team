from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification
from .serializers import NotificationSerializer

@receiver(post_save, sender=Notification)
def send_notification_websocket(sender, instance, created, **kwargs) :
    if created:
        # LOG ĐỂ KIỂM TRA: Nhìn vào Terminal chạy Server xem có dòng này không
        print(f"DEBUG: Dang gui thong bao cho User {instance.user.id}")
        
        channel_layer = get_channel_layer()
        # Quan trọng: Group name phải khớp với Consumer (user_updates_16)
        group_name = f"user_updates_{instance.user.id}"
        
        serializer = NotificationSerializer(instance)
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_notification", # Ten ham trong Consumer
                "event": "new_notification",
                "data": serializer.data
            }
        )