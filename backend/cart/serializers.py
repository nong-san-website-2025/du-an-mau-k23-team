from rest_framework import serializers
from .models import Cart, CartItem
from products.serializers import ProductSerializer  # nếu cần

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    image = serializers.ImageField(read_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'image']
        read_only_fields = ['cart']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
            validated_data['cart'] = cart
        return super().create(validated_data)

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'created_at', 'items']
        read_only_fields = ['user', 'created_at']