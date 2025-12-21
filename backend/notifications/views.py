from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer


# class NotificationSerializer(serializers.ModelSerializer):
#     class Meta: model = Notification; fields = '__all__'

class NotificationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        # Trả về thông báo của user hiện tại, cái mới nhất lên đầu
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    # API: /api/notifications/mark_all_as_read/
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'success'}, status=status.HTTP_200_OK)

    # API: /api/notifications/{id}/mark_as_read/
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'success'}, status=status.HTTP_200_OK)
    
