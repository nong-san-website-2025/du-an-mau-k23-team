from rest_framework import serializers
from .models import Cart, CartItem
from .models import Product  # nếu cần
from products.serializers import ProductSerializer  # nếu cần

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product', write_only=True, required=False, allow_null=True)
    image = serializers.ImageField(read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'image']
        read_only_fields = ['cart']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
            validated_data['cart'] = cart
        if 'product' not in validated_data:
            validated_data['product'] = Product.objects.first()  # auto-select first product
        return super().create(validated_data)

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'created_at', 'items']
        read_only_fields = ['user', 'created_at']