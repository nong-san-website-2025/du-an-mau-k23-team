# apps/marketing/views.py
from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import  AllowAny
from django.utils import timezone

from .models import Banner
from .serializers import (
    BannerSerializer
)

# --------- ADMIN CRUD VIEWS ---------
class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = Banner.objects.all()
        position = self.request.query_params.get('position')
        if position:
            queryset = queryset.filter(position=position)
        return queryset

