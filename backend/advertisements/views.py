# advertisements/views.py
from rest_framework import viewsets, filters, generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Advertisement
from .serializers import AdvertisementSerializer
from django_filters.rest_framework import DjangoFilterBackend


class AdvertisementViewSet(viewsets.ModelViewSet):
    """
    ViewSet quản trị quảng cáo - CRUD đầy đủ
    """
    queryset = Advertisement.objects.all()
    serializer_class = AdvertisementSerializer
    permission_classes = [IsAuthenticated]  # chỉ admin, staff, marketing được phép

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ad_type', 'target_type', 'is_active']
    search_fields = ['title', 'description']
    ordering_fields = ['priority', 'start_date', 'end_date', 'created_at']
    ordering = ['priority']

    def perform_create(self, serializer):
        return serializer.save()

    def perform_update(self, serializer):
        return serializer.save()


class AdvertisementActiveListView(generics.ListAPIView):
    """
    API công khai cho client - chỉ trả về quảng cáo đang hoạt động
    - Dùng trên trang chủ, trang flash sale, popup modal...
    """
    serializer_class = AdvertisementSerializer
    permission_classes = [AllowAny]  # không cần đăng nhập

    def list(self, request, *args, **kwargs):
        now = timezone.now()

        # Lọc quảng cáo đang hoạt động
        queryset = Advertisement.objects.filter(
            is_active=True,
            start_date__lte=now
        ).filter(
            Q(end_date__gte=now) | Q(end_date__isnull=True)
        ).order_by('priority')

        # Popup
        popups = queryset.filter(ad_type='popup')

        # Các quảng cáo khác
        banners = queryset.exclude(ad_type='popup')

        return Response({
            "banners": AdvertisementSerializer(banners, many=True, context={'request': request}).data,
            "popups": AdvertisementSerializer(popups, many=True, context={'request': request}).data,
        })
