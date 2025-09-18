from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from django.db import IntegrityError, transaction


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
    permission_classes = [AllowAny]

    def get_cart(self):
        """Lấy cart cho user hoặc guest"""
        request = self.request
        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
        else:
            session_id = request.session.session_key
            if not session_id:
                request.session.create()
                session_id = request.session.session_key
            cart, _ = Cart.objects.get_or_create(session_key=session_id, user=None)
        return cart

    def get_queryset(self):
        cart = self.get_cart()
        return CartItem.objects.filter(cart=cart).order_by('id')  # ✅ đảm bảo thứ tự ổn định


    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['cart'] = self.get_cart()
        return context

    def create(self, request, *args, **kwargs):
        cart = self.get_cart()
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

        if not product_id:
            return Response({"error": "product_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                cart_item, created = CartItem.objects.get_or_create(
                    cart=cart, product_id=product_id,
                    defaults={"quantity": quantity}
                )
                if not created:
                    cart_item.quantity += quantity
                    cart_item.save()

                serializer = self.get_serializer(cart_item)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ✅ Đưa action này vào class
    @action(detail=True, methods=['put'], url_path='update-quantity')
    def update_quantity(self, request, pk=None):
        item = self.get_object()
        try:
            quantity = int(request.data.get('quantity', 1))
        except (TypeError, ValueError):
            return Response({"error": "Quantity must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

        # Nếu số lượng < 1 thì xóa luôn
        if quantity < 1:
            item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        # Ngược lại thì cập nhật số lượng
        item.quantity = quantity
        item.save()
        serializer = self.get_serializer(item)
        return Response(serializer.data, status=status.HTTP_200_OK)

