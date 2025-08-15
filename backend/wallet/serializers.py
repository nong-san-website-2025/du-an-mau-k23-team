# wallets/serializers.py
from rest_framework import serializers
from .models import Wallet, WalletTopUpRequest

class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ['balance']

class WalletTopUpRequestSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)
                                     
    class Meta:
        model = WalletTopUpRequest
        fields = ['id', 'amount', 'status', 'created_at', 'processed_at', 'user']
        read_only_fields = ['status', 'created_at', 'processed_at']
