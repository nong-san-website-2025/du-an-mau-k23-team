from rest_framework import serializers
from .models import Product, Category, Subcategory

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'key', 'icon']

class SubcategorySerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    
    class Meta:
        model = Subcategory
        fields = ['id', 'name', 'category']

class ProductSerializer(serializers.ModelSerializer):
    subcategory = SubcategorySerializer(read_only=True)
    seller_name = serializers.CharField(source='seller.name', read_only=True)
    discounted_price = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'discounted_price', 'unit', 
            'stock', 'image', 'rating', 'review_count', 'is_new', 'is_organic', 
            'is_best_seller', 'discount', 'location', 'brand', 'subcategory', 
            'seller_name', 'created_at', 'updated_at'
        ]

class ProductListSerializer(serializers.ModelSerializer):
    """Serializer đơn giản cho danh sách sản phẩm"""
    discounted_price = serializers.ReadOnlyField()
    category_name = serializers.CharField(source='subcategory.category.name', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'discounted_price', 'unit', 'image', 
            'rating', 'review_count', 'is_new', 'is_organic', 'is_best_seller', 
            'discount', 'location', 'brand', 'category_name', 'subcategory_name'
        ]
