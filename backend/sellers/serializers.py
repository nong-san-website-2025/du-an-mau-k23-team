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
    price = serializers.SerializerMethodField()
    main_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'discount', 'discounted_price', 'image', 'location', 'unit', 'stock', 'status', 'main_image', 'created_at', 'updated_at']

    def get_discounted_price(self, obj):
        return obj.discounted_price

    def get_price(self, obj):
        return obj.discounted_price or obj.original_price

    def get_main_image(self, obj):
        if obj.image:
            return obj.image.url
        first_img = obj.images.first()
        return first_img.image.url if first_img else None
class SellerListSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    total_products = serializers.SerializerMethodField()
    owner_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S.%fZ")

    class Meta:
        model = Seller
        fields = [
            'id', 'store_name', 'image', 'address', 'status',
            'bio', 'owner_username', 'phone', 'user_email',
            'created_at', 'followers_count', 'total_products'
        ]

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_total_products(self, obj):
        return Product.objects.filter(seller=obj).count()

class SellerRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        fields = [
            'id', 'user', 'store_name', 'bio', 'address', 'phone', 'image',
            'tax_code', 'business_type', 'cccd_front', 'cccd_back', 'business_license'
        ]

    def validate(self, attrs):
        business_type = attrs.get("business_type")

        if business_type not in ["personal", "business", "household"]:
            raise serializers.ValidationError({
                "business_type": "Loại hình kinh doanh không hợp lệ hoặc bị thiếu."
            })

        # Cá nhân → phải có CCCD
        if business_type == "personal":
            if not attrs.get("cccd_front") or not attrs.get("cccd_back"):
                raise serializers.ValidationError(
                    {"cccd": "Cá nhân phải upload CCCD mặt trước và mặt sau."}
                )

        # DN + hộ kinh doanh → phải có GPLK
        if business_type in ["business", "household"]:
            if not attrs.get("business_license"):
                raise serializers.ValidationError(
                    {"business_license": "Phải upload giấy phép kinh doanh."}
                )

        return attrs

class SellerDetailSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    cccd_front = serializers.SerializerMethodField()
    cccd_back = serializers.SerializerMethodField()
    business_license = serializers.SerializerMethodField()

    business_type = serializers.CharField(read_only=True)
    tax_code = serializers.CharField()
    products = serializers.SerializerMethodField()
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

        # ✅ thêm các field này
        "business_type",
            "tax_code",
            "cccd_front",
            "cccd_back",
            "business_license",
            "followers_count",
            "is_following",
            "total_products",
            "owner_username",
            "user_email",
    ]


    

    def get_products(self, obj):
        # Fix cực chuẩn – luôn lấy đúng product
        qs = Product.objects.filter(seller=obj)
        return ProductMiniSerializer(qs, many=True, context=self.context).data

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_total_products(self, obj):
        return Product.objects.filter(seller=obj).count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            return SellerFollow.objects.filter(user=user, seller=obj).exists()
        return False
    
    def get_full_url(self, obj_file):
        request = self.context.get("request")
        if obj_file:
            return request.build_absolute_uri(obj_file.url)
        return None

    def get_image(self, obj):
        return self.get_full_url(obj.image)

    def get_cccd_front(self, obj):
        return self.get_full_url(obj.cccd_front)

    def get_cccd_back(self, obj):
        return self.get_full_url(obj.cccd_back)

    def get_business_license(self, obj):
        return self.get_full_url(obj.business_license)


class SellerSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)
    business_type = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    tax_code = serializers.CharField(required=False, allow_null=True)
    

    class Meta:
        model = Seller
        fields = [
            "id", "store_name", "bio", "address", "phone", "image",
            "created_at", "user", "user_username", "user_email", "status", "rejection_reason", "business_type",
            "tax_code",  "cccd_front",
            "cccd_back", "business_license",

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



