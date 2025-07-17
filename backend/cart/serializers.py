from rest_framework import serializers
from .models import Cart, CartItem
from products.serializers import ProductSerializer  # nếu cần

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
<<<<<<< HEAD

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity']

=======
    image = serializers.ImageField(read_only=True)
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'image' ]
        read_only_fields = ['user']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

        
>>>>>>> feature/backend_cart_NhatNguyen
class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'created_at', 'items']
<<<<<<< HEAD
        read_only_fields = ['user', 'created_at']
=======
        read_only_fields = ['user', 'created_at']
>>>>>>> feature/backend_cart_NhatNguyen
