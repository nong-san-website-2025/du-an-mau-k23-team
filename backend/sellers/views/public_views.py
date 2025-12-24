from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

from sellers.models import Seller, SellerFollow
from sellers.serializers import (
    SellerSerializer, SellerListSerializer, SellerDetailSerializer
)

@api_view(["GET"])
def search_sellers(request):
    q = request.GET.get("q", "")
    sellers = Seller.objects.filter(store_name__icontains=q)[:20]
    serializer = SellerSerializer(sellers, many=True, context={"request": request})
    return Response(serializer.data)

@api_view(["GET"])
def check_store_name(request):
    name = request.GET.get("name", "").strip()
    if not name:
        return Response({"exists": False, "message": "Tên không hợp lệ"}, status=400)
    exists = Seller.objects.filter(store_name__iexact=name).exists()
    return Response({"exists": exists})

class SellerListAPIView(generics.ListAPIView):
    serializer_class = SellerListSerializer

    def get_queryset(self):
        statuses = self.request.query_params.getlist("status")
        queryset = Seller.objects.all()
        if statuses:
            queryset = queryset.filter(status__in=statuses)
        return queryset

class SellerDetailAPIView(generics.RetrieveAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerDetailSerializer

    def get_serializer_context(self):
        return {"request": self.request}

class SellerByStatusAPIView(generics.ListAPIView):
    serializer_class = SellerListSerializer

    def get_queryset(self):
        status_group = self.kwargs["group"]
        if status_group == "business":
            return Seller.objects.filter(status__in=["active", "locked"])
        elif status_group == "approval":
            return Seller.objects.filter(status__in=["pending", "approved", "rejected"])
        return Seller.objects.none()

class FollowSellerAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, seller_id):
        seller = get_object_or_404(Seller, pk=seller_id)
        obj, created = SellerFollow.objects.get_or_create(user=request.user, seller=seller)
        if created:
            return Response({"detail": "Đã theo dõi"}, status=201)
        return Response({"detail": "Đã theo dõi trước đó"}, status=200)

    def delete(self, request, seller_id):
        seller = get_object_or_404(Seller, pk=seller_id)
        SellerFollow.objects.filter(user=request.user, seller=seller).delete()
        return Response({"detail": "Đã hủy theo dõi"}, status=200)