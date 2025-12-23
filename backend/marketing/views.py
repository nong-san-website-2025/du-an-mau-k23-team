from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser, AllowAny
from .models import Banner, AdSlot
from .serializers import BannerSerializer, AdSlotSerializer
from django.utils import timezone
from django.db import models

class AdSlotViewSet(viewsets.ModelViewSet):
    queryset = AdSlot.objects.all()
    serializer_class = AdSlotSerializer
    permission_classes = [IsAdminUser]

class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [AllowAny] # Để khách cũng xem được banner công khai

    def get_queryset(self):
        # Lấy queryset gốc
        qs = super().get_queryset()
        
        # Lấy tham số từ URL
        slot = self.request.query_params.get("slot")
        scope = self.request.query_params.get("scope") # Tham số mới xác định ai đang gọi API
        now = timezone.now()

        # 1. Lọc theo vị trí (nếu có)
        if slot:
            qs = qs.filter(slot__code=slot)

        # 2. Logic phân quyền hiển thị
        if scope == 'public':
            # --- LOGIC CHO KHÁCH (Trang chủ) ---
            # Chỉ lấy banner đang Bật (active) VÀ đang trong thời gian hiển thị
            qs = qs.filter(is_active=True, start_at__lte=now).filter(
                models.Q(end_at__isnull=True) | models.Q(end_at__gte=now)
            )
        else:
            # --- LOGIC CHO ADMIN ---
            # Lấy TẤT CẢ (Active/Inactive, Quá khứ/Tương lai) để quản lý
            # Sắp xếp: Ưu tiên cao nhất lên đầu, sau đó đến ngày tạo mới nhất
            qs = qs.order_by('-priority', '-created_at')

        return qs