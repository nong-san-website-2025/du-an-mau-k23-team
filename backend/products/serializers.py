from rest_framework import serializers
from .models import Product, Category, Subcategory
from blog.models import Post

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'key', 'icon']

class SubcategorySerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    
    class Meta:
        model = Subcategory
        fields = ['id', 'name', 'category']

from sellers.serializers import SellerListSerializer

class ProductSerializer(serializers.ModelSerializer):
    subcategory = serializers.PrimaryKeyRelatedField(queryset=Subcategory.objects.all(), required=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False)
    seller_name = serializers.CharField(source='seller.store_name', read_only=True)
    discounted_price = serializers.ReadOnlyField()
    image = serializers.ImageField()
    store = SellerListSerializer(source='seller', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'discounted_price', 'unit',
            'stock', 'image', 'rating', 'review_count', 'is_new', 'is_organic',
            'is_best_seller', 'discount', 'location', 'brand', 'subcategory',
            'seller', 'seller_name', 'created_at', 'updated_at', 'category', 'store',
        ]

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None

    def validate(self, data):
        # Tự động gán category dựa trên subcategory
        if 'subcategory' in data and data['subcategory']:
            data['category'] = data['subcategory'].category
        return data
class ProductListSerializer(serializers.ModelSerializer):
    discounted_price = serializers.ReadOnlyField()
    category_name = serializers.CharField(source='subcategory.category.name', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True)
    category_id = serializers.IntegerField(source='subcategory.category.id', read_only=True)
    subcategory = serializers.PrimaryKeyRelatedField(read_only=True)
    seller = serializers.PrimaryKeyRelatedField(read_only=True)
    seller_name = serializers.CharField(source='seller.store_name', read_only=True)
    image = serializers.ImageField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'discounted_price', 'unit', 'image', 
            'rating', 'review_count', 'is_new', 'is_organic', 'is_best_seller', 
            'discount', 'location', 'brand', 'category_name', 'subcategory_name', 
            'category_id', 'subcategory', 'seller', 'seller_name', 'description', 'stock'
        ]

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None
    
    # --- Serializer cho bài viết (Post) dùng cho API tìm kiếm ---

class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['id', 'title']