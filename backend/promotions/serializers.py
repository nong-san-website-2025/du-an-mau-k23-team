from rest_framework import serializers
from .models import Promotion, Voucher ,FlashSale 


class PromotionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = ['id', 'code', 'name', 'type', 'start', 'end', 'active']


class VoucherDetailSerializer(serializers.ModelSerializer):
    promotion = PromotionListSerializer(read_only=True)

    class Meta:
        model = Voucher
        fields = [
            'id', 'code', 'title', 'description', 'scope', 'seller',
            'discount_percent', 'discount_amount', 'freeship_amount',
            'min_order_value', 'max_discount_amount',
            'start_at', 'end_at', 'active', 'promotion', 'created_by', 'created_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'promotion']

    def validate(self, data):
        # ensure only 1 discount type set
        count = 0
        for k in ('discount_percent', 'discount_amount', 'freeship_amount'):
            if data.get(k) is not None:
                count += 1
        if count == 0:
            raise serializers.ValidationError("Phải cung cấp 1 trong các loại giảm: discount_percent, discount_amount, freeship_amount")
        if count > 1:
            raise serializers.ValidationError("Chỉ được tổng cộng 1 loại giảm.")
        # normalize percent: store as number (ex: 20 means 20)
        if data.get('discount_percent') is not None:
            val = data['discount_percent']
            if val < 0 or val > 100:
                raise serializers.ValidationError("discount_percent phải trong 0 - 100.")
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['created_by'] = user if user.is_authenticated else None
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # prevent non-admin creating system vouchers - but permission layer should handle it
        return super().update(instance, validated_data)


class FlashSaleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    seller_name = serializers.CharField(source="seller.store_name", read_only=True)

    class Meta:
        model = FlashSale
        fields = "__all__"