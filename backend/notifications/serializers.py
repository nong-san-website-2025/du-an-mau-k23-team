from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    # Format thời gian đẹp để hiển thị
    created_at_formatted = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = '__all__'

    def get_created_at_formatted(self, obj):
        return obj.created_at.strftime("%H:%M %d/%m/%Y")