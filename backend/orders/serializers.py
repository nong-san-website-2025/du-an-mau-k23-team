from rest_framework import serializers
from .models import Order, OrderItem
from complaints.models import Complaint
from complaints.serializers import ComplaintSerializer
from .models import Preorder
from products.models import Product
from promotions.models import UserVoucher, Voucher  # <--- THÊM DÒNG NÀY
from decimal import Decimal
from collections import defaultdict
from django.db.models import F
import traceback

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
    items = OrderItemSerializer(many=True, required=True, write_only=True)
    shop_voucher_code = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Order
        fields = "__all__"
        read_only_fields = ["user", "created_at", "total_price", "discount_amount"]

    def validate(self, attrs):
        """
        Validate dữ liệu đầu vào:
        1. Kiểm tra danh sách items có rỗng không.
        2. Kiểm tra tồn kho của từng sản phẩm.
        """
        items_data = self.initial_data.get('items')
        
        # 1. Kiểm tra danh sách rỗng
        if not items_data or not isinstance(items_data, list) or len(items_data) == 0:
            raise serializers.ValidationError({'items': 'Giỏ hàng không được để trống.'})
        
        # 2. Kiểm tra tồn kho
        unavailable_items = []
        
        for item in items_data:
            product_id = item.get('product')
            try:
                quantity = int(item.get('quantity', 0))
            except (ValueError, TypeError):
                continue

            if not product_id or quantity <= 0: 
                continue
            
            try:
                product = Product.objects.get(id=product_id)
                
                # Kiểm tra số lượng tồn kho
                if product.stock < quantity:
                    # Lấy URL ảnh để hiển thị lỗi frontend
                    image_url = ""
                    if product.images.exists():
                        request = self.context.get('request')
                        img_path = product.images.first().image.url
                        image_url = request.build_absolute_uri(img_path) if request else img_path

                    unavailable_items.append({
                        "id": product.id,
                        "name": product.name,
                        "image": image_url,
                        "available_quantity": product.stock,
                        "requested_quantity": quantity
                    })
            except Product.DoesNotExist:
                 unavailable_items.append({
                     "id": product_id, 
                     "name": "Sản phẩm không tồn tại", 
                     "available_quantity": 0, 
                     "requested_quantity": quantity
                })

        # Nếu có sản phẩm lỗi, chặn tạo đơn ngay lập tức
        if unavailable_items:
            raise serializers.ValidationError({
                "unavailable_items": unavailable_items,
                "detail": "Một số sản phẩm trong giỏ hàng không đủ số lượng."
            })

        return attrs

    def create(self, validated_data):
        """
        Logic tạo đơn hàng:
        1. Lấy giá chuẩn từ Database (Tránh lỗi 0đ).
        2. Tách đơn theo Seller.
        3. Tính toán tổng tiền.
        4. Áp dụng Voucher (nếu có).
        """
        items_data_raw = validated_data.pop('items', [])
        voucher_code = validated_data.pop('shop_voucher_code', None)
        
        request = self.context.get('request')
        validated_data.pop('user', None)

        user = request.user

        # Set mặc định status là pending
        if 'status' not in validated_data:
            validated_data['status'] = 'pending'

        try:
            seller_items_map = defaultdict(list)
            
            # --- GIAI ĐOẠN 1: CHUẨN BỊ DỮ LIỆU & LẤY GIÁ TỪ DB ---
            for item_input in items_data_raw:
                # item_input là OrderedDict từ validated_data
                product = item_input.get('product') 
                quantity = item_input.get('quantity', 1)
                
                if not product: continue 

                # [QUAN TRỌNG] Lấy giá từ Database, không dùng giá từ frontend gửi lên
                original_price = product.original_price or Decimal('0')
                discounted_price = product.discounted_price # Có thể là None
                
                # Logic chọn giá: Ưu tiên giá giảm
                final_price = discounted_price if discounted_price is not None else original_price
                final_price = Decimal(str(final_price)) # Đảm bảo là Decimal

                # Lấy ảnh và unit
                first_image = product.images.first()
                image_url = first_image.image.name if first_image else ""
                unit = product.unit

                item_payload = {
                    'product': product,
                    'quantity': quantity,
                    'price': final_price, # Giá chuẩn từ DB
                    'product_image': image_url,
                    'unit': unit
                }

                # Gom nhóm theo Seller ID
                seller_items_map[product.seller.id].append(item_payload)

            created_orders = []

            # --- GIAI ĐOẠN 2: TẠO ORDER (Transaction Atomic) ---
            with transaction.atomic():
                # Duyệt qua từng seller để tách đơn
                for seller_id, items_list in seller_items_map.items():
                    
                    # 1. Tính tổng tiền hàng (Items Total)
                    total_goods_price = sum(item['price'] * item['quantity'] for item in items_list)
                    
                    # 2. Xử lý Shipping Fee
                    raw_shipping = validated_data.get('shipping_fee', 0)
                    shipping_fee = Decimal(str(raw_shipping))
                    
                    # 3. Tính Initial Total (Chưa trừ voucher)
                    initial_total = total_goods_price + shipping_fee
                    
                    order_data = validated_data.copy()
                    order_data['total_price'] = initial_total
                    order_data['shipping_fee'] = shipping_fee
                    
                    # Tạo Order
                    order = Order.objects.create(user=user, **order_data)

                    # 4. Tạo Order Items
                    for item_info in items_list:
                        OrderItem.objects.create(
                            order=order,
                            product=item_info['product'],
                            quantity=item_info['quantity'],
                            price=item_info['price'],
                            product_image=item_info['product_image'],
                            unit=item_info['unit']
                        )
                    
                    created_orders.append(order)

            # --- GIAI ĐOẠN 3: XỬ LÝ VOUCHER ---
            # Logic voucher được thực hiện sau khi tạo đơn để tránh lock DB quá lâu
            if voucher_code and created_orders:
                print(f">>> XỬ LÝ VOUCHER CODE: {voucher_code}")
                
                # Tìm Voucher
                uv = UserVoucher.objects.filter(
                    user=user, 
                    voucher__code=voucher_code,
                    is_used=False 
                ).select_related('voucher').first()

                if uv and uv.remaining_for_user() > 0:
                    voucher = uv.voucher
                    voucher_applied = False

                    for order in created_orders:
                        # 1. Check Shop Scope (Voucher của shop nào chỉ áp dụng cho đơn shop đó)
                        first_item = order.items.first()
                        if not first_item: continue
                        order_seller_id = first_item.product.seller.id
                        
                        if voucher.scope == 'seller' and voucher.seller:
                            if voucher.seller.id != order_seller_id:
                                continue
                        
                        # 2. Check giá trị tối thiểu
                        current_total = order.total_price # Decimal
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

                        # 4. Áp dụng vào đơn hàng
                        if discount > 0:
                            # Đảm bảo discount không lớn hơn tổng tiền
                            if discount > current_total:
                                discount = current_total
                            
                            order.discount_amount = discount
                            order.total_price = current_total - discount
                            order.voucher = voucher
                            
                            order.save(update_fields=['total_price', 'voucher', 'discount_amount'])
                            
                            print(f">>> Voucher OK! Giảm: {discount}. Tổng mới: {order.total_price}")
                            voucher_applied = True
                            
                            # Break vòng lặp nếu muốn mã chỉ áp dụng cho 1 đơn trong giỏ
                            # Nếu muốn áp dụng cho tất cả đơn thỏa mãn thì bỏ break
                            break 
                    
                    # Đánh dấu voucher đã sử dụng
                    if voucher_applied:
                        uv.mark_used_once()
                        if hasattr(voucher, 'used_quantity'):
                            voucher.used_quantity = F('used_quantity') + 1
                            voucher.save(update_fields=['used_quantity'])
                else:
                    print(">>> Voucher không hợp lệ hoặc đã hết lượt")

            # Lưu cache danh sách đơn đã tạo (Optional)
            self._created_orders = created_orders
            
            if not created_orders:
                raise serializers.ValidationError("Không tạo được đơn hàng nào (Lỗi xử lý items).")
            
            # Trả về đơn đầu tiên (để Frontend redirect hoặc hiển thị)
            return created_orders[0]

        except Exception as e:
            # In lỗi chi tiết ra terminal server để debug
            print(f"Error creating order: {e}")
            traceback.print_exc()
            raise serializers.ValidationError({'error': f'Lỗi tạo đơn: {str(e)}'})

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

