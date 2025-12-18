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

    # --- PHẦN NGƯỜI BÁN (SELLER) ---
    seller_name = serializers.CharField(source='order_item.product.seller.store_name', read_only=True)
    
    # SỬA Ở ĐÂY: Đổi từ CharField sang SerializerMethodField để tránh lỗi khi không có ảnh
    seller_avatar = serializers.SerializerMethodField()

    # --- THÔNG TIN ĐƠN HÀNG & SẢN PHẨM ---
    order_id = serializers.IntegerField(source='order_item.order.id', read_only=True)
    order_code = serializers.CharField(source='order_item.order.ghn_order_code', read_only=True)
    
    product_id = serializers.IntegerField(source='order_item.product.id', read_only=True)
    product_name = serializers.CharField(source='order_item.product.name', read_only=True)
    # Tương tự, nếu product_image có thể null, bạn cũng nên dùng MethodField, 
    # nhưng thường ảnh sản phẩm là bắt buộc nên có thể giữ nguyên nếu chắc chắn có ảnh.
    product_image = serializers.CharField(source='order_item.product_image', read_only=True) 
    
    purchase_price = serializers.DecimalField(source='order_item.price', max_digits=12, decimal_places=2, read_only=True)
    purchase_quantity = serializers.IntegerField(source='order_item.quantity', read_only=True)

    media = ComplaintMediaSerializer(many=True, read_only=True)
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id',
            'order_item', 
            'order_id',
            'order_code',
            
            'user',             
            'created_by_name',   
            'created_by_email',
            'created_by_avatar',
            'seller_name',
            'seller_avatar',

            'product_id',
            'product_name',
            'product_image',
            'purchase_price',    
            'purchase_quantity', 
            
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

    # Hàm lấy avatar người mua (Bạn đã làm đúng)
    def get_created_by_avatar(self, obj):
        try:
            if obj.user and obj.user.avatar:
                return obj.user.avatar.url
        except Exception:
            pass
        return None

    # Hàm lấy avatar người bán (Mới thêm vào để sửa lỗi)
    def get_seller_avatar(self, obj):
        try:
            # Truy cập ngược từ Complaint -> OrderItem -> Product -> Seller -> User
            seller_user = obj.order_item.product.seller.user
            if seller_user.avatar:
                return seller_user.avatar.url
        except AttributeError:
            # Phòng trường hợp sản phẩm hoặc seller bị xóa
            return None
        return None