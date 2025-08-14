from rest_framework import serializers
from .models import Product, Category, Subcategory
from sellers.models import Seller

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
    seller_id = serializers.IntegerField(source='seller.id', read_only=True)
    subcategory_id = serializers.IntegerField(source='subcategory.id', read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True)

    seller = serializers.PrimaryKeyRelatedField(queryset=Seller.objects.all(), write_only=True)
    seller_name = serializers.CharField(source='seller.name', read_only=True)
    subcategory = serializers.PrimaryKeyRelatedField(queryset=Subcategory.objects.all(), write_only=True)
    subcategory_detail = SubcategorySerializer(source='subcategory', read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), write_only=True, required=False)
    category_detail = CategorySerializer(source='category', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    discounted_price = serializers.ReadOnlyField()
    image = serializers.ImageField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'discounted_price', 'unit',
            'stock', 'image', 'rating', 'review_count', 'is_new', 'is_organic',
            'is_best_seller', 'discount', 'location', 'brand',
            'category', 'category_id', 'category_detail', 'category_name',
            'subcategory', 'subcategory_id', 'subcategory_detail',
            'seller', 'seller_id', 'seller_name',
            'created_at', 'updated_at', 'seller_id',
        ]


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer đơn giản cho danh sách sản phẩm"""
    discounted_price = serializers.ReadOnlyField()
    category_name = serializers.CharField(source='subcategory.category.name', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True)
    image = serializers.SerializerMethodField()
    category_id = serializers.IntegerField(source='subcategory.category.id', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'discounted_price', 'unit', 'image', 
            'rating', 'review_count', 'is_new', 'is_organic', 'is_best_seller', 
            'discount', 'location', 'brand', 'category_name', 'subcategory_name', 'category_id'
        ]
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None
