from rest_framework import serializers
from .models import Seller
from products.models import Product
from rest_framework import serializers
from .models import Seller, Shop, SellerFollow
from orders.models import Order
from promotions.models import Voucher
from sellers.models import SellerActivityLog


class ProductMiniSerializer(serializers.ModelSerializer):
    discounted_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'discount', 'discounted_price', 'image', 'location', 'unit', 'stock']

    def get_discounted_price(self, obj):
        return obj.discounted_price

class SellerListSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S.%fZ")
    followers_count = serializers.SerializerMethodField()
    total_products = serializers.SerializerMethodField()
    
    class Meta:
        model = Seller
        fields = ['id', 'store_name', 'image', 'address', 'status', 'bio', 'owner_username', 'phone', 'user_email', 'created_at', 'followers_count', 'total_products']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_total_products(self, obj):
        return obj.products.count()  # hoặc Product.objects.filter(store=obj).count()
class SellerRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        fields = ['id', 'user', 'store_name', 'bio', 'address', 'phone', 'image']

class SellerDetailSerializer(serializers.ModelSerializer):
    products = ProductMiniSerializer(many=True, read_only=True, source='product_set')
    followers_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    total_products = serializers.SerializerMethodField()
    owner_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)


    class Meta:
        model = Seller
        fields = [
            'id',
            'store_name',
            'bio',
            'address',
            'phone',
            'image',
            'created_at',
            'status',
            'rejection_reason',
            'products',
            'followers_count',
            'is_following',
            'total_products',
            'owner_username',
            'user_email'
        ]

    def get_followers_count(self, obj):
        return obj.followers.count()
    
    def get_total_products(self, obj):
        return obj.products.count()  # hoặc Product.objects.filter(store=obj).count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            return SellerFollow.objects.filter(user=user, seller=obj).exists()
        return False

class SellerSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Seller
        fields = [
            "id", "store_name", "bio", "address", "phone", "image",
            "created_at", "user", "user_username", "user_email", "status", "rejection_reason"
        ]
        read_only_fields = ["created_at"]

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
        read_only_fields = ["seller", "status", "category", "created_at", "updated_at", "rating", "review_count", "sold", "normalized_name", "ordered_quantity", "estimated_quantity"]

    def validate(self, data):
        if 'subcategory' in data and data['subcategory']:
            data['category'] = data['subcategory'].category
        return data

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = "__all__"

class VoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = "__all__"

class SellerFollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerFollow
        fields = ["id", "user", "seller", "created_at"]
        read_only_fields = ["id", "created_at", "user"]

class SellerActivityLogSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source="get_action_display", read_only=True)
    class Meta:
        model = SellerActivityLog
        fields = ["id", "action", "action_display", "description", "created_at"]