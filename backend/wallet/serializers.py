from rest_framework import serializers
from .models import WalletRequest, UserWallet
from users.serializers import UserSerializer


class WalletRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    processed_by = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = WalletRequest
        fields = [
            'id', 'user', 'amount', 'status', 'status_display', 
            'message', 'created_at', 'updated_at', 'processed_by', 'admin_note'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'processed_by']


class CreateWalletRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletRequest
        fields = ['amount', 'message']
        
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Số tiền phải lớn hơn 0")
        if value > 10000000:  # Giới hạn 10 triệu
            raise serializers.ValidationError("Số tiền không được vượt quá 10,000,000 ₫")
        return value


class UserWalletSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserWallet
        fields = ['id', 'user', 'balance', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']