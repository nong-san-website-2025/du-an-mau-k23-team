from rest_framework import serializers
from .models import Advertisement

class AdvertisementSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Advertisement
        fields = [
            'id', 'title', 'description', 'image',
            'redirect_link', 'ad_type', 'start_date', 'end_date',
            'priority', 'is_active'
        ]

    def get_image(self, obj):
        """Trả về link ảnh đầy đủ"""
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None
