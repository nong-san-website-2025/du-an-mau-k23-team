from rest_framework import serializers
from .models import Cart, CartItem
from .models import Product  # nếu cần
from products.serializers import ProductSerializer  # nếu cần

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), write_only=True
    )

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity']
        read_only_fields = ['id']

    def create(self, validated_data):
        cart = self.context.get('cart')
        product = validated_data.pop('product_id')
        quantity = validated_data.get('quantity', 1)

        # Nếu sản phẩm đã tồn tại trong giỏ, cộng dồn số lượng
        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
            return cart_item

        return CartItem.objects.create(cart=cart, product=product, quantity=quantity)
    
    


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'created_at', 'items',]
        read_only_fields = ['user', 'created_at']