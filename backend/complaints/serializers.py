from rest_framework import serializers
from .models import Complaint, ComplaintMedia

class ComplaintMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintMedia
        fields = ['file']

class ComplaintSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    media_urls = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = '__all__'
        read_only_fields = ['user']

    def get_media_urls(self, obj):
        return [m.file.url for m in obj.media.all()]
