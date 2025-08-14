from rest_framework import generics
from .models import Seller
from .serializers import SellerListSerializer, SellerDetailSerializer

class SellerListAPIView(generics.ListAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerListSerializer

class SellerDetailAPIView(generics.RetrieveAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerDetailSerializer
