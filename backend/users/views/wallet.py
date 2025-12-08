"""
Wallet balance views
Handles user wallet balance queries
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from users.models import UserWalletTransaction
from users.utils_views import get_wallet_balance, create_wallet_transaction


class WalletBalanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        balance = get_wallet_balance(request.user)
        return Response({"balance": float(balance)})


class WalletTransactionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 20))
        
        offset = (page - 1) * limit
        
        transactions = UserWalletTransaction.objects.filter(
            user=request.user
        )[offset:offset + limit]
        
        data = [
            {
                'id': t.id,
                'amount': float(t.amount),
                'type': t.transaction_type,
                'description': t.description,
                'balance_before': float(t.balance_before),
                'balance_after': float(t.balance_after),
                'created_at': t.created_at.isoformat(),
            }
            for t in transactions
        ]
        
        total = UserWalletTransaction.objects.filter(user=request.user).count()
        
        return Response({
            'results': data,
            'total': total,
            'page': page,
            'limit': limit,
        })


class WalletDepositView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        
        if not amount or float(amount) <= 0:
            return Response(
                {'detail': 'Số tiền phải lớn hơn 0'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        transaction, success = create_wallet_transaction(
            user=request.user,
            amount=amount,
            transaction_type='deposit',
            description='Nạp tiền vào ví',
        )
        
        if not success:
            return Response(
                {'detail': 'Nạp tiền thất bại'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'detail': 'Nạp tiền thành công',
            'balance': float(request.user.wallet_balance),
            'transaction_id': transaction.id,
        })


class WalletWithdrawView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        
        if not amount or float(amount) <= 0:
            return Response(
                {'detail': 'Số tiền phải lớn hơn 0'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        transaction, success = create_wallet_transaction(
            user=request.user,
            amount=amount,
            transaction_type='withdraw',
            description='Rút tiền từ ví',
        )
        
        if not success:
            return Response(
                {'detail': 'Số dư không đủ'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'detail': 'Rút tiền thành công',
            'balance': float(request.user.wallet_balance),
            'transaction_id': transaction.id,
        })