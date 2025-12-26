# backend/complaints/serializers.py
from rest_framework import serializers
from .models import Complaint, ComplaintMedia
from orders.models import OrderItem

class ComplaintMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintMedia
        fields = ['id', 'file', 'uploaded_at']

class ComplaintSerializer(serializers.ModelSerializer):
    # --- PHẦN NGƯỜI MUA (BUYER) ---
    created_by_name = serializers.CharField(source='user.full_name', read_only=True)
    created_by_email = serializers.CharField(source='user.email', read_only=True)
    created_by_avatar = serializers.SerializerMethodField()
    buyer_address = serializers.SerializerMethodField()
    buyer_bank_name = serializers.CharField(source='user.bank_name', read_only=True)
    buyer_account_number = serializers.CharField(source='user.account_number', read_only=True)
    buyer_account_holder_name = serializers.CharField(source='user.account_holder_name', read_only=True)

    # --- PHẦN NGƯỜI BÁN (SELLER) ---
    seller_name = serializers.CharField(source='order_item.product.seller.store_name', read_only=True)
    seller_avatar = serializers.SerializerMethodField()
    shop_name = serializers.CharField(source='order_item.product.seller.store_name', read_only=True)
    shop_address = serializers.SerializerMethodField()

    # --- THÔNG TIN ĐƠN HÀNG (QUAN TRỌNG: Cần thêm payment_method và ngày đặt) ---
    order_id = serializers.IntegerField(source='order_item.order.id', read_only=True)
    
    # Mã đơn hàng: Bạn đang lấy mã GHN, nếu null thì nên fallback về ID
    order_code = serializers.SerializerMethodField() 

    # [MỚI] Phương thức thanh toán (COD / VNPay / Wallet...)
    payment_method = serializers.CharField(source='order_item.order.payment_method', read_only=True)

    # [MỚI] Ngày đặt hàng gốc
    order_created_at = serializers.DateTimeField(source='order_item.order.created_at', read_only=True)
    
    # --- THÔNG TIN SẢN PHẨM ---
    product_id = serializers.IntegerField(source='order_item.product.id', read_only=True)
    product_name = serializers.CharField(source='order_item.product.name', read_only=True)
    product_image = serializers.CharField(source='order_item.product_image', read_only=True) 
    
    purchase_price = serializers.DecimalField(source='order_item.price', max_digits=12, decimal_places=2, read_only=True)
    purchase_quantity = serializers.IntegerField(source='order_item.quantity', read_only=True)
    refund_amount = serializers.SerializerMethodField()
    quantity = serializers.IntegerField(source='order_item.quantity', read_only=True)

    media = ComplaintMediaSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id',
            'order_item', 
            'order_id',
            'order_code',
            'payment_method',    # <--- Nhớ thêm vào fields
            'order_created_at',  # <--- Nhớ thêm vào fields
            
            'user',             
            'created_by_name',   
            'created_by_email',
            'created_by_avatar',
            'buyer_address',
            'buyer_bank_name',
            'buyer_account_number',
            'buyer_account_holder_name',
            'seller_name',
            'seller_avatar',
            'shop_name',
            'shop_address',

            'product_id',
            'product_name',
            'product_image',
            'purchase_price',    
            'purchase_quantity',
            'refund_amount',
            'quantity',
            
            'reason',
            'status',
            'status_display',
            
            'seller_response', 
            'admin_notes',       
            
            'media',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['status', 'user', 'seller_response', 'admin_notes']

    def get_created_by_avatar(self, obj):
        try:
            if obj.user and obj.user.avatar:
                return obj.user.avatar.url
        except Exception:
            pass
        return None

    def get_seller_avatar(self, obj):
        try:
            seller_user = obj.order_item.product.seller.user
            if seller_user.avatar:
                return seller_user.avatar.url
        except AttributeError:
            return None
        return None

    # Logic lấy mã đơn hàng an toàn: Nếu không có mã GHN thì lấy ID đơn
    def get_order_code(self, obj):
        try:
            code = obj.order_item.order.ghn_order_code
            if code: 
                return code
            return str(obj.order_item.order.id) # Fallback về ID
        except AttributeError:
            return "N/A"
    
    def get_buyer_address(self, obj):
        try:
            address = obj.order_item.order.shipping_address
            if address:
                return f"{address.location}"
            return "N/A"
        except AttributeError:
            return "N/A"
    
    def get_shop_address(self, obj):
        try:
            seller = obj.order_item.product.seller
            if seller.address:
                return seller.address
            return "N/A"
        except AttributeError:
            return "N/A"
    
    def get_refund_amount(self, obj):
        try:
            return float(obj.order_item.price * obj.order_item.quantity)
        except:
            return 0