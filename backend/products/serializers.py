from rest_framework import serializers
from .models import Product, Category, Subcategory, ProductImage, PendingProductUpdate
from sellers.serializers import SellerListSerializer
from django.db.models import Sum
from orders.models import OrderItem
from products.models import ProductFeature
from store.serializers import StoreSerializer
from datetime import timedelta


class SellerWithDateSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    store_name = serializers.CharField()
    created_at = serializers.DateTimeField()

# ✅ Thêm ProductImageSerializer
class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_primary', 'order']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image and hasattr(instance.image, 'url'):
            # Trả về URL đầy đủ
            data['image'] = request.build_absolute_uri(instance.image.url) if request else instance.image.url
        return data


class PendingProductUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PendingProductUpdate
        fields = [
            'name', 'description', 'original_price', 'discounted_price', 'unit',
            'stock', 'location', 'brand', 'availability_status', 'season_start', 'season_end',
            'created_at', 'updated_at', 'weight_g', # 👈 THÊM VÀO ĐÂY
        ]


class SubcategorySerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Subcategory
        fields = ['id', 'name', 'category', 'status', 'product_count']

    def get_product_count(self, obj):
        return obj.products.count()


class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubcategorySerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'key', 'status', 'subcategories', 'image', 'is_featured']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None


class ProductFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductFeature
        fields = ["id", "name"]


class ProductSerializer(serializers.ModelSerializer):
    subcategory = serializers.PrimaryKeyRelatedField(queryset=Subcategory.objects.all(), required=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False)
    seller_name = serializers.CharField(source='seller.store_name', read_only=True)
    
    # original_price = serializers.SerializerMethodField()
    # discounted_price = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()

    main_image = serializers.SerializerMethodField()

    images = ProductImageSerializer(many=True, read_only=True)  # 👈 chỉ để hiển thị
    
    store = SellerListSerializer(source='seller', read_only=True)
    seller = serializers.PrimaryKeyRelatedField(read_only=True)
    sold_count = serializers.SerializerMethodField()
    discount_percent = serializers.IntegerField(read_only=False, required=False)
    preordered_quantity = serializers.IntegerField(read_only=True)
    available_quantity = serializers.SerializerMethodField()
    total_preordered = serializers.SerializerMethodField()
    user_preordered = serializers.SerializerMethodField()
    features = ProductFeatureSerializer(many=True, required=False)
    sold = serializers.SerializerMethodField()

    commission_rate = serializers.SerializerMethodField()
    pending_update = serializers.SerializerMethodField()
    comparison_data = serializers.SerializerMethodField()
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description',
            'original_price', 'discounted_price', 'price', 'discount_percent', 'unit',
            'stock', 'images',  # ✅ Thêm 'images'
            'rating', 'review_count',
            'location', 'brand', 'subcategory', 'seller_name',
            'created_at', 'updated_at', 'category', 'store',
            'status', 'seller', 'sold_count', 'sold', "is_hidden",
            "availability_status", "season_start", "season_end",
            "estimated_quantity", "preordered_quantity", 'ordered_quantity',
            "is_coming_soon", "is_out_of_stock", "available_quantity",
            "total_preordered", "user_preordered", "features", "main_image",
            "commission_rate", "pending_update", "comparison_data", 'weight_g',
        ]
        read_only_fields = ["status", "seller"]

    def get_commission_rate(self, obj):
        if obj.category and hasattr(obj.category, 'commission_rate'):
            return obj.category.commission_rate
        return None

    def get_main_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return ProductImageSerializer(primary_image, context=self.context).data
        # Nếu không có primary, lấy ảnh đầu tiên theo thứ tự
        first_image = obj.images.first()
        if first_image:
            return ProductImageSerializer(first_image, context=self.context).data
        return None

    # def get_original_price(self, obj):
    #     return int(obj.original_price)

    # def get_discounted_price(self, obj):
    #     value = obj.discounted_price if obj.discounted_price else obj.original_price
    #     return int(value or 0)

    def get_price(self, obj):
        original = obj.original_price
        discounted = obj.discounted_price
        if original is None:
            original = discounted
        if not discounted:
            discounted = original
        if original is None:
            return 0
        return int(discounted if discounted < original else original)

    def get_sold_count(self, obj):
        total = OrderItem.objects.filter(
            product=obj,
            order__status__in=['paid', 'shipped', 'delivered', 'success']
        ).aggregate(total=Sum('quantity'))['total']
        return total or 0

    def get_sold(self, obj):
        return self.get_sold_count(obj)

    def get_available_quantity(self, obj):
        if obj.availability_status == "coming_soon":
            if obj.estimated_quantity is not None:
                return max(obj.estimated_quantity - obj.preordered_quantity, 0)
            return None
        return obj.stock

    def get_total_preordered(self, obj):
        return obj.preorders.aggregate(total=Sum('quantity'))['total'] or 0

    def get_user_preordered(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            preorder = obj.preorders.filter(user=request.user).aggregate(total=Sum('quantity'))['total']
            return preorder or 0
        return 0

    def validate(self, data):
        if 'subcategory' in data and data['subcategory']:
            data['category'] = data['subcategory'].category
        return data

    def create(self, validated_data):
        features_data = validated_data.pop('features', [])
        request = self.context.get("request")

        if request and hasattr(request.user, "seller"):
            validated_data["seller"] = request.user.seller
        else:
            raise serializers.ValidationError({"seller": "Người dùng hiện tại không phải là seller"})

        product = super().create(validated_data)

        # Tạo danh sách features
        for feature in features_data:
            ProductFeature.objects.create(product=product, **feature)

        return product
    
    def update(self, instance, validated_data):
        # 👇 Xử lý riêng field `image`
            image = validated_data.pop('image', None)
            if image is not None:
                instance.image = image
            # 👇 Xử lý features như cũ
            features_data = validated_data.pop('features', None)

            # Cập nhật các trường còn lại
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            # Cập nhật features
            if features_data is not None:
                instance.features.all().delete()
                for feature in features_data:
                    ProductFeature.objects.create(product=instance, **feature)

            return instance
        
    is_coming_soon = serializers.SerializerMethodField()
    is_out_of_stock = serializers.SerializerMethodField()

    def get_is_coming_soon(self, obj):
        return obj.availability_status == "coming_soon"

    def get_is_out_of_stock(self, obj):
        if obj.availability_status == "coming_soon":
            return False
        return obj.stock <= 0

    # Trong class ProductSerializer, thêm hàm này:
    def get_comparison_data(self, obj):
        """Trả về dữ liệu so sánh giữa current và pending - dùng cho chi tiết"""
        current_data = {
            'name': obj.name,
            'description': obj.description,
            'original_price': float(obj.original_price) if obj.original_price else None,
            'discounted_price': float(obj.discounted_price) if obj.discounted_price else None,
            'unit': obj.unit,
            'stock': obj.stock,
            'location': obj.location,
            'brand': obj.brand,
            'availability_status': obj.availability_status,
            'season_start': obj.season_start.isoformat() if obj.season_start else None,
            'season_end': obj.season_end.isoformat() if obj.season_end else None,
        }

        pending_data = None
        changes = {}

        try:
            pending = obj.pending_update  # hoặc obj.pending_update nếu là OneToOne
            if pending:
                pending_data = {
                    'name': pending.name or obj.name,
                    'description': pending.description or obj.description,
                    'original_price': float(pending.original_price) if pending.original_price is not None else current_data['original_price'],
                    'discounted_price': float(pending.discounted_price) if pending.discounted_price is not None else current_data['discounted_price'],
                    'unit': pending.unit or obj.unit,
                    'stock': pending.stock if pending.stock is not None else obj.stock,
                    'location': pending.location or obj.location,
                    'brand': pending.brand or obj.brand,
                    'availability_status': pending.availability_status or obj.availability_status,
                    'season_start': pending.season_start.isoformat() if pending.season_start else (obj.season_start.isoformat() if obj.season_start else None),
                    'season_end': pending.season_end.isoformat() if pending.season_end else (obj.season_end.isoformat() if obj.season_end else None),
                }

                for field in current_data.keys():
                    if current_data[field] != pending_data[field]:
                        changes[field] = {
                            'old': current_data[field],
                            'new': pending_data[field]
                        }
        except PendingProductUpdate.DoesNotExist:
            pass

        return {
            'current': current_data,
            'pending': pending_data,
            'changes': changes,
            'has_changes': len(changes) > 0
        }

    def get_pending_update(self, obj):
        try:
            if hasattr(obj, 'pending_update') and obj.pending_update:
                return PendingProductUpdateSerializer(obj.pending_update, context=self.context).data
        except PendingProductUpdate.DoesNotExist:
            pass
        return None


class ProductListSerializer(serializers.ModelSerializer):
    is_reup = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='subcategory.category.name', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True)
    category_id = serializers.IntegerField(source='subcategory.category.id', read_only=True)
    subcategory = serializers.PrimaryKeyRelatedField(read_only=True)
    main_image = serializers.SerializerMethodField()

    images = ProductImageSerializer(many=True, read_only=True)  # ✅ Thêm field images
    
    seller = serializers.PrimaryKeyRelatedField(read_only=True)
    seller_name = serializers.SerializerMethodField()
    sold_count = serializers.SerializerMethodField()
    discount_percent = serializers.IntegerField(required=False)
    preordered_quantity = serializers.IntegerField(read_only=True)
    available_quantity = serializers.SerializerMethodField()
    total_preordered = serializers.SerializerMethodField()
    user_preordered = serializers.SerializerMethodField()

    store = SellerWithDateSerializer(source='seller', read_only=True)  # ✅ đúng
    seller = SellerWithDateSerializer(read_only=True)



    original_price = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()

    features = ProductFeatureSerializer(many=True, required=False)
    sold = serializers.SerializerMethodField()

    commission_rate = serializers.SerializerMethodField()
    pending_update = serializers.SerializerMethodField()
    comparison_data = serializers.SerializerMethodField()
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description',
            'original_price', 'discounted_price', 'price', 'discount_percent', 'unit',
             'images',  # ✅ Thêm 'images'
            'rating', 'review_count', 'location', 'brand',
            'category_name', 'subcategory_name', 'category_id',
            'subcategory', 'stock', 'status', 'created_at', 'updated_at',
            'seller', 'seller_name', 'sold_count', 'sold',
            "availability_status", "season_start", "season_end",
            "estimated_quantity", "preordered_quantity",
            "is_coming_soon", "is_out_of_stock", "available_quantity",
            "total_preordered", "user_preordered", "features", "store", "main_image",
            "commission_rate", "pending_update", "comparison_data", 'is_reup', 'weight_g',
        ]
        read_only_fields = ["id", "created_at", "updated_at", "seller"]

    def get_commission_rate(self, obj):
        if obj.category and hasattr(obj.category, 'commission_rate'):
            return obj.category.commission_rate
        return None

    def get_comparison_data(self, obj):
        """Trả về dữ liệu so sánh giữa current và pending"""
        current_data = {
            'name': obj.name,
            'description': obj.description,
            'original_price': float(obj.original_price) if obj.original_price else None,
            'discounted_price': float(obj.discounted_price) if obj.discounted_price else None,
            'unit': obj.unit,
            'stock': obj.stock,
            'location': obj.location,
            'brand': obj.brand,
            'weight_g': obj.weight_g, # 👈 THÊM
            'availability_status': obj.availability_status,
            'season_start': obj.season_start.isoformat() if obj.season_start else None,
            'season_end': obj.season_end.isoformat() if obj.season_end else None,
        }

        pending_data = None
        changes = {}

        try:
            pending = obj.pending_update
            pending_data = {
                'name': pending.name if pending.name else obj.name,
                'description': pending.description if pending.description else obj.description,
                'original_price': float(pending.original_price) if pending.original_price is not None else (float(obj.original_price) if obj.original_price else None),
                'discounted_price': float(pending.discounted_price) if pending.discounted_price is not None else (float(obj.discounted_price) if obj.discounted_price else None),
                'unit': pending.unit if pending.unit else obj.unit,
                'stock': pending.stock if pending.stock is not None else obj.stock,
                'location': pending.location if pending.location else obj.location,
                'brand': pending.brand if pending.brand else obj.brand,
                'availability_status': pending.availability_status if pending.availability_status else obj.availability_status,
                'season_start': pending.season_start.isoformat() if pending.season_start else (obj.season_start.isoformat() if obj.season_start else None),
                'season_end': pending.season_end.isoformat() if pending.season_end else (obj.season_end.isoformat() if obj.season_end else None),
            }

            # Tính toán sự khác biệt
            for field in current_data.keys():
                if current_data[field] != pending_data[field]:
                    changes[field] = {
                        'old': current_data[field],
                        'new': pending_data[field]
                    }

        except PendingProductUpdate.DoesNotExist:
            pass

        return {
            'current': current_data,
            'pending': pending_data,
            'changes': changes,
            'has_changes': len(changes) > 0
        }

    def get_pending_update(self, obj):
        try:
            pending = obj.pending_update
            return PendingProductUpdateSerializer(pending).data
        except PendingProductUpdate.DoesNotExist:
            return None


    def get_main_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return ProductImageSerializer(primary_image, context=self.context).data
        # Nếu không có primary, lấy ảnh đầu tiên theo thứ tự
        first_image = obj.images.first()
        if first_image:
            return ProductImageSerializer(first_image, context=self.context).data
        return None
    def get_original_price(self, obj):
        return int(obj.original_price)

    def get_discounted_price(self, obj):
        value = obj.discounted_price if obj.discounted_price else obj.original_price
        return int(value or 0)

    def get_price(self, obj):
        original = obj.original_price
        discounted = obj.discounted_price
        if original is None:
            original = discounted
        if not discounted:
            discounted = original
        if original is None:
            return 0
        return int(discounted if discounted < original else original)

    def get_seller_name(self, obj):
        return obj.seller.store_name if obj.seller else "—"

    def get_sold_count(self, obj):
        return OrderItem.objects.filter(
            product=obj,
            order__status__in=['paid', 'shipped', 'delivered', 'success']
        ).aggregate(total=Sum('quantity'))['total'] or 0

    def get_sold(self, obj):
        return self.get_sold_count(obj)

    def get_available_quantity(self, obj):
        if obj.availability_status == "coming_soon":
            if obj.estimated_quantity is not None:
                return max(obj.estimated_quantity - obj.preordered_quantity, 0)
            return None
        return obj.stock

    def get_total_preordered(self, obj):
        return obj.preorders.aggregate(total=Sum('quantity'))['total'] or 0

    def get_user_preordered(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            preorder = obj.preorders.filter(user=request.user).aggregate(total=Sum('quantity'))['total']
            return preorder or 0
        return 0

    is_coming_soon = serializers.SerializerMethodField()
    is_out_of_stock = serializers.SerializerMethodField()

    def get_is_coming_soon(self, obj):
        return obj.availability_status == "coming_soon"

    def get_is_out_of_stock(self, obj):
        if obj.availability_status == "coming_soon":
            return False
        return obj.stock <= 0
    

    def get_is_reup(self, obj):
        # Nếu không phải hàng pending thì thôi
        if obj.status != 'pending':
            return False
            
        # Logic: Nếu ngày cập nhật (updated_at) lớn hơn ngày tạo (created_at) quá 1 tiếng
        # Nghĩa là đã từng đăng lâu rồi, giờ sửa lại và gửi duyệt
        # (Lưu ý: Dùng total_seconds() để so sánh cho chuẩn)
        try:
            diff = obj.updated_at - obj.created_at
            return diff.total_seconds() > 3600 # 3600 giây = 1 tiếng
        except:
            return False

class ProductImageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['image', 'is_primary']
        # 'order' có thể tự động hoặc không cần thiết nếu dùng drag-drop sau này

class SubcategoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subcategory
        fields = ['name', 'status']


class CategoryCreateSerializer(serializers.ModelSerializer):
    subcategories = SubcategoryCreateSerializer(many=True, required=False)

    class Meta:
        model = Category
        fields = ['name', 'key', 'status', 'subcategories']

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