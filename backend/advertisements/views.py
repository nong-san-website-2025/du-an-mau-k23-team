# advertisements/views.py
from rest_framework import generics
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Advertisement
from .serializers import AdvertisementSerializer

class AdvertisementActiveListView(generics.ListAPIView):
    serializer_class = AdvertisementSerializer

    def list(self, request, *args, **kwargs):
        now = timezone.now()

        queryset = Advertisement.objects.filter(
            is_active=True,
            start_date__lte=now
        ).filter(
            Q(end_date__gte=now) | Q(end_date__isnull=True)
        ).order_by('priority')

        popups = queryset.filter(ad_type='popup')
        banners = queryset.exclude(ad_type='popup')

        return Response({
            "banners": AdvertisementSerializer(banners, many=True, context={'request': request}).data,
            "popups": AdvertisementSerializer(popups, many=True, context={'request': request}).data,
        })
