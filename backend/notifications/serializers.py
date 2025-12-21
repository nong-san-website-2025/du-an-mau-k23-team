# notifications/serializers.py
from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        # Liệt kê các trường bạn muốn trả về cho React
        fields = [
            'id', 
            'user', 
            'title', 
            'message', 
            'type', 
            'is_read', 
            'metadata', 
            'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']