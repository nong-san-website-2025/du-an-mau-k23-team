from rest_framework import serializers
from .models import Advertisement


class AdvertisementSerializer(serializers.ModelSerializer):
    ad_type_display = serializers.CharField(source='get_ad_type_display', read_only=True)
    target_type_display = serializers.CharField(source='get_target_type_display', read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Advertisement
        fields = [
            'id', 'title', 'description', 'image', 'image_url', 'redirect_link',
            'ad_type', 'ad_type_display', 'target_type', 'target_type_display',
            'start_date', 'end_date', 'priority', 'is_active',
            'views', 'clicks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['views', 'clicks', 'created_at', 'updated_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None
