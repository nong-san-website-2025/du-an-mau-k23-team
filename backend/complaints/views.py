# backend/app/views.py
from rest_framework import viewsets
from .models import Complaint, ComplaintMedia
from .serializers import ComplaintSerializer
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from decimal import Decimal
from django.db.models import Q

class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all().order_by('-created_at')
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]  # 👈 đảm bảo chỉ user login mới gửi complaint

    def get_queryset(self):
        qs = super().get_queryset()
        user = getattr(self.request, "user", None)
        if not user or user.is_anonymous:
            return qs.none()
        if user.is_staff or user.is_superuser:
            return qs
        # Customers see their own complaints; sellers see complaints for their products
        return qs.filter(Q(user=user) | Q(product__seller__user=user))

    def create(self, request, *args, **kwargs):
        files = request.FILES.getlist('media')
        product_id = request.data.get('product')
        reason = request.data.get('reason')
        if not product_id:
            return Response({'error': 'Thiếu product'}, status=status.HTTP_400_BAD_REQUEST)
        if not reason:
            return Response({'error': 'Thiếu lý do khiếu nại'}, status=status.HTTP_400_BAD_REQUEST)

        # Parse quantity and unit price if provided by frontend; fallback to defaults
        try:
            quantity = int(request.data.get('quantity') or 1)
        except Exception:
            quantity = 1
        unit_price_raw = request.data.get('unit_price')

        try:
            complaint = Complaint.objects.create(
                user=request.user,
                product_id=product_id,
                reason=reason,
                quantity=quantity,
            )
            # If unit_price not provided or invalid, fallback to current product price
            try:
                if unit_price_raw is not None and str(unit_price_raw) != "":
                    complaint.unit_price = Decimal(str(unit_price_raw))
                else:
                    complaint.unit_price = complaint.product.price
            except Exception:
                complaint.unit_price = complaint.product.price
            complaint.save()

            for f in files:
                ComplaintMedia.objects.create(complaint=complaint, file=f)
            serializer = self.get_serializer(complaint)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': f'Lỗi khi tạo khiếu nại: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        # Không cần dùng nữa, đã custom create
        pass

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """
        Seller (owner of the product) or Admin resolves a complaint.
        - resolution_type: one of ['refund_full','refund_partial','replace','voucher','reject']
        - amount (required for refund_partial): integer/decimal string (VNĐ)
        Credits the user's wallet on refund_*.
        """
        complaint = self.get_object()

        # Permission: allow staff OR product owner (seller)
        user = request.user
        is_owner = hasattr(complaint.product, 'seller') and getattr(complaint.product.seller, 'user_id', None) == user.id
        if not (user and (user.is_staff or user.is_superuser or is_owner)):
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)

        resolution_type = request.data.get('resolution_type')
        amount_raw = request.data.get('amount')

        valid_types = {'refund_full', 'refund_partial', 'replace', 'voucher', 'reject'}
        if resolution_type not in valid_types:
            return Response({'error': 'Invalid resolution_type'}, status=status.HTTP_400_BAD_REQUEST)

        # Default status based on resolution
        complaint.status = 'resolved' if resolution_type != 'reject' else 'rejected'
        complaint.resolution_type = resolution_type

        wallet_balance = None

        from wallet.models import Wallet

        if resolution_type == 'refund_partial':
            if amount_raw is None:
                return Response({'error': 'amount is required for refund_partial'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                amount = Decimal(str(amount_raw))
            except Exception:
                return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
            if amount <= 0:
                return Response({'error': 'Amount must be > 0'}, status=status.HTTP_400_BAD_REQUEST)

            # Credit wallet
            wallet, _ = Wallet.objects.get_or_create(user=complaint.user)
            wallet.balance = (wallet.balance or Decimal('0')) + amount
            wallet.save()
            wallet_balance = wallet.balance

        elif resolution_type == 'refund_full':
            # Credit full amount = unit_price * quantity (fallback to product.price)
            unit_price = complaint.unit_price or complaint.product.price
            try:
                amount = (unit_price or Decimal('0')) * Decimal(complaint.quantity or 1)
                # Wallet uses 0 decimal places (VND). Quantize to integer VND.
                amount = amount.quantize(Decimal('1'))
            except Exception:
                amount = Decimal('0')
            if amount > 0:
                wallet, _ = Wallet.objects.get_or_create(user=complaint.user)
                wallet.balance = (wallet.balance or Decimal('0')) + amount
                wallet.save()
                wallet_balance = wallet.balance

        complaint.save()
        data = self.get_serializer(complaint).data
        if wallet_balance is not None:
            data['wallet_balance'] = str(wallet_balance)
        return Response(data, status=status.HTTP_200_OK)