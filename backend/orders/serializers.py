from rest_framework import serializers
from .models import Order, OrderItem
from complaints.models import Complaint
from complaints.serializers import ComplaintSerializer
from .models import Preorder
from products.models import Product
from promotions.models import UserVoucher, Voucher  # <--- THÊM DÒNG NÀY
from decimal import Decimal
from django.db.models import F

from django.db import transaction

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

    complaint = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        exclude = ["order"]

    def get_complaint(self, obj):
        """
        Lấy thông tin khiếu nại.
        """
        # [FIX] Bỏ try/except hoặc in lỗi ra để debug
        try:
            # 1. Import bên trong hàm để tránh lỗi Circular Import
            from complaints.serializers import ComplaintSerializer 
            
            # 2. Query tìm complaint
            # Lưu ý: 'complaints' là related_name trong model Complaint
            active_complaint = obj.complaints.exclude(status='cancelled').order_by('-created_at').first()
            
            if active_complaint:
                return ComplaintSerializer(active_complaint).data
        except Exception as e:
            # [DEBUG] In lỗi ra terminal server để bạn thấy
            print(f"Error getting complaint for item {obj.id}: {str(e)}")
            return None
        
        return None

    def get_product_image(self, obj):
        request = self.context.get('request')
        if not obj.product:
            return None
        first_image = obj.product.images.first()  # ✅ Lấy ảnh đầu tiên
        if first_image and hasattr(first_image.image, 'url'):
            if request:
                return request.build_absolute_uri(first_image.image.url)
            return first_image.image.url
        return None

    def get_platform_commission(self, obj):
        """Tính phí sàn = (giá × số lượng) × commission_rate"""
        # Kiểm tra an toàn
        if not obj.product or not obj.product.category:
            return 0
            
        # 1. KHÔNG dùng float(obj.price). Giữ nguyên Decimal của Django
        # Decimal * int = Decimal (Hợp lệ) 
        item_amount = obj.price * obj.quantity 
        
        # 2. Lấy rate, đảm bảo nó là Decimal (kể cả khi là 0)
        raw_rate = obj.product.category.commission_rate or 0
        
        # Chuyển đổi an toàn sang Decimal (dùng str để tránh sai số nếu raw_rate lỡ là float)
        commission_rate = Decimal(str(raw_rate))
        
        # 3. Tính toán: Decimal * Decimal = Decimal
        return round(item_amount * commission_rate, 2)

    def get_seller_amount(self, obj):
            """Số tiền người bán nhận = Tổng tiền hàng - Phí sàn"""
            # 1. Tính tổng tiền hàng (Giữ nguyên Decimal, KHÔNG dùng float)
            # obj.price là Decimal, obj.quantity là int -> Kết quả là Decimal
            item_total = obj.price * obj.quantity 
            
            # 2. Lấy phí sàn (Hàm này đã sửa ở bước trước để trả về Decimal hoặc int/float)
            # Để chắc chắn, ta ép kiểu Decimal cho nó luôn
            commission = Decimal(str(self.get_platform_commission(obj)))

            # 3. Trừ đi: Decimal - Decimal = Decimal (An toàn)
            return item_total - commission

# =========================================
# ORDER CREATE SERIALIZER (ĐÃ SỬA LOGIC VOUCHER)
# =========================================
class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False, write_only=True)
    # [NEW] Thêm field voucher_code
    shop_voucher_code = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    class Meta:
        model = Order
        fields = "__all__"
        read_only_fields = ["user", "created_at"]

    def validate(self, attrs):
        items_data = self.initial_data.get('items')
        if not items_data or not isinstance(items_data, list) or len(items_data) == 0:
            raise serializers.ValidationError({'items': 'Danh sách sản phẩm không hợp lệ hoặc rỗng.'})
        
        # Danh sách chứa các sản phẩm bị lỗi tồn kho
        unavailable_items = []

        for item in items_data:
            product_id = item.get('product')
            # Lấy quantity, đảm bảo là số nguyên
            try:
                quantity = int(item.get('quantity', 0))
            except (ValueError, TypeError):
                continue

            if not product_id:
                continue
            
            try:
                product = Product.objects.get(id=product_id)
                
                # Kiểm tra tồn kho (Giả sử field là stock_quantity hoặc stock)
                current_stock = product.stock  # Hãy thay bằng tên field thực tế trong model Product của bạn
                
                if current_stock < quantity:
                    # Lấy URL ảnh để hiển thị đẹp trên Modal
                    image_url = ""
                    if product.images.exists():
                        # Lưu ý: request context cần thiết để build full URL
                        request = self.context.get('request')
                        img_path = product.images.first().image.url
                        if request:
                            image_url = request.build_absolute_uri(img_path)
                        else:
                            image_url = img_path

                    # Thêm vào danh sách lỗi
                    unavailable_items.append({
                        "id": product.id,
                        "name": product.name,
                        "image": image_url,
                        "available_quantity": current_stock,
                        "requested_quantity": quantity
                    })

            except Product.DoesNotExist:
                # Nếu sản phẩm không tồn tại (đã bị xóa), cũng coi là lỗi
                unavailable_items.append({
                    "id": product_id,
                    "name": f"Sản phẩm ID {product_id}",
                    "image": "",
                    "available_quantity": 0,
                    "requested_quantity": quantity
                })

        # Nếu có bất kỳ sản phẩm nào lỗi, chặn luôn việc tạo đơn
        if unavailable_items:
            # Trả về đúng key 'unavailable_items' mà React đang chờ
            raise serializers.ValidationError({
                "unavailable_items": unavailable_items,
                "detail": "Một số sản phẩm trong giỏ hàng không đủ số lượng."
            })

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        voucher_code = validated_data.pop('shop_voucher_code', None) 
        
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if user is None or user.is_anonymous:
            raise serializers.ValidationError({'user': 'Bạn phải đăng nhập để đặt hàng.'})

        if 'status' not in validated_data:
            validated_data['status'] = 'pending'

        try:
            # Import models cần thiết
            from products.models import Product
            from collections import defaultdict
            from promotions.models import UserVoucher
            
            seller_items = defaultdict(list)
            request_items = self.initial_data.get('items', [])

            # --- Giai đoạn 1: Chuẩn bị dữ liệu items ---
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

            created_orders = []
            
            # --- Giai đoạn 2: Transaction Atomic (Tạo đơn & Tính tiền) ---
            with transaction.atomic():
                for seller_id, items in seller_items.items():
                    # [SỬA LẠI] Tính tổng tiền dùng Decimal tuyệt đối
                    # Lưu ý: price lấy từ item_data có thể là float/str, cần ép về Decimal
                    total_price = sum(
                        Decimal(str(item.get('price', 0))) * int(item.get('quantity', 0))
                        for item in items
                    )

                    order_data = validated_data.copy()
                    order_data.pop('user', None)
                    
                    # Xử lý shipping fee (Chuyển sang Decimal)
                    raw_shipping = self.initial_data.get('shipping_fee', 0)
                    if 'shipping_fee' in order_data and order_data['shipping_fee'] is not None:
                         raw_shipping = order_data['shipping_fee']
                    
                    shipping_fee = Decimal(str(raw_shipping))
                    order_data['shipping_fee'] = shipping_fee
                    
                    # Tổng tiền = Tiền hàng + Ship
                    order_data['total_price'] = total_price + shipping_fee

                    # Tạo đơn hàng
                    order = Order.objects.create(user=user, **order_data)

                    # Tạo order items
                    for item_data_copy in items:
                        product = item_data_copy['_product']
                        # Ép kiểu giá về Decimal trước khi lưu
                        price_decimal = Decimal(str(item_data_copy.get('price', 0)))
                        
                        OrderItem.objects.create(
                            order=order,
                            product=product,
                            quantity=item_data_copy.get('quantity', 1),
                            price=price_decimal,
                            product_image=item_data_copy.get('product_image', ''),
                            unit=item_data_copy.get('unit', '')
                        )

                    created_orders.append(order)

            # ==========================================================
            # [SỬA LẠI] LOGIC VOUCHER (Move ra ngoài atomic block để tránh broken transaction)
            # ==========================================================
            if voucher_code and created_orders:
                print(f">>> XỬ LÝ VOUCHER CODE: {voucher_code}")
                uv = UserVoucher.objects.select_for_update().filter(
                    user=user, 
                    voucher__code=voucher_code,
                    is_used=False 
                ).select_related('voucher').first()

                if uv and uv.remaining_for_user() > 0:
                    voucher = uv.voucher
                    voucher_applied = False

                    for order in created_orders:
                        # 1. Check Shop Scope
                        first_item = order.items.first()
                        if not first_item: continue
                        order_seller_id = first_item.product.seller.id
                        
                        if voucher.scope == 'seller' and voucher.seller:
                            if voucher.seller.id != order_seller_id:
                                continue
                        
                        # 2. Check giá trị tối thiểu
                        current_total = order.total_price # Đã là Decimal
                        min_val = Decimal(str(voucher.min_order_value or 0))
                        
                        if voucher.min_order_value and current_total < min_val:
                            continue 

                        # 3. Tính giảm giá (Dùng Decimal)
                        discount = Decimal('0.0')
                        v_type = voucher.discount_type() if hasattr(voucher, 'discount_type') else 'unknown'

                        if v_type == 'amount':
                            discount = Decimal(str(voucher.discount_amount or 0))
                        elif v_type == 'percent':
                            percent = Decimal(str(voucher.discount_percent or 0))
                            discount = (current_total * percent) / Decimal('100')
                            if voucher.max_discount_amount:
                                max_disc = Decimal(str(voucher.max_discount_amount))
                                discount = min(discount, max_disc)
                        elif v_type == 'freeship':
                            ship_fee = order.shipping_fee 
                            free_amt = Decimal(str(voucher.freeship_amount or 0))
                            discount = min(free_amt, ship_fee)

                        # 4. Áp dụng
                        if discount > 0:
                            # Đảm bảo không âm
                            if discount > current_total:
                                discount = current_total
                            
                            order.discount_amount = discount
                            order.total_price = current_total - discount
                            order.voucher = voucher
                            
                            order.save(update_fields=['total_price', 'voucher', 'discount_amount'])
                            
                            print(f">>> Voucher OK! Giảm: {discount}. Tổng mới: {order.total_price}")
                            voucher_applied = True
                            break # Mỗi mã chỉ áp dụng 1 đơn trong chùm đơn (tùy logic)
                    
                    if voucher_applied:
                        uv.mark_used_once()
                        if hasattr(voucher, 'used_quantity'):
                            voucher.used_quantity = F('used_quantity') + 1
                            voucher.save(update_fields=['used_quantity'])
                else:
                    print(">>> Voucher không hợp lệ hoặc đã hết lượt")

            self._created_orders = created_orders
            return created_orders[0] if created_orders else None

        except Exception as e:
            # In lỗi chi tiết ra console server để debug
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
    
    # Thông tin Shop
    shop_name = serializers.SerializerMethodField()
    shop_phone = serializers.SerializerMethodField()
    
    # [NÂNG CẤP 1] Hiển thị trạng thái tiếng Việt
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    
    # [NÂNG CẤP 2] Format thời gian đẹp cho Frontend
    created_at_formatted = serializers.SerializerMethodField()
    
    # Các field tính toán tiền
    total_amount = serializers.DecimalField(source='total_price', max_digits=12, decimal_places=2, read_only=True)
    refunded_amount = serializers.SerializerMethodField()
    actual_revenue = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = "__all__"
        read_only_fields = ["user", "created_at"]

    def get_shop_name(self, obj):
        item = obj.items.first()
        return item.product.seller.store_name if (item and item.product and item.product.seller) else None

    def get_shop_phone(self, obj):
        item = obj.items.first()
        return item.product.seller.phone if (item and item.product and item.product.seller) else None

    def get_created_at_formatted(self, obj):
        # Trả về dạng: 14:30 20/12/2025
        return obj.created_at.strftime("%H:%M %d/%m/%Y")

    def get_refunded_amount(self, obj):
        refunded_items = obj.items.filter(status='REFUND_APPROVED')
        total = sum(item.price * item.quantity for item in refunded_items)
        return total

    def get_actual_revenue(self, obj):
        refunded = self.get_refunded_amount(obj)
        return obj.total_price - refunded

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Nếu DB chưa update total_price, ta tính lại bằng Decimal
        if not representation.get('total_price') or float(representation['total_price']) == 0:
            total_items = sum(
                item.price * item.quantity for item in instance.items.all()
            )
            shipping = instance.shipping_fee or Decimal('0')
            discount = instance.discount_amount or Decimal('0')
            
            final_total = total_items + shipping - discount
            # Đảm bảo không âm
            if final_total < 0: final_total = Decimal('0')
            
            representation['total_price'] = str(final_total)
            
        return representation

class OrderItemCreateSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(write_only=True)
    class Meta:
        model = OrderItem
        fields = "__all__"
        read_only_fields = ["user", "created_at", "discount_amount"] # discount_amount là readonly vì backend tự tính

