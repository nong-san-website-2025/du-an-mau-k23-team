# promotions/serializers.py
from rest_framework import serializers
from .models import Voucher, FlashSale, FlashSaleItem

class VoucherSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source="seller.store_name", read_only=True)

    class Meta:
        model = Voucher
        fields = "__all__"


class FlashSaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = FlashSaleItem
        fields = "__all__"


class FlashSaleSerializer(serializers.ModelSerializer):
    items = FlashSaleItemSerializer(many=True, read_only=True)

    class Meta:
        model = FlashSale
        fields = "__all__"
