from rest_framework import serializers
from .models import Promotion, Voucher ,FlashSale, UserVoucher, FlashSaleProduct
from products.models import Product
from orders.models import OrderItem
from django.db.models import Sum
from rest_framework import serializers
from .models import Voucher


class PromotionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = ['id', 'code', 'name', 'type', 'start', 'end', 'active']


class VoucherDetailSerializer(serializers.ModelSerializer):
    promotion = PromotionListSerializer(read_only=True)
    per_user_quantity = serializers.IntegerField(required=False, default=1)

    # --- PHẦN MỚI: Thêm tên nguồn phát hành ---
    source_name = serializers.SerializerMethodField()

    class Meta:
        model = Voucher
        fields = [
            'id', 'code', 'title', 'description', 'scope', 'seller',
            'discount_percent', 'discount_amount', 'freeship_amount',
            'min_order_value', 'max_discount_amount',
            'start_at', 'end_at', 'active', 'promotion',
            'created_by', 'created_at',
            # new distribution / quantity fields
            'distribution_type', 'total_quantity', 'per_user_quantity',
            'discount_type','source_name',
        ]
        read_only_fields = ['created_by', 'created_at', 'promotion']

    # --- HÀM MỚI: Để lấy tên nguồn gốc voucher ---
    def get_source_name(self, obj):
        if obj.scope == 'system':
            return 'GreenFarm' # Tên mặc định cho voucher hệ thống
        if obj.scope == 'seller' and obj.seller:
            return obj.seller.store_name # Lấy tên shop từ model Seller
        return 'Không rõ'  

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
        # phân phối user_voucher (nếu direct) xử lý trong view
        return voucher

    def update(self, instance, validated_data):
        """
        Update voucher gốc. 
        Không xoá/reset UserVoucher đã phát.
        """

        # Không cho đổi distribution_type sau khi đã tạo
        if 'distribution_type' in validated_data and validated_data['distribution_type'] != instance.distribution_type:
            raise serializers.ValidationError("Không thể đổi kiểu phân phối sau khi đã tạo.")

        # Nếu chỉnh sửa total_quantity thì phải >= số lượng đã phát
        if 'total_quantity' in validated_data:
            issued = instance.issued_count()
            if validated_data['total_quantity'] < issued:
                raise serializers.ValidationError(
                    f"total_quantity không được nhỏ hơn số đã phát ({issued})."
                )

        return super().update(instance, validated_data)


class FlashSaleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
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
        product = obj.product
        if product:
            primary_image = product.images.filter(is_primary=True).first()
            if primary_image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(primary_image.image.url)
                return primary_image.image.url
            first_image = product.images.first()
            if first_image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(first_image.image.url)
                return first_image.image.url
        return None

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
        fields = ["id", "voucher", "is_used", "used_at", "quantity", "used_count"] 

class FlashSaleProductSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source='product.id')
    product_name = serializers.CharField(source='product.name')
    original_price = serializers.DecimalField(source='product.original_price', max_digits=12, decimal_places=0)
    # Nếu bạn có field ảnh, ví dụ: product.image.url
    product_image = serializers.SerializerMethodField() 
    remaining_stock = serializers.SerializerMethodField()

    class Meta:
        model = FlashSaleProduct
        fields = ['product_id', 'product_name', 'product_image', 'original_price', 'flash_price', 'stock', 'remaining_stock']

    def get_remaining_stock(self, obj):
    # Tính số lượng đã bán trong flash sale này
        sold = OrderItem.objects.filter(
            product=obj.product,
            order__status__in=['paid', 'shipped', 'delivered', 'success'],
            created_at__gte=obj.flashsale.start_time,
            created_at__lt=obj.flashsale.end_time
        ).aggregate(total=Sum('quantity'))['total'] or 0

        return max(0, obj.stock - sold)
    

    def get_product_image(self, obj):
        product = obj.product
        if product:
            primary_image = product.images.filter(is_primary=True).first()
            if primary_image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(primary_image.image.url)
                return primary_image.image.url
            first_image = product.images.first()
            if first_image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(first_image.image.url)
                return first_image.image.url
        return None

class FlashSaleSerializer(serializers.ModelSerializer):
    flashsale_products = FlashSaleProductSerializer(many=True, read_only=True)

    class Meta:
        model = FlashSale
        fields = ['id', 'start_time', 'end_time', 'flashsale_products']


class FlashSaleProductAdminSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    original_price = serializers.DecimalField(
        source='product.original_price',
        max_digits=12,
        decimal_places=0,
        read_only=True
    )
    remaining_stock = serializers.SerializerMethodField()

    class Meta:
        model = FlashSaleProduct
        fields = ['id', 'product', 'product_name', 'original_price', 'flash_price', 'stock','remaining_stock'  ]
    
    def get_remaining_stock(self, obj):
    # Tính số lượng đã bán trong flash sale này
        sold = OrderItem.objects.filter(
            product=obj.product,
            order__status__in=['paid', 'shipped', 'delivered', 'success'],
            created_at__gte=obj.flashsale.start_time,
            created_at__lt=obj.flashsale.end_time
        ).aggregate(total=Sum('quantity'))['total'] or 0

        return max(0, obj.stock - sold)

class FlashSaleAdminSerializer(serializers.ModelSerializer):
    flashsale_products = FlashSaleProductAdminSerializer(many=True)
    
    class Meta:
        model = FlashSale
        fields = [
            'id', 'start_time', 'end_time', 'is_active', 'flashsale_products',       ]
        read_only_fields = ['id']


    def validate(self, data):
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        flashsale_products = data.get('flashsale_products', [])

        # 1. Validate thời gian
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({
                "end_time": "Thời gian kết thúc phải sau thời gian bắt đầu."
            })

        # 2. Phải có ít nhất 1 sản phẩm
        if not flashsale_products:
            raise serializers.ValidationError({
                "flashsale_products": "Phải có ít nhất 1 sản phẩm trong Flash Sale."
            })

        # 3. Validate từng sản phẩm
        seen_products = set()
        for item in flashsale_products:
            product = item.get('product')
            flash_price = item.get('flash_price')
            stock = item.get('stock')

            # Kiểm tra trùng lặp sản phẩm
            if product in seen_products:
                raise serializers.ValidationError({
                    "flashsale_products": f"Sản phẩm {product} bị lặp lại."
                })
            seen_products.add(product)

            # Kiểm tra giá flash
            if flash_price is None or flash_price <= 0:
                raise serializers.ValidationError({
                    "flash_price": f"Giá flash của sản phẩm {product} phải > 0."
                })

            if product.original_price and flash_price >= product.original_price:
                raise serializers.ValidationError({
                    "flash_price": f"Giá flash của sản phẩm {product} phải thấp hơn giá gốc ({product.original_price})."
                })

            # Kiểm tra tồn kho
            if stock is None or stock < 1:
                raise serializers.ValidationError({
                    "stock": f"Số lượng của sản phẩm {product} phải >= 1."
                })

        return data

    def create(self, validated_data):
        products_data = validated_data.pop('flashsale_products', [])
        flashsale = FlashSale.objects.create(**validated_data)

        # Tạo dữ liệu cho từng sản phẩm
        for product_data in products_data:
            FlashSaleProduct.objects.create(flashsale=flashsale, **product_data)

        return flashsale

    def update(self, instance, validated_data):
        products_data = validated_data.pop('flashsale_products', None)

        # Cập nhật dữ liệu cơ bản
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Reset sản phẩm nếu có dữ liệu mới
        if products_data is not None:
            instance.flashsale_products.all().delete()
            for product_data in products_data:
                FlashSaleProduct.objects.create(flashsale=instance, **product_data)

        return instance


class SellerVoucherSerializer(serializers.ModelSerializer):
    # Dùng PrimaryKeyRelatedField để nhận một list các ID sản phẩm từ frontend
    applicable_products = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        many=True,
        required=False # Không bắt buộc vì có thể áp dụng cho tất cả
    )

    class Meta:
        model = Voucher
        fields = [
            'id', 'code', 'title', 'description',
            'discount_percent', 'discount_amount', 'freeship_amount',
            'min_order_value', 'max_discount_amount',
            'start_at', 'end_at', 'active',
            'distribution_type', 'total_quantity', 'per_user_quantity',
            # Các trường mới thêm
            'product_scope', 'applicable_products',
        ]
        # Các trường này sẽ được tự động điền trong view, không cần seller nhập
        read_only_fields = ['id']

    def validate(self, data):
        # --- Validate loại giảm giá ---
        count = sum(1 for k in ('discount_percent', 'discount_amount', 'freeship_amount') if data.get(k) is not None)
        if count == 0:
            raise serializers.ValidationError("Phải cung cấp 1 trong các loại giảm giá.")
        if count > 1:
            raise serializers.ValidationError("Chỉ được chọn 1 loại giảm giá.")

        # --- Validate logic áp dụng sản phẩm ---
        if data.get('product_scope') == Voucher.ProductScope.SPECIFIC:
            if not data.get('applicable_products'):
                raise serializers.ValidationError({
                    "applicable_products": "Vui lòng chọn ít nhất một sản phẩm khi áp dụng cho sản phẩm tùy chọn."
                })
        
        # --- VALIDATION BẢO MẬT: Kiểm tra sản phẩm có thuộc về cửa hàng không ---
        request = self.context.get('request')
        user_seller = getattr(request.user, 'seller', None)
        
        if not user_seller:
             raise serializers.ValidationError("Tài khoản của bạn không liên kết với cửa hàng nào.")
             
        if 'applicable_products' in data:
            for product in data['applicable_products']:
                # Dựa trên model Product của bạn, trường liên kết là `seller`
                if product.seller != user_seller:
                    raise serializers.ValidationError({
                        "applicable_products": f"Sản phẩm '{product.name}' không thuộc cửa hàng của bạn."
                    })

        return data
    
