from rest_framework import serializers
from .models import Order, OrderItem



class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.CharField(source='product.image', read_only=True)
    
    class Meta:
        model = OrderItem
        exclude = ["order"]




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
        
        # Tính tổng giá trị từ items nếu không có total_price
        if not validated_data.get('total_price') or validated_data['total_price'] == 0:
            total = sum(
                float(item.get('price', 0)) * int(item.get('quantity', 0))
                for item in items_data
            )
            validated_data['total_price'] = total
        
        # Đảm bảo trạng thái được lưu đúng
        if 'status' not in validated_data:
            validated_data['status'] = 'completed'  # Mặc định là completed khi checkout
        
        try:
            # Tạo đơn hàng
            validated_data.pop('user', None)  # Xóa user khỏi validated_data nếu có
            order = Order.objects.create(user=user, **validated_data)
            print(f"Created order: {order.id}")
            
            # Tạo order items
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
                
                from products.models import Product
                try:
                    product = Product.objects.get(id=product_id)
                    item_data_copy['product_image'] = product.image.name if product.image else ""
                    item_data_copy['unit'] = product.unit
                    # Đảm bảo có giá sản phẩm
                    if 'price' not in item_data_copy or not item_data_copy['price']:
                        item_data_copy['price'] = product.price
                except Product.DoesNotExist:
                    print(f"Skipping item {i}: product {product_id} not found")
                    continue
                
                # Đảm bảo có đủ dữ liệu bắt buộc
                if not item_data_copy.get('quantity') or not item_data_copy.get('price'):
                    print(f"Skipping item {i}: missing quantity or price")
                    continue
                
                # Tạo OrderItem - truyền product instance thay vì ID
                order_item = OrderItem.objects.create(
                    order=order,
                    product=product,  # Truyền product instance
                    quantity=item_data_copy.get('quantity', 1),
                    price=item_data_copy.get('price', 0),
                    product_image=item_data_copy.get('product_image', ''),
                    unit=item_data_copy.get('unit', '')
                )
                print(f"Created order item: {order_item.id}")
            
            return order
        except Exception as e:
            # Log lỗi để debug
            print(f"Error creating order: {e}")
            import traceback
            traceback.print_exc()
            raise serializers.ValidationError({'error': f'Lỗi khi tạo đơn hàng: {str(e)}'})


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False, read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Order
        fields = "__all__"
        read_only_fields = ["user", "created_at"]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Tính tổng giá trị từ các items nếu không có total_price
        if not representation.get('total_price') or representation['total_price'] == '0.00':
            total = sum(
                float(item.price) * int(item.quantity) 
                for item in instance.items.all()
            )
            representation['total_price'] = str(total)
        return representation
