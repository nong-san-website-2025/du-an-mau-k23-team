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
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        return CartItem.objects.filter(cart=cart)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        context['cart'] = cart
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Nhận cả item và cờ created
        cart_item, created = serializer.save()
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK

        return Response(self.get_serializer(cart_item).data, status=status_code)

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
        cart, _ = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

        try:
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart, product_id=product_id
            )
            if not created:
                cart_item.quantity += quantity
                cart_item.save()
                return Response(self.get_serializer(cart_item).data, status=status.HTTP_200_OK)
            else:
                cart_item.quantity = quantity
                cart_item.save()
                return Response(self.get_serializer(cart_item).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            raise serializers.ValidationError(str(e))
    
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
