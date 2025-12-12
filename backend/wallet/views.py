# wallets/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.timezone import now
from .models import Wallet, WalletTopUpRequest
from .serializers import WalletSerializer, WalletTopUpRequestSerializer

class WalletViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def my_wallet(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def request_topup(self, request):
        amount = request.data.get('amount')
        if not amount or float(amount) <= 0:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        req = WalletTopUpRequest.objects.create(
            user=request.user,
            amount=amount
        )
        return Response(WalletTopUpRequestSerializer(req).data, status=status.HTTP_201_CREATED)


class WalletTopUpAdminViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    def list(self, request):
        requests = WalletTopUpRequest.objects.all().order_by('-created_at')
        serializer = WalletTopUpRequestSerializer(requests, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        topup_request = WalletTopUpRequest.objects.get(pk=pk)
        if topup_request.status != 'pending':
            return Response({'error': 'Already processed'}, status=status.HTTP_400_BAD_REQUEST)

        wallet, _ = Wallet.objects.get_or_create(user=topup_request.user)
        wallet.balance += topup_request.amount
        wallet.save()

        topup_request.status = 'approved'
        topup_request.processed_at = now()
        topup_request.save()

        return Response({'message': 'Approved and balance updated'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        topup_request = WalletTopUpRequest.objects.get(pk=pk)
        if topup_request.status != 'pending':
            return Response({'error': 'Already processed'}, status=status.HTTP_400_BAD_REQUEST)

        topup_request.status = 'rejected'
        topup_request.processed_at = now()
        topup_request.save()

        return Response({'message': 'Request rejected'})
