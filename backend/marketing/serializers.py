# apps/marketing/serializers.py
from rest_framework import serializers
from .models import Banner, FlashSale, FlashSaleItem, Voucher, VoucherUsage


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = "__all__"


class FlashSaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = FlashSaleItem
        fields = ["id", "product", "product_name", "discounted_price", "limited_stock", "sold"]


class FlashSaleSerializer(serializers.ModelSerializer):
    items = FlashSaleItemSerializer(source="flashsaleitem_set", many=True, read_only=True)

    class Meta:
        model = FlashSale
        fields = ["id", "name", "start_at", "end_at", "is_active", "items"]


class VoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = "__all__"


class VoucherUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoucherUsage
        fields = "__all__"
