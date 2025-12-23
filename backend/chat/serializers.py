from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Conversation, Message
from sellers.models import Seller # Import model Seller

User = get_user_model()

# --- 1. Tạo Serializer rút gọn cho User (Để lấy tên & avatar khách) ---
class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # Đảm bảo model User của bạn có các trường này
        fields = ["id", "full_name", "username", "avatar", "email"] 

# --- 2. Tạo Serializer rút gọn cho Seller (Để lấy tên Shop & ảnh) ---
class SellerSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        # Lưu ý: Kiểm tra model Seller dùng 'store_name' hay 'seller_name'
        fields = ["id", "store_name", "image"] 

# --- 3. Message Serializer (Giữ nguyên logic cũ của bạn) ---
class MessageSerializer(serializers.ModelSerializer):
    sender_avatar = serializers.ImageField(source="sender.avatar", read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "content", "image", "is_read", "created_at", "sender_avatar"]
        read_only_fields = ["id", "is_read", "created_at", "conversation", "sender"]


# --- 4. Conversation Serializer (Đã sửa) ---
class ConversationSerializer(serializers.ModelSerializer):
    # ==> THAY ĐỔI Ở ĐÂY: Sử dụng Serializer lồng nhau thay vì để mặc định
    user = UserSimpleSerializer(read_only=True)      # Trả về Object User (có avatar, name)
    seller = SellerSimpleSerializer(read_only=True)  # Trả về Object Seller (có store_name, image)
    
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        # Bỏ các trường seller_name, seller_image lẻ tẻ, dùng object 'seller' luôn cho gọn
        fields = ["id", "user", "seller", "created_at", "updated_at", "last_message_at", "last_message"]
        read_only_fields = ["id", "created_at", "updated_at", "last_message_at"]

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        return MessageSerializer(msg).data if msg else None