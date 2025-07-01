from rest_framework import serializers
from .models import Seller

class SellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        fields = "__all__"
        read_only_fields = ["user", "created_at"]
