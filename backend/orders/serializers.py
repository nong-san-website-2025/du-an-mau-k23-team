from rest_framework import serializers
from .models import Order, OrderItem
from complaints.models import Complaint
from .models import Preorder

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
        if not obj.product or not obj.product.category:
            return 0
        item_amount = float(obj.price) * obj.quantity
        commission_rate = obj.product.category.commission_rate or 0
        return round(item_amount * commission_rate, 2)

    def get_seller_amount(self, obj):
        """Tính doanh thu nhà cung cấp = tổng tiền - phí sàn"""
        if not obj.product or not obj.product.category:
            return round(float(obj.price) * obj.quantity, 2)
        item_amount = float(obj.price) * obj.quantity
        commission_rate = obj.product.category.commission_rate or 0
        commission = item_amount * commission_rate
        return round(item_amount - commission, 2)




class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False, write_only=True)

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
    # Shop info derived from the first item's seller (orders can include multiple sellers theoretically)
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
        # Tính tổng giá trị từ các items nếu không có total_price
        if not representation.get('total_price') or representation['total_price'] == '0.00':
            total = sum(
                float(item.price) * int(item.quantity) 
                for item in instance.items.all()
            )
            # Add shipping_fee to total
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
