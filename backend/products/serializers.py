from rest_framework import serializers
from .models import Product, Category, Subcategory
from blog.models import Post
from sellers.serializers import SellerListSerializer

class SubcategorySerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Subcategory
        fields = ['id', 'name', 'category', 'status', 'product_count']

    def get_product_count(self, obj):
        return obj.products.count()  # dùng related_name='products' trong Product model

class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubcategorySerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'key', 'icon', 'status', 'subcategories', 'image']

    
    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            # Nếu muốn trả về URL đầy đủ
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None

    


class ProductSerializer(serializers.ModelSerializer):
    subcategory = serializers.PrimaryKeyRelatedField(queryset=Subcategory.objects.all(), required=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False)
    seller_name = serializers.CharField(source='seller.store_name', read_only=True)
    discounted_price = serializers.ReadOnlyField()
    image = serializers.ImageField()
    store = SellerListSerializer(source='seller', read_only=True)
    seller = serializers.PrimaryKeyRelatedField(read_only=True) 


    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'discounted_price', 'unit',
            'stock', 'image', 'rating', 'review_count', 'location', 'brand',
            'subcategory', 'seller_name', 'created_at', 'updated_at',
            'category', 'store', 'status', 'seller', 'seller_name',
        ]
        read_only_fields = ["status", "seller"]

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

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request.user, "seller"):
            validated_data["seller"] = request.user.seller
        else:
            raise serializers.ValidationError({"seller": "Người dùng hiện tại không phải là seller"})
        return super().create(validated_data)


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='subcategory.category.name', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True)
    category_id = serializers.IntegerField(source='subcategory.category.id', read_only=True)
    subcategory = serializers.PrimaryKeyRelatedField(read_only=True)
    image = serializers.ImageField()
    seller = serializers.PrimaryKeyRelatedField(read_only=True) 
    seller_name = serializers.SerializerMethodField()  # ✅ dùng SerializerMethodField


    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'unit', 'image', 
            'rating', 'review_count',
            'location', 'brand', 'category_name', 'subcategory_name', 
            'category_id', 'subcategory', 'description', 'stock', 'status', 'created_at', 'updated_at', 'seller', 'seller_name'
        ]
        read_only_fields = ["id", "created_at", "updated_at", "seller"]

    def get_image(self, obj):   
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None
    
    def get_discounted_price(self, obj):
        return obj.discounted_price
    
    def get_seller_name(self, obj):
        if obj.seller:
            return obj.seller.store_name
        return "—"


class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['id', 'title']


class SubcategoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subcategory
        fields = ['name', 'status']

class CategoryCreateSerializer(serializers.ModelSerializer):
    subcategories = SubcategoryCreateSerializer(many=True, required=False)

    class Meta:
        model = Category
        fields = ['name', 'key', 'icon', 'status', 'subcategories']

    def create(self, validated_data):
        subcategories_data = validated_data.pop('subcategories', [])
        category = Category.objects.create(**validated_data)
        for sub_data in subcategories_data:
            Subcategory.objects.create(category=category, **sub_data)
        return category
    
    def update(self, instance, validated_data):
        subcategories_data = validated_data.pop('subcategories', None)

        # update các field category
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if subcategories_data is not None:
            # Lấy danh sách id sub cũ
            existing_sub_ids = [sub.id for sub in instance.subcategories.all()]

            for sub_data in subcategories_data:
                sub_id = sub_data.get('id', None)
                if sub_id and sub_id in existing_sub_ids:
                    # Update subcategory hiện có
                    sub = instance.subcategories.get(id=sub_id)
                    for key, value in sub_data.items():
                        setattr(sub, key, value)
                    sub.save()
                else:
                    # Tạo mới subcategory nếu không có id
                    Subcategory.objects.create(category=instance, **sub_data)

        return instance
