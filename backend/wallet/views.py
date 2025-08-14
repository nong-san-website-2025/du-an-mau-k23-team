from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import WalletRequest, UserWallet
from .serializers import (
    WalletRequestSerializer, 
    CreateWalletRequestSerializer, 
    UserWalletSerializer
)
from users.permissions import IsAdmin


class WalletRequestViewSet(viewsets.ModelViewSet):
    serializer_class = WalletRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or getattr(user, 'is_admin', False):
            # Admin có thể xem tất cả yêu cầu
            return WalletRequest.objects.all()
        else:
            # User chỉ xem yêu cầu của mình
            return WalletRequest.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateWalletRequestSerializer
        return WalletRequestSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdmin])
    def approve(self, request, pk=None):
        """Chỉ admin mới có thể xác nhận yêu cầu"""
        wallet_request = self.get_object()
        
        if wallet_request.status != 'pending':
            return Response(
                {'error': 'Yêu cầu này đã được xử lý'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Cập nhật trạng thái yêu cầu
            wallet_request.status = 'approved'
            wallet_request.processed_by = request.user
            wallet_request.admin_note = request.data.get('admin_note', '')
            wallet_request.save()
            
            # Cập nhật số dư ví của user
            user_wallet, created = UserWallet.objects.get_or_create(
                user=wallet_request.user,
                defaults={'balance': 0}
            )
            user_wallet.balance += wallet_request.amount
            user_wallet.save()
        
        serializer = self.get_serializer(wallet_request)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdmin])
    def reject(self, request, pk=None):
        """Chỉ admin mới có thể từ chối yêu cầu"""
        wallet_request = self.get_object()
        
        if wallet_request.status != 'pending':
            return Response(
                {'error': 'Yêu cầu này đã được xử lý'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        wallet_request.status = 'rejected'
        wallet_request.processed_by = request.user
        wallet_request.admin_note = request.data.get('admin_note', '')
        wallet_request.save()
        
        serializer = self.get_serializer(wallet_request)
        return Response(serializer.data)


class UserWalletView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Lấy thông tin ví của user hiện tại"""
        user_wallet, created = UserWallet.objects.get_or_create(
            user=request.user,
            defaults={'balance': 0}
        )
        serializer = UserWalletSerializer(user_wallet)
        return Response(serializer.data)


class AdminWalletStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get(self, request):
        """Thống kê tổng quan cho admin"""
        from django.db.models import Sum, Count
        
        stats = {
            'total_pending': WalletRequest.objects.filter(status='pending').count(),
            'total_approved': WalletRequest.objects.filter(status='approved').count(),
            'total_rejected': WalletRequest.objects.filter(status='rejected').count(),
            'total_amount_pending': WalletRequest.objects.filter(
                status='pending'
            ).aggregate(Sum('amount'))['amount__sum'] or 0,
            'total_amount_approved': WalletRequest.objects.filter(
                status='approved'
            ).aggregate(Sum('amount'))['amount__sum'] or 0,
            'total_users_with_wallet': UserWallet.objects.count(),
            'total_wallet_balance': UserWallet.objects.aggregate(
                Sum('balance')
            )['balance__sum'] or 0,
        }
        
        return Response(stats)