# apps/marketing/views.py
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
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        slot = self.request.query_params.get("slot")
        now = timezone.now()    
        if slot:
            qs = qs.filter(slot__code=slot)
        qs = qs.filter(is_active=True, start_at__lte=now).filter(
            models.Q(end_at__isnull=True) | models.Q(end_at__gte=now)
        )
        return qs
