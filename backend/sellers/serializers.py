from rest_framework import serializers
from .models import Seller, Shop

class SellerSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Seller
        fields = ["id", "store_name", "bio", "created_at", "user", "user_username", "user_email"]
        read_only_fields = ["user", "created_at"]


class ShopSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = Shop
        fields = ["id", "name", "description", "owner", "owner_username", "created_at", "is_active"]
