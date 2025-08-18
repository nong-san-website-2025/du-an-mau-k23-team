from rest_framework import serializers
from .models import Seller, Shop, Product, Order, Voucher

class SellerSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Seller
        fields = [
            "id", "store_name", "bio", "address", "phone", "image",
            "created_at", "user", "user_username", "user_email"
        ]
        read_only_fields = ["created_at"]  # chỉ để created_at readonly

    def update(self, instance, validated_data):
        request = self.context.get("request")
        # Nếu không phải admin -> không cho đổi user
        if not (request and request.user.is_staff):
            validated_data.pop("user", None)
        return super().update(instance, validated_data)



class ShopSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = Shop
        fields = ["id", "name", "description", "owner", "owner_username", "created_at", "is_active"]


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = "__all__"

class VoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = "__all__"
