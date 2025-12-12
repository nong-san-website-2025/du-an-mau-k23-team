from rest_framework import serializers
from .models import SearchLog

class SearchLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchLog
        fields = ['id', 'keyword', 'user', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
