from rest_framework import serializers
from .models import Seller
from products.models import Product

class ProductMiniSerializer(serializers.ModelSerializer):
    discounted_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'discount', 'discounted_price', 'image', 'location', 'unit', 'stock']

    def get_discounted_price(self, obj):
        return obj.discounted_price

class SellerListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        fields = ['id', 'store_name', 'image', 'address', 'status']

class SellerRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        fields = ['id', 'user', 'store_name', 'bio', 'address', 'phone', 'image']

class SellerDetailSerializer(serializers.ModelSerializer):
    # reverse relation: product_set (default name) -> list sản phẩm của seller
    products = ProductMiniSerializer(many=True, read_only=True, source='product_set')

    class Meta:
        model = Seller
        fields = ['id', 'store_name', 'bio', 'address', 'phone', 'image', 'created_at', 'products']

