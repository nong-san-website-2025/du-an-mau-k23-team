from rest_framework import viewsets, permissions
from .models import Order
from .serializers import OrderSerializer, OrderCreateSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated

class OrderViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Order.objects.all()

        if user.is_authenticated:
            queryset = queryset.filter(user=user)  # ✅ Chỉ lấy order của user hiện tại

        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    def perform_create(self, serializer):
        order = serializer.save(user=self.request.user)
        # Tích điểm: cứ 1000đ thì được 10 điểm
        points_earned = (order.total_price // 1000) * 10
        if points_earned > 0:
            user = self.request.user
            user.points += points_earned
            user.save()
            # Lưu lịch sử tích điểm
            from users.models import PointHistory
            PointHistory.objects.create(
                user=user,
                order_id=str(order.id),
                points=points_earned,
                amount=order.total_price,
                action=f"Cộng điểm khi thanh toán đơn hàng #{order.id}"
            )
