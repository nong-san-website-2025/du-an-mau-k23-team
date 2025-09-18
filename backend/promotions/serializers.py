from rest_framework import serializers
from .models import Promotion, Voucher, FlashSale, FlashSaleItem, UserVoucher
from products.serializers import ProductListSerializer
from products.models import Product

class PromotionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = ['id', 'code', 'name', 'type', 'start', 'end', 'active']


class VoucherDetailSerializer(serializers.ModelSerializer):
    promotion = PromotionListSerializer(read_only=True)
    per_user_quantity = serializers.IntegerField(required=False, default=1)

    class Meta:
        model = Voucher
        fields = [
            'id', 'code', 'title', 'description', 'scope', 'seller',
            'discount_percent', 'discount_amount', 'freeship_amount',
            'min_order_value', 'max_discount_amount',
            'start_at', 'end_at', 'active', 'promotion', 'created_by', 'created_at',
            # new distribution / quantity fields
            'distribution_type', 'total_quantity', 'per_user_quantity','discount_type',
        ]
        read_only_fields = ['created_by', 'created_at', 'promotion']

    def validate(self, data):
        # --- Discount type validation ---
        count = sum(1 for k in ('discount_percent', 'discount_amount', 'freeship_amount') if data.get(k) is not None)
        if count == 0:
            raise serializers.ValidationError("Phải cung cấp 1 trong các loại giảm: discount_percent, discount_amount, freeship_amount")
        if count > 1:
            raise serializers.ValidationError("Chỉ được tổng cộng 1 loại giảm.")
        if data.get('discount_percent') is not None:
            val = data['discount_percent']
            if val < 0 or val > 100:
                raise serializers.ValidationError("discount_percent phải trong 0 - 100.")

        # --- Fix per_user_quantity ---
        dist_type = data.get('distribution_type')
        if dist_type == Voucher.DistributionType.CLAIM:
            if data.get('per_user_quantity') is None:
                data['per_user_quantity'] = 1
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['created_by'] = user if user.is_authenticated else None
        voucher = super().create(validated_data)
        # note: distribution to users handled in view perform_create (so we don't import User here)
        return voucher

    def update(self, instance, validated_data):
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
        instance.items.all().delete()
        for item_data in items_data:
            FlashSaleItem.objects.create(flash_sale=instance, **item_data)
        return instance

class VoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = "__all__"

class UserVoucherSerializer(serializers.ModelSerializer):
    voucher = VoucherDetailSerializer(read_only=True)

    class Meta:
        model = UserVoucher
        fields = [
            "id",
            "voucher",
            "quantity",
            "used_count",
            "is_used",
            "used_at",
        ]