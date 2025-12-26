from rest_framework import serializers
from .models import SystemConfig, SystemLog, StaticPage, StaticPageBlock

class SystemConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemConfig
        fields = "__all__"

class SystemLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemLog
        fields = "__all__"


class StaticPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaticPage
        fields = [
            "id", "slug", "title", "section", "content_html", "banner_image", "updated_at"
        ]


class StaticPageBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaticPageBlock
        fields = [
            "id", "page", "order", "heading", "body_html", "image", "updated_at"
        ]
