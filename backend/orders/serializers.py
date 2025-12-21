from rest_framework import serializers
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from .models import Order, OrderItem, Complaint, Preorder
from promotions.models import UserVoucher # Import UserVoucher để xử lý

# =========================================
# PREORDER SERIALIZER
# =========================================
class PreOrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(source='preorder_date', read_only=True)

    class Meta:
        model = Preorder
        fields = [
            'id',
            'product',
            'product_name',
            'product_price',
            'product_image',
            'quantity',
            'total_price',
            'created_at',
        ]

    def get_product_price(self, obj):
        try:
            product = obj.product
            if not product:
                return 0
            price = product.discounted_price or product.original_price or 0
            return float(price)
        except Exception:
            return 0

    def get_product_image(self, obj):
        request = self.context.get('request')
        if obj.product and obj.product.image:
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None

    def get_total_price(self, obj):
        price = self.get_product_price(obj)
        qty = obj.quantity or 0
        return round(price * qty, 2)

# =========================================
# ORDER ITEM SERIALIZER
# =========================================
class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    seller_name = serializers.CharField(source='product.seller.store_name', read_only=True)
    seller_phone = serializers.CharField(source='product.seller.phone', read_only=True)
    seller_id = serializers.IntegerField(source='product.seller.id', read_only=True)
    category_name = serializers.CharField(source='product.category.name', read_only=True)
    commission_rate = serializers.FloatField(source='product.category.commission_rate', read_only=True)
    platform_commission = serializers.SerializerMethodField()
    seller_amount = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        exclude = ["order"]

    def get_product_image(self, obj):
        request = self.context.get('request')
        first_image = obj.product.images.first()
        if first_image and hasattr(first_image.image, 'url'):
            if request:
                return request.build_absolute_uri(first_image.image.url)
            return first_image.image.url
        return None

    def get_platform_commission(self, obj):
        if not obj.product or not obj.product.category:
            return 0
        item_amount = float(obj.price) * obj.quantity
        commission_rate = obj.product.category.commission_rate or 0
        return round(item_amount * commission_rate, 2)

    def get_seller_amount(self, obj):
        if not obj.product or not obj.product.category:
            return round(float(obj.price) * obj.quantity, 2)
        item_amount = float(obj.price) * obj.quantity
        commission_rate = obj.product.category.commission_rate or 0
        commission = item_amount * commission_rate
        return round(item_amount - commission, 2)

# =========================================
# ORDER CREATE SERIALIZER (ĐÃ SỬA LOGIC VOUCHER)
# =========================================
class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False, write_only=True)
    # [NEW] Thêm field voucher_code
    voucher_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Order
        fields = "__all__"
        read_only_fields = ["user", "created_at"]

    def validate(self, attrs):
        items = self.initial_data.get('items')
        if not items or not isinstance(items, list) or len(items) == 0:
            raise serializers.ValidationError({'items': 'Danh sách sản phẩm không hợp lệ hoặc rỗng.'})
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        # [NEW] Lấy voucher code từ data gửi lên
        voucher_code = validated_data.pop('voucher_code', None)
        
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if user is None or user.is_anonymous:
            raise serializers.ValidationError({'user': 'Bạn phải đăng nhập để đặt hàng.'})

        if 'status' not in validated_data:
            validated_data['status'] = 'pending'

        try:
            # Nhóm items theo seller
            from products.models import Product
            from collections import defaultdict

            seller_items = defaultdict(list)
            request_items = self.initial_data.get('items', [])

            for i, item_data in enumerate(request_items):
                item_data_copy = item_data.copy()
                item_data_copy.pop('order', None)

                product_id = item_data_copy.get('product')
                if not product_id: continue

                try:
                    product = Product.objects.get(id=product_id)
                    first_image = product.images.first()
                    item_data_copy['product_image'] = first_image.image.name if first_image else ""
                    item_data_copy['unit'] = product.unit
                    
                    if 'price' not in item_data_copy or not item_data_copy['price']:
                        item_data_copy['price'] = product.price
                    
                    item_data_copy['_product'] = product
                except Product.DoesNotExist:
                    continue

                if not item_data_copy.get('quantity') or not item_data_copy.get('price'):
                    continue

                seller_id = product.seller.id
                seller_items[seller_id].append(item_data_copy)

            # Tạo orders cho từng seller
            created_orders = []
            
            # Dùng atomic transaction để đảm bảo tạo đơn + trừ voucher an toàn
            with transaction.atomic():
                for seller_id, items in seller_items.items():
                    # Tính tổng giá trị cho order này
                    total_price = sum(
                        float(item.get('price', 0)) * int(item.get('quantity', 0))
                        for item in items
                    )

                    order_data = validated_data.copy()
                    order_data.pop('user', None)
                    
                    if 'shipping_fee' not in order_data or order_data['shipping_fee'] is None:
                        shipping_fee = self.initial_data.get('shipping_fee', 0)
                        order_data['shipping_fee'] = shipping_fee
                    else:
                        shipping_fee = order_data['shipping_fee']
                    
                    # Set total_price (chưa trừ voucher)
                    order_data['total_price'] = total_price + float(shipping_fee or 0)

                    # Tạo đơn hàng
                    order = Order.objects.create(user=user, **order_data)

                    # Tạo order items
                    for item_data_copy in items:
                        product = item_data_copy['_product']
                        OrderItem.objects.create(
                            order=order,
                            product=product,
                            quantity=item_data_copy.get('quantity', 1),
                            price=item_data_copy.get('price', 0),
                            product_image=item_data_copy.get('product_image', ''),
                            unit=item_data_copy.get('unit', '')
                        )

                    created_orders.append(order)

                # ==========================================================
                # [LOGIC VOUCHER HARDCORE] Xử lý ngay trong Transaction
                # ==========================================================
                if voucher_code and created_orders:
                    print(f">>> XỬ LÝ VOUCHER CODE: {voucher_code}")
                    # Tìm và khóa dòng UserVoucher (is_used=False)
                    uv = UserVoucher.objects.select_for_update().filter(
                        user=user, 
                        voucher__code=voucher_code,
                        is_used=False 
                    ).select_related('voucher').first()

                    if uv and uv.remaining_for_user() > 0:
                        voucher = uv.voucher
                        voucher_applied = False # Cờ đánh dấu đã áp dụng thành công

                        # Duyệt qua các đơn vừa tạo để tìm đơn phù hợp
                        for order in created_orders:
                            # 1. Check Shop Scope (Nếu voucher của Shop, chỉ áp dụng cho đơn của Shop đó)
                            # Logic: Lấy seller của đơn hàng thông qua item đầu tiên
                            first_item = order.items.first()
                            if not first_item: continue
                            
                            order_seller_id = first_item.product.seller.id
                            
                            # Nếu voucher là của Seller, nhưng ID không khớp -> Bỏ qua
                            if voucher.scope == 'seller' and voucher.seller:
                                if voucher.seller.id != order_seller_id:
                                    continue
                            
                            # 2. Check giá trị tối thiểu
                            current_total = float(order.total_price)
                            if voucher.min_order_value and current_total < float(voucher.min_order_value):
                                continue # Chưa đủ tiền

                            # 3. Tính giảm giá
                            discount = 0.0
                            v_type = voucher.discount_type() if hasattr(voucher, 'discount_type') else 'unknown'

                            if v_type == 'amount':
                                discount = float(voucher.discount_amount or 0)
                            elif v_type == 'percent':
                                discount = (current_total * float(voucher.discount_percent or 0)) / 100
                                if voucher.max_discount_amount:
                                    discount = min(discount, float(voucher.max_discount_amount))
                            elif v_type == 'freeship':
                                discount = min(float(voucher.freeship_amount or 0), float(order.shipping_fee or 0))

                            # 4. Áp dụng
                            if discount > 0:
                                discount = min(discount, current_total) # Không giảm quá tổng tiền
                                order.total_price = current_total - discount
                                order.voucher = voucher # Lưu vết
                                order.save(update_fields=['total_price', 'voucher'])
                                print(f">>> Voucher áp dụng thành công cho đơn {order.id}. Giảm {discount}")
                                voucher_applied = True
                                
                                # Thông thường 1 voucher chỉ áp dụng cho 1 đơn trong giỏ
                                # (Hoặc tùy logic của bạn, ở đây tôi để break để chỉ dùng cho 1 đơn hợp lệ đầu tiên)
                                break 
                        
                        # Nếu voucher đã được áp dụng ít nhất 1 lần -> Trừ lượt dùng
                        if voucher_applied:
                            uv.mark_used_once()
                            if hasattr(voucher, 'used_quantity'):
                                voucher.used_quantity = F('used_quantity') + 1
                                voucher.save(update_fields=['used_quantity'])
                            print(">>> Đã trừ lượt dùng Voucher")
                    else:
                        print(">>> Voucher không hợp lệ hoặc đã hết lượt")

            self._created_orders = created_orders
            return created_orders[0] if created_orders else None

        except Exception as e:
            print(f"Error creating order: {e}")
            import traceback
            traceback.print_exc()
            raise serializers.ValidationError({'error': f'Lỗi khi tạo đơn hàng: {str(e)}'})

# =========================================
# OTHER SERIALIZERS
# =========================================
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False, read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    shop_name = serializers.SerializerMethodField()
    shop_phone = serializers.SerializerMethodField()
    total_amount = serializers.DecimalField(source='total_price', max_digits=10, decimal_places=2, read_only=True)
    order_id = serializers.IntegerField(source='id', read_only=True)

    class Meta:
        model = Order
        fields = "__all__"
        read_only_fields = ["user", "created_at"]

    def get_shop_name(self, obj):
        first_item = obj.items.first()
        if first_item and first_item.product and first_item.product.seller:
            return first_item.product.seller.store_name
        return None

    def get_shop_phone(self, obj):
        first_item = obj.items.first()
        if first_item and first_item.product and first_item.product.seller:
            return first_item.product.seller.phone
        return None

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if not representation.get('total_price') or representation['total_price'] == '0.00':
            total = sum(
                float(item.price) * int(item.quantity) 
                for item in instance.items.all()
            )
            shipping_fee = float(instance.shipping_fee or 0)
            representation['total_price'] = str(total + shipping_fee)
        return representation

class OrderItemCreateSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(write_only=True)
    class Meta:
        model = OrderItem
        fields = ['product_id', 'quantity', 'price']

class ComplaintSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source="order.id", read_only=True)
    class Meta:
        model = Complaint
        fields = ["id", "order_id", "customer_name", "reason", "status", "created_at"]