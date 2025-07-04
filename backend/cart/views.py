from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from users.models import CustomUser
from products.models import Product

class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    queryset = Cart.objects.all()
    permission_classes = [AllowAny]  # ✅ Tạm thời cho test tự do

    def perform_create(self, serializer):
        user = CustomUser.objects.first()  # ✅ Dùng user đầu tiên để test
        serializer.save(user=user)

class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    queryset = CartItem.objects.all()
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = CustomUser.objects.first()  # ✅ Dùng user đầu tiên
        cart, _ = Cart.objects.get_or_create(user=user)
        serializer.save(cart=cart)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def add(self, request):
        user = CustomUser.objects.first()
        cart, _ = Cart.objects.get_or_create(user=user)

        product_id = request.data.get('product')
        quantity = int(request.data.get('quantity', 1))
        image = request.FILES.get('image')

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Sản phẩm không tồn tại'}, status=status.HTTP_400_BAD_REQUEST)

        item, created = CartItem.objects.get_or_create(cart=cart, product=product)

        if not created:
            item.quantity += quantity
        else:
            item.quantity = quantity

        if image:
            item.image = image

        item.save()
        serializer = self.get_serializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['put'], permission_classes=[AllowAny])  # ✅ Cho phép PUT không cần đăng nhập
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

    @action(detail=True, methods=['delete'], permission_classes=[AllowAny])
    def delete(self, request, pk=None):
        item = self.get_object()
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
