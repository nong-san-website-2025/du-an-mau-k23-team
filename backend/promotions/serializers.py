# promotions/serializers.py
from rest_framework import serializers
from .models import Voucher, FlashSale, FlashSaleItem, Promotion


class VoucherSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source="seller.store_name", read_only=True)

    class Meta:
        model = Voucher
        fields = "__all__"


class FlashSaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    original_price = serializers.DecimalField(
        source="product.price", max_digits=12, decimal_places=2, read_only=True
    )
    discount_percent = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    seller_name = serializers.CharField(source="product.seller.store_name", read_only=True)
    campaign_name = serializers.CharField(source="flashsale.title", read_only=True)

    # fix chỗ lỗi: dùng SerializerMethodField thay vì fields thật trong model
    total_stock = serializers.SerializerMethodField()
    remaining_stock = serializers.SerializerMethodField()

    class Meta:
        model = FlashSaleItem
        fields = [
            "id",
            "campaign_name",
            "product_name",
            "original_price",
            "sale_price",
            "discount_percent",
            "total_stock",
            "remaining_stock",
            "status",
            "seller_name",
            "flashsale",
            "product",
        ]

    def get_discount_percent(self, obj):
        try:
            return round((1 - obj.sale_price / obj.product.price) * 100, 2)
        except Exception:
            return 0

    def get_status(self, obj):
        from django.utils import timezone
        now = timezone.now()
        if obj.flashsale.start_at > now:
            return "upcoming"
        elif obj.flashsale.end_at < now:
            return "ended"
        return "active"

    def get_total_stock(self, obj):
        # bạn có thể custom cách tính total stock ở đây
        return obj.stock_limit if obj.stock_limit is not None else 0

    def get_remaining_stock(self, obj):
        # giả sử remaining_stock = stock_limit (chưa bán gì)
        return obj.stock_limit if obj.stock_limit is not None else 0

class FlashSaleSerializer(serializers.ModelSerializer):
    items = FlashSaleItemSerializer(many=True, read_only=True)

    class Meta:
        model = FlashSale
        fields = "__all__"


class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = ['id', 'code', 'name', 'description', 'type', 'condition', 'start', 'end', 'total', 'used', 'products']
