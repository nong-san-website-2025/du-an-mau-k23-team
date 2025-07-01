from rest_framework import viewsets, permissions
from .models import Seller
from .serializers import SellerSerializer

class SellerViewSet(viewsets.ModelViewSet):
    serializer_class = SellerSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Seller.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
