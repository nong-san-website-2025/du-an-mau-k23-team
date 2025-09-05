from rest_framework import generics
from .models import Promotion
from .serializers import PromotionSerializer

# List all promotions & create new promotion
class PromotionListCreateAPIView(generics.ListCreateAPIView):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer

# Retrieve, update, delete a single promotion
class PromotionDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
