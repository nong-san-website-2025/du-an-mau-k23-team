from rest_framework import serializers
from .models import Promotion, Voucher ,FlashSale , FlashSaleItem , UserVoucher
from products.models import Product
from products.serializers import ProductListSerializer

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


class FlashSaleItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source="product", write_only=True)

    class Meta:
        model = FlashSaleItem
        fields = ["id", "product", "product_id", "sale_price", "quantity", "sold"]


class FlashSaleSerializer(serializers.ModelSerializer):
    items = FlashSaleItemSerializer(many=True)

    class Meta:
        model = FlashSale
        fields = ["id", "name", "start_time", "end_time", "created_at", "items"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        flash_sale = FlashSale.objects.create(**validated_data)
        for item_data in items_data:
            FlashSaleItem.objects.create(flash_sale=flash_sale, **item_data)
        return flash_sale

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", [])
        instance.name = validated_data.get("name", instance.name)
        instance.start_time = validated_data.get("start_time", instance.start_time)
        instance.end_time = validated_data.get("end_time", instance.end_time)
        instance.save()

        # Cập nhật items
        instance.items.all().delete()
        for item_data in items_data:
            FlashSaleItem.objects.create(flash_sale=instance, **item_data)

        return instance
    

class VoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = "__all__"

class UserVoucherSerializer(serializers.ModelSerializer):
    voucher = VoucherSerializer()

    class Meta:
        model = UserVoucher
        fields = ["id", "voucher", "is_used", "used_at"]    