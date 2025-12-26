from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from users.models import Notification
from .serializers import NotificationSerializer

# --- [THÊM ĐOẠN NÀY] ---
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
# -----------------------

class NotificationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    # API: /api/notifications/mark_all_as_read/
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        # Update DB
        request.user.user_notifications.filter(is_read=False).update(is_read=True)
        
        # Bắn WebSocket
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f"user_notifications_{request.user.id}", # [LƯU Ý] Check lại tên group cho khớp consumers.py
                    {
                        "type": "send_notification",
                        "event": "mark_all_read",
                        "unread_count": 0
                    }
                )
        except Exception as e:
            print(f"Lỗi gửi socket mark_all_as_read: {e}")

        return Response({'status': 'ok'})

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['get'])
    def count_unread(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})