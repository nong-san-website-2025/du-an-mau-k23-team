from rest_framework.response import Response
from rest_framework import status as drf_status
from rest_framework.views import APIView

class SellerRejectAPIView(APIView):
    def post(self, request, pk):
        from .models import Seller
        try:
            seller = Seller.objects.get(pk=pk, status="pending")
        except Seller.DoesNotExist:
            return Response({"detail": "Seller not found or already processed."}, status=drf_status.HTTP_404_NOT_FOUND)
        seller.status = "rejected"
        seller.save()
        return Response({"detail": "Seller rejected."}, status=drf_status.HTTP_200_OK)
from rest_framework.response import Response
from rest_framework import status as drf_status
from rest_framework.views import APIView
from rest_framework import generics
from .models import Seller
from .serializers import SellerListSerializer, SellerDetailSerializer, SellerRegisterSerializer

class SellerApproveAPIView(APIView):
    def post(self, request, pk):
        try:
            seller = Seller.objects.get(pk=pk, status="pending")
        except Seller.DoesNotExist:
            return Response({"detail": "Seller not found or already approved."}, status=drf_status.HTTP_404_NOT_FOUND)
        seller.status = "approved"
        seller.save()
        return Response({"detail": "Seller approved."}, status=drf_status.HTTP_200_OK)



class SellerListAPIView(generics.ListAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerListSerializer

class SellerRegisterAPIView(generics.CreateAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerRegisterSerializer

    def perform_create(self, serializer):
        seller = serializer.save()
        # Cập nhật is_seller cho user
        user = seller.user
        user.is_seller = True
        user.save()

class SellerPendingListAPIView(generics.ListAPIView):
    serializer_class = SellerListSerializer
    def get_queryset(self):
        return Seller.objects.filter(status="pending")

class SellerDetailAPIView(generics.RetrieveAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerDetailSerializer
