from rest_framework import serializers
from .models import Promotion, FlashSale, StoreVoucher

class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = '__all__'


class FlashSaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlashSale
        fields = '__all__'


class StoreVoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreVoucher
        fields = '__all__'
