from rest_framework import serializers
from django.db.models import Sum
from .models import Promotion, Voucher, FlashSale, UserVoucher, FlashSaleProduct, VoucherUsage
from products.models import Product
from orders.models import OrderItem

# =========================================================
# 1. HELPER / COMMON SERIALIZERS
# =========================================================

class PromotionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = ['id', 'code', 'name', 'type', 'start', 'end', 'active']

# =========================================================
# 2. FLASHSALE PRODUCT SERIALIZERS (CORE LOGIC)
# =========================================================

class FlashSaleProductSerializer(serializers.ModelSerializer):
    """
    Serializer hiển thị sản phẩm trong Flash Sale (Dành cho Client/Frontend Public)
    """
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    original_price = serializers.DecimalField(source='product.original_price', max_digits=12, decimal_places=0, read_only=True)
    product_image = serializers.SerializerMethodField() 
    remaining_stock = serializers.SerializerMethodField()

    class Meta:
        model = FlashSaleProduct
        fields = ['product_id', 'product_name', 'product_image', 'original_price', 'flash_price', 'stock', 'remaining_stock']

    def get_remaining_stock(self, obj):
        sold = OrderItem.objects.filter(
            product=obj.product,
            order__status__in=['shipping', 'delivered', 'completed'],
            created_at__gte=obj.flashsale.start_time,
            created_at__lt=obj.flashsale.end_time
        ).aggregate(total=Sum('quantity'))['total'] or 0
        return max(0, obj.stock - sold)

    def get_product_image(self, obj):
        product = obj.product
        if not product: return None
        image_obj = product.images.filter(is_primary=True).first() or product.images.first()
        if image_obj:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image_obj.image.url)
            return image_obj.image.url
        return None

class FlashSaleProductAdminSerializer(serializers.ModelSerializer):
    """
    [QUAN TRỌNG] Serializer cho trang quản trị (Admin/Seller tạo Flash Sale)
    Đã thêm trường 'image' để fix lỗi không hiện ảnh trên bảng React
    """
    product_name = serializers.CharField(source='product.name', read_only=True)
    original_price = serializers.DecimalField(
        source='product.original_price', max_digits=12, decimal_places=0, read_only=True
    )
    remaining_stock = serializers.SerializerMethodField()
    
    # Thêm trường image vào đây
    image = serializers.SerializerMethodField()

    class Meta:
        model = FlashSaleProduct
        fields = ['id', 'product', 'product_name', 'image', 'original_price', 'flash_price', 'stock', 'remaining_stock']
    
    def get_remaining_stock(self, obj):
        sold = OrderItem.objects.filter(
            product=obj.product,
            order__status__in=['shipping', 'delivered', 'completed'],
            created_at__gte=obj.flashsale.start_time,
            created_at__lt=obj.flashsale.end_time
        ).aggregate(total=Sum('quantity'))['total'] or 0
        return max(0, obj.stock - sold)

    def get_image(self, obj):
        """Lấy URL ảnh tuyệt đối (có http://...)"""
        product = obj.product
        if not product: return None
        
        # Ưu tiên ảnh chính, nếu không có thì lấy ảnh đầu tiên
        image_obj = product.images.filter(is_primary=True).first() or product.images.first()
        
        if image_obj and image_obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image_obj.image.url)
            return image_obj.image.url
        return None

# =========================================================
# 3. VOUCHER SERIALIZERS
# =========================================================

class VoucherDetailSerializer(serializers.ModelSerializer):
    promotion = PromotionListSerializer(read_only=True)
    per_user_quantity = serializers.IntegerField(required=False, default=1)
    source_name = serializers.SerializerMethodField()

    class Meta:
        model = Voucher
        fields = [
            'id', 'code', 'title', 'description', 'scope', 'seller',
            'discount_percent', 'discount_amount', 'freeship_amount',
            'min_order_value', 'max_discount_amount',
            'start_at', 'end_at', 'active', 'promotion',
            'created_by', 'created_at',
            'distribution_type', 'total_quantity', 'per_user_quantity',
            'discount_type', 'source_name',
        ]
        read_only_fields = ['created_by', 'created_at', 'promotion']

    def get_source_name(self, obj):
        if obj.scope == 'system':
            return 'GreenFarm'
        if obj.scope == 'seller' and obj.seller:
            return obj.seller.store_name 
        return 'Không rõ'  

    def validate(self, data):
        count = sum(1 for k in ('discount_percent', 'discount_amount', 'freeship_amount') if data.get(k) is not None)
        if count == 0:
            raise serializers.ValidationError("Phải cung cấp 1 trong các loại giảm: discount_percent, discount_amount, freeship_amount")
        if count > 1:
            raise serializers.ValidationError("Chỉ được chọn 1 loại giảm giá.")

        if data.get('discount_percent') is not None:
            val = data['discount_percent']
            if val < 0 or val > 100:
                raise serializers.ValidationError("discount_percent phải trong khoảng 0 - 100.")
            
            if not data.get('max_discount_amount') and data.get('discount_type') != 'freeship':
                 pass 

        dist_type = data.get('distribution_type')
        if dist_type == Voucher.DistributionType.CLAIM:
            if data.get('per_user_quantity') is None:
                data['per_user_quantity'] = 1

        return data

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['created_by'] = user if user.is_authenticated else None
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'distribution_type' in validated_data and validated_data['distribution_type'] != instance.distribution_type:
            raise serializers.ValidationError("Không thể đổi kiểu phân phối sau khi đã tạo.")

        if 'total_quantity' in validated_data:
            issued = instance.issued_count() if hasattr(instance, 'issued_count') else 0
            if validated_data['total_quantity'] < issued:
                raise serializers.ValidationError(f"total_quantity không được nhỏ hơn số đã phát ({issued}).")

        return super().update(instance, validated_data)


class VoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'used_quantity', 'issued_count']


class SellerVoucherSerializer(serializers.ModelSerializer):
    applicable_products = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        many=True,
        required=False
    )
    users_count = serializers.SerializerMethodField()

    class Meta:
        model = Voucher
        fields = [
            'id', 'code', 'title', 'description',
            'discount_percent', 'discount_amount', 'freeship_amount',
            'min_order_value', 'max_discount_amount',
            'start_at', 'end_at', 'active',
            'distribution_type', 'total_quantity', 'per_user_quantity',
            'product_scope', 'applicable_products', 'users_count',
        ]
        read_only_fields = ['id', 'users_count']

    def get_users_count(self, obj):
        return obj.usage_history.values('user').distinct().count()

    def validate(self, data):
        count = sum(1 for k in ('discount_percent', 'discount_amount', 'freeship_amount') if data.get(k) is not None)
        if count == 0:
            raise serializers.ValidationError("Phải cung cấp 1 trong các loại giảm giá.")
        if count > 1:
            raise serializers.ValidationError("Chỉ được chọn 1 loại giảm giá.")
        
        if data.get('discount_percent'):
             if not data.get('max_discount_amount'):
                  raise serializers.ValidationError({"max_discount_amount": "Vui lòng nhập mức giảm tối đa khi giảm theo %"})

        if data.get('product_scope') == 'SPECIFIC': 
            if not data.get('applicable_products'):
                raise serializers.ValidationError({"applicable_products": "Vui lòng chọn sản phẩm áp dụng."})
        
        request = self.context.get('request')
        if request and hasattr(request.user, 'seller'):
            user_seller = request.user.seller
            if 'applicable_products' in data:
                for product in data['applicable_products']:
                    if product.seller != user_seller:
                        raise serializers.ValidationError(f"Sản phẩm '{product.name}' không thuộc cửa hàng của bạn.")

        return data


class UserVoucherSerializer(serializers.ModelSerializer):
    voucher = VoucherDetailSerializer(read_only=True)

    class Meta:
        model = UserVoucher
        fields = ["id", "voucher", "is_used", "used_at", "quantity", "used_count"] 


class VoucherImportSerializer(serializers.Serializer):
    code = serializers.CharField(required=True)
    title = serializers.CharField(required=True)
    discount_type = serializers.ChoiceField(
        choices=['amount', 'percent', 'freeship'], 
        default='amount'
    )
    value = serializers.DecimalField(max_digits=12, decimal_places=0, required=True)
    start_date = serializers.DateField(format="%Y-%m-%d", input_formats=["%Y-%m-%d", "%d/%m/%Y"])
    end_date = serializers.DateField(format="%Y-%m-%d", input_formats=["%Y-%m-%d", "%d/%m/%Y"])
    quantity = serializers.IntegerField(min_value=1, default=100)
    per_user_quantity = serializers.IntegerField(min_value=1, default=1, required=False)
    min_order = serializers.DecimalField(max_digits=12, decimal_places=0, required=False, default=0)

    def validate_code(self, value):
        if Voucher.objects.filter(code__iexact=value.strip()).exists():
            raise serializers.ValidationError(f"Mã '{value}' đã tồn tại.")
        return value.upper().strip()

    def validate(self, data):
        if data['start_date'] >= data['end_date']:
            raise serializers.ValidationError("Ngày kết thúc phải sau ngày bắt đầu.")
        return data


# =========================================================
# 4. FLASHSALE MAIN SERIALIZERS
# =========================================================

class FlashSaleSerializer(serializers.ModelSerializer):
    """
    Serializer cho danh sách Flash Sale (Public)
    """
    flashsale_products = FlashSaleProductSerializer(many=True, read_only=True)
    remaining_time = serializers.ReadOnlyField() 

    class Meta:
        model = FlashSale
        fields = ['id', 'start_time', 'end_time', 'remaining_time', 'flashsale_products']


class FlashSaleAdminSerializer(serializers.ModelSerializer):
    """
    Serializer cho Admin quản lý (CRUD Flash Sale)
    Sử dụng FlashSaleProductAdminSerializer để có trường ảnh (image)
    """
    flashsale_products = FlashSaleProductAdminSerializer(many=True)
    
    class Meta:
        model = FlashSale
        fields = ['id', 'start_time', 'end_time', 'is_active', 'flashsale_products']
        read_only_fields = ['id']

    def validate(self, data):
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        is_active = data.get('is_active')

        if self.instance:
            start_time = start_time or self.instance.start_time
            end_time = end_time or self.instance.end_time
            if is_active is None: is_active = self.instance.is_active
        else:
            if is_active is None: is_active = True

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({"end_time": "Thời gian kết thúc phải sau bắt đầu."})

        if is_active and start_time and end_time:
            overlapping = FlashSale.objects.filter(
                is_active=True,
                start_time__lt=end_time,
                end_time__gt=start_time
            )
            if self.instance:
                overlapping = overlapping.exclude(pk=self.instance.pk)

            if overlapping.exists():
                conflict = overlapping.first()
                s_str = conflict.start_time.strftime('%H:%M %d/%m')
                e_str = conflict.end_time.strftime('%H:%M %d/%m')
                raise serializers.ValidationError(f"Trùng lịch với FlashSale ID {conflict.id} ({s_str} - {e_str})")

        flashsale_products = data.get('flashsale_products', [])
        if (not self.instance or 'flashsale_products' in data) and not flashsale_products:
             raise serializers.ValidationError({"flashsale_products": "Cần ít nhất 1 sản phẩm."})

        seen_products = set()
        for item in flashsale_products:
            product = item.get('product')
            flash_price = item.get('flash_price')
            stock = item.get('stock')

            if product in seen_products:
                raise serializers.ValidationError(f"Sản phẩm {product} bị lặp lại.")
            seen_products.add(product)

            if not flash_price or flash_price <= 0:
                raise serializers.ValidationError(f"Giá flash {product} phải > 0.")
            if product.original_price and flash_price >= product.original_price:
                raise serializers.ValidationError(f"Giá flash {product} phải < giá gốc.")
            if not stock or stock < 1:
                raise serializers.ValidationError(f"Số lượng {product} phải >= 1.")

        return data

    def create(self, validated_data):
        products_data = validated_data.pop('flashsale_products', [])
        flashsale = FlashSale.objects.create(**validated_data)
        for p_data in products_data:
            FlashSaleProduct.objects.create(flashsale=flashsale, **p_data)
        return flashsale

    def update(self, instance, validated_data):
        products_data = validated_data.pop('flashsale_products', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if products_data is not None:
            instance.flashsale_products.all().delete()
            for p_data in products_data:
                FlashSaleProduct.objects.create(flashsale=instance, **p_data)
        return instance