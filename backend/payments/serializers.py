from rest_framework import serializers
from .models import Payment
from orders.models import Order, OrderItem
from .models_withdraw import WithdrawRequest

class WithdrawRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = WithdrawRequest
        fields = "__all__"

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_image", "unit", "quantity", "price", "created_at"]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = ["id", "user", "customer_name", "customer_phone", "address", "note", 
                  "payment_method", "total_price", "status", "created_at", "items"]

class PaymentSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    
    # Thêm các trường tính toán động cho fees
    fees = serializers.SerializerMethodField()
    platform_fee = serializers.SerializerMethodField()
    shipping_fee = serializers.SerializerMethodField()
    payment_fee = serializers.SerializerMethodField()
    service_fee = serializers.SerializerMethodField()
    advertisement_fee = serializers.SerializerMethodField()
    discount = serializers.SerializerMethodField()
    tax = serializers.SerializerMethodField()
    cogs = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ["created_at"]
    
    def get_fees(self, obj):
        """Trả về object chứa tất cả các loại phí"""
        amount = float(obj.amount)
        return {
            "platform_fee": amount * 0.05,  # 5% phí nền tảng
            "shipping_fee": 0,  # Miễn phí vận chuyển
            "payment_fee": amount * 0.02,  # 2% phí thanh toán
            "service_fee": amount * 0.01,  # 1% phí dịch vụ
            "advertisement_fee": 0,  # Không có phí quảng cáo
            "discount": 0,  # Không có giảm giá
            "tax": amount * 0.1,  # 10% thuế VAT
        }
    
    def get_platform_fee(self, obj):
        return float(obj.amount) * 0.05
    
    def get_shipping_fee(self, obj):
        return 0
    
    def get_payment_fee(self, obj):
        return float(obj.amount) * 0.02
    
    def get_service_fee(self, obj):
        return float(obj.amount) * 0.01
    
    def get_advertisement_fee(self, obj):
        return 0
    
    def get_discount(self, obj):
        return 0
    
    def get_tax(self, obj):
        return float(obj.amount) * 0.1
    
    def get_cogs(self, obj):
        """Tính cost of goods sold từ order items"""
        if not obj.order:
            return 0
        
        # Giả sử COGS là 60% của giá bán
        order_items = obj.order.items.all()
        total_cogs = sum(float(item.price) * item.quantity * 0.6 for item in order_items)
        return total_cogs
