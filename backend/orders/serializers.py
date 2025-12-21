from rest_framework import serializers
from .models import Order, OrderItem
from complaints.models import Complaint
from .models import Preorder
from products.models import Product
from decimal import Decimal

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
        """Lấy giá ưu đãi (discounted_price) nếu có, ngược lại lấy giá gốc."""
        try:
            product = obj.product
            if not product:
                return 0
            # Ưu tiên lấy giá khuyến mãi
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
        """Tính tổng = giá * số lượng"""
        price = self.get_product_price(obj)
        qty = obj.quantity or 0
        return round(price * qty, 2)







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




class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False, write_only=True)

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
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if user is None or user.is_anonymous:
            raise serializers.ValidationError({'user': 'Bạn phải đăng nhập để đặt hàng.'})

        # Debug logging
        print(f"Creating order with data: {validated_data}")
        print(f"Request items: {self.initial_data.get('items', [])}")

        # Đảm bảo trạng thái được lưu đúng
        if 'status' not in validated_data:
            validated_data['status'] = 'pending'  # Mặc định là chờ xác nhận khi checkout

        try:
            # Nhóm items theo seller
            from products.models import Product
            from collections import defaultdict

            seller_items = defaultdict(list)
            request_items = self.initial_data.get('items', [])

            for i, item_data in enumerate(request_items):
                print(f"Processing item {i}: {item_data}")

                # Tạo bản sao để tránh thay đổi dữ liệu gốc
                item_data_copy = item_data.copy()
                item_data_copy.pop('order', None)  # Xoá trường order nếu có

                # Lấy thông tin sản phẩm để lưu vào OrderItem
                product_id = item_data_copy.get('product')
                if not product_id:
                    print(f"Skipping item {i}: no product_id")
                    continue

                try:
                    product = Product.objects.get(id=product_id)
                    first_image = product.images.first()
                    item_data_copy['product_image'] = first_image.image.name if first_image else ""

                    item_data_copy['unit'] = product.unit
                    # Đảm bảo có giá sản phẩm
                    if 'price' not in item_data_copy or not item_data_copy['price']:
                        item_data_copy['price'] = product.price
                    # Thêm product instance để dùng sau
                    item_data_copy['_product'] = product
                except Product.DoesNotExist:
                    print(f"Skipping item {i}: product {product_id} not found")
                    continue

                # Đảm bảo có đủ dữ liệu bắt buộc
                if not item_data_copy.get('quantity') or not item_data_copy.get('price'):
                    print(f"Skipping item {i}: missing quantity or price")
                    continue

                # Nhóm theo seller
                seller_id = product.seller.id
                seller_items[seller_id].append(item_data_copy)

            # Tạo orders cho từng seller
            created_orders = []
            for seller_id, items in seller_items.items():
                # Tính tổng giá trị cho order này
                total_price = sum(
                    float(item.get('price', 0)) * int(item.get('quantity', 0))
                    for item in items
                )

                # Tạo order data
                order_data = validated_data.copy()
                order_data.pop('user', None)  # Xóa user khỏi validated_data nếu có
                
                # Get shipping_fee from validated_data first, fallback to initial_data
                if 'shipping_fee' not in order_data or order_data['shipping_fee'] is None:
                    shipping_fee = self.initial_data.get('shipping_fee', 0)
                    order_data['shipping_fee'] = shipping_fee
                else:
                    shipping_fee = order_data['shipping_fee']
                
                # Set total_price including shipping_fee
                order_data['total_price'] = total_price + float(shipping_fee or 0)

                # Tạo đơn hàng
                order = Order.objects.create(user=user, **order_data)
                print(f"Created order {order.id} for seller {seller_id}")

                # Tạo order items
                for item_data_copy in items:
                    product = item_data_copy['_product']
                    order_item = OrderItem.objects.create(
                        order=order,
                        product=product,  # Truyền product instance
                        quantity=item_data_copy.get('quantity', 1),
                        price=item_data_copy.get('price', 0),
                        product_image=item_data_copy.get('product_image', ''),
                        unit=item_data_copy.get('unit', '')
                    )
                    print(f"Created order item: {order_item.id}")

                created_orders.append(order)

            # Lưu tất cả orders đã tạo để dùng trong perform_create
            self._created_orders = created_orders

            # Trả về order đầu tiên để tương thích với API hiện tại
            # Frontend có thể fetch lại danh sách orders để xem tất cả
            return created_orders[0] if created_orders else None

        except Exception as e:
            # Log lỗi để debug
            print(f"Error creating order: {e}")
            import traceback
            traceback.print_exc()
            raise serializers.ValidationError({'error': f'Lỗi khi tạo đơn hàng: {str(e)}'})


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
        # Fallback hiển thị total_price nếu DB chưa update
        if not representation.get('total_price') or representation['total_price'] == '0.00':
            total = sum(float(item.price) * int(item.quantity) for item in instance.items.all())
            shipping = float(instance.shipping_fee or 0)
            representation['total_price'] = str(total + shipping)
        return representation

class OrderItemCreateSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = OrderItem
        fields = ['product_id', 'quantity', 'price']


