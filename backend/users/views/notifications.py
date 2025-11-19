"""
Notifications views
Handles user notifications management and real-time SSE streaming
"""

import json
from queue import Queue
from threading import Lock

from django.apps import apps
from django.http import StreamingHttpResponse
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication


# Global queue management for SSE
user_queues = {}
queue_lock = Lock()


def send_notification_to_user(user_id, data):
    """
    Send notification to all active SSE connections for a user
    """
    with queue_lock:
        if user_id in user_queues:
            for q in user_queues[user_id][:]:  # Copy to avoid modification during iteration
                try:
                    q.put_nowait(data)
                except:
                    user_queues[user_id].remove(q)


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user notifications
    - List user's notifications
    - Mark notifications as read
    - Get unread count
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Dynamically import serializer to avoid circular imports"""
        from ..serializers import NotificationSerializer
        return NotificationSerializer
    
    def get_queryset(self):
        """Return notifications for current user only"""
        Notification = apps.get_model('users', 'Notification')
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        Mark all unread notifications as read
        Returns count of notifications marked
        """
        Notification = apps.get_model('users', 'Notification')
        updated = Notification.objects.filter(
            user=request.user, 
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'marked_read': updated}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark a single notification as read
        """
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return Response({'status': 'marked_read'}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Get count of unread notifications
        """
        Notification = apps.get_model('users', 'Notification')
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count}, status=status.HTTP_200_OK)


class NotificationSSEView(APIView):
    """
    Server-Sent Events (SSE) endpoint for real-time notifications
    Clients connect via EventSource with JWT token in query params
    """
    permission_classes = [AllowAny]  # Manual authentication via token

    def get(self, request):
        # Authenticate via token in query string (EventSource doesn't support headers)
        token = request.GET.get('token')
        if not token:
            return Response(
                {"error": "Token required"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            # Verify JWT token
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
        except Exception as e:
            return Response(
                {"error": "Invalid token"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Create queue for this connection
        q = Queue()
        with queue_lock:
            if user.id not in user_queues:
                user_queues[user.id] = []
            user_queues[user.id].append(q)

        def event_stream():
            """Generator for SSE stream"""
            try:
                while True:
                    try:
                        # Wait up to 30 seconds for new notification
                        data = q.get(timeout=30)
                        yield f"data: {json.dumps(data)}\n\n"
                    except:
                        # Timeout - send ping to keep connection alive
                        yield f"data: {json.dumps({'type': 'ping'})}\n\n"
            finally:
                # Clean up on disconnect
                with queue_lock:
                    if user.id in user_queues and q in user_queues[user.id]:
                        user_queues[user.id].remove(q)

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class TriggerNotificationView(APIView):
    """
    Trigger notification to specific user via SSE
    Used internally to push notifications to connected clients
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = request.data.get('user_id')
        notification = request.data.get('notification', {})
        
        if not user_id:
            return Response(
                {"error": "user_id required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Send notification to user via SSE
        send_notification_to_user(user_id, {
            'type': 'notification',
            'data': notification
        })
        
        return Response({"status": "sent"}, status=status.HTTP_200_OK)