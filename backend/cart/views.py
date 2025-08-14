from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer

class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]
    queryset = Cart.objects.none()

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        serializer.save(cart=cart)

class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        return CartItem.objects.filter(cart=cart)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        context['cart'] = cart
        return context

    # ✅ THÊM VÀO: xử lý tạo để đảm bảo luôn trả Response
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart_item = serializer.save()  # Gọi create() trong serializer
        status_code = status.HTTP_201_CREATED

        # Nếu item đã tồn tại thì serializer sẽ trả lại item đã được cập nhật
        # => xác định `created` bằng cách xem serializer trả về có gì đặc biệt không
        return Response(CartItemSerializer(cart_item).data, status=status_code)
    
    @action(detail=True, methods=['put'], url_path='update-quantity')
    def update_quantity(self, request, pk=None):
        item = self.get_object()
        quantity = int(request.data.get('quantity', 1))
        if quantity <= 0:
            item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        item.quantity = quantity
        item.save()
        serializer = self.get_serializer(item)
        return Response(serializer.data)
