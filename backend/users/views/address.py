"""
Address management views
Handles user addresses CRUD and default address setting
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..serializers import AddressSerializer

# Import models through apps
from django.apps import apps
Address = apps.get_model('users', 'Address')


class AddressViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user addresses
    - List user's addresses
    - Create new address
    - Update/delete existing addresses
    - Set default address
    """
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only addresses belonging to current user"""
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Associate new address with current user"""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["patch"])
    def set_default(self, request, pk=None):
        """
        Set an address as default
        Unsets all other addresses as non-default
        """
        address = self.get_object()
        
        # Unset all other addresses
        Address.objects.filter(user=request.user).update(is_default=False)
        
        # Set this address as default
        address.is_default = True
        address.save()
        
        return Response({"status": "Đã đặt địa chỉ mặc định"}, status=status.HTTP_200_OK)