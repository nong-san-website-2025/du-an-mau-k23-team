from rest_framework import serializers
from .models import Promotion, Voucher ,FlashSale, UserVoucher
from products.models import Product

class PromotionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = ['id', 'code', 'name', 'type', 'start', 'end', 'active']


class VoucherDetailSerializer(serializers.ModelSerializer):
    promotion = PromotionListSerializer(read_only=True)
    per_user_quantity = serializers.IntegerField(required=False, default=1)

    class Meta:
        model = Voucher
        fields = [
            'id', 'code', 'title', 'description', 'scope', 'seller',
            'discount_percent', 'discount_amount', 'freeship_amount',
            'min_order_value', 'max_discount_amount',
            'start_at', 'end_at', 'active', 'promotion', 'created_by', 'created_at',
            # new distribution / quantity fields
            'distribution_type', 'total_quantity', 'per_user_quantity','discount_type',
        ]
        read_only_fields = ['created_by', 'created_at', 'promotion']

    def validate(self, data):
        # --- Discount type validation ---
        count = sum(1 for k in ('discount_percent', 'discount_amount', 'freeship_amount') if data.get(k) is not None)
        if count == 0:
            raise serializers.ValidationError("Phải cung cấp 1 trong các loại giảm: discount_percent, discount_amount, freeship_amount")
        if count > 1:
            raise serializers.ValidationError("Chỉ được tổng cộng 1 loại giảm.")
        if data.get('discount_percent') is not None:
            val = data['discount_percent']
            if val < 0 or val > 100:
                raise serializers.ValidationError("discount_percent phải trong 0 - 100.")

        # --- Fix per_user_quantity ---
        dist_type = data.get('distribution_type')
        if dist_type == Voucher.DistributionType.CLAIM:
            if data.get('per_user_quantity') is None:
                data['per_user_quantity'] = 1
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['created_by'] = user if user.is_authenticated else None
        voucher = super().create(validated_data)
        # note: distribution to users handled in view perform_create (so we don't import User here)
        return voucher

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


class FlashSaleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.CharField(source='product.thumbnail_url', read_only=True)
    remaining_time = serializers.SerializerMethodField()
    remaining_stock = serializers.SerializerMethodField()

    class Meta:
        model = FlashSale
        fields = [
            'id', 'product_id', 'product_name', 'product_image',
            'original_price', 'flash_price', 'stock',
            'start_time', 'end_time', 'remaining_time', 'remaining_stock'
        ]

    def get_product_name(self, obj):
        return obj.product.name if obj.product else ""

    def get_product_image(self, obj):
        return obj.product.thumbnail_url if obj.product else ""

    def get_remaining_time(self, obj):
        return obj.remaining_time

    def get_remaining_stock(self, obj):
        return obj.remaining_stock
    

class VoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = "__all__"

class UserVoucherSerializer(serializers.ModelSerializer):
    voucher = VoucherDetailSerializer(read_only=True)

    class Meta:
        model = UserVoucher
        fields = ["id", "voucher", "is_used", "used_at"]    



class FlashSaleAdminSerializer(serializers.ModelSerializer):
    # ✅ Bắt buộc: dùng PrimaryKeyRelatedField để DRF hiểu product là ForeignKey
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())

    class Meta:
        model = FlashSale
        fields = [
            'id', 'product', 'flash_price', 'stock',
            'start_time', 'end_time', 'is_active'
        ]
        read_only_fields = ['id']

    def validate_product(self, value):
        if not value:
            raise serializers.ValidationError("Sản phẩm là bắt buộc.")
        if hasattr(value, 'flash_sale'):
            raise serializers.ValidationError("Sản phẩm này đã có Flash Sale rồi.")
        return value

    def validate_flash_price(self, value):
        """Kiểm tra riêng lẻ giá flash"""
        if value is not None:
            # Không truy cập product ở đây, để validate() xử lý
            if value <= 0:
                raise serializers.ValidationError("Giá flash phải lớn hơn 0.")
        return value

    def validate(self, data):
        """Kiểm tra chéo các trường"""
        product = data.get('product')
        flash_price = data.get('flash_price')
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if not product:
            # Phòng thủ thêm
            raise serializers.ValidationError({"product": "Sản phẩm là bắt buộc."})

        if flash_price is not None and product:
            if flash_price >= product.price:
                raise serializers.ValidationError({"flash_price": "Giá flash phải thấp hơn giá gốc."})

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({"end_time": "Thời gian kết thúc phải sau thời gian bắt đầu."})

        return data
