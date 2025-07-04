from rest_framework import viewsets, permissions
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = []  # Cho phép truy cập tự do để test
    queryset = Cart.objects.all()


    def get_queryset(self):
        return Cart.objects.all()
    def perform_create(self, serializer):
        serializer.save()

class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = []  # Cho phép truy cập tự do để test
    queryset = CartItem.objects.all()

    def get_queryset(self):
        return CartItem.objects.all()

    def perform_create(self, serializer):
        # Lấy cart đầu tiên hoặc tạo mới nếu chưa có (test nhanh)
        cart = Cart.objects.first() or Cart.objects.create(user=None)
        serializer.save(cart=cart)

    @action(detail=False, methods=['post'])
    def add(self, request):
        cart = Cart.objects.first() or Cart.objects.create(user=None)
        product_id = request.data.get('product')
        quantity = int(request.data.get('quantity', 1))
        item, created = CartItem.objects.get_or_create(cart=cart, product_id=product_id)
        if not created:
            item.quantity += quantity
            item.save()
        else:
            item.quantity = quantity
            item.save()
        serializer = self.get_serializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['put'])
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

    @action(detail=True, methods=['delete'])
    def delete(self, request, pk=None):
        item = self.get_object()
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)