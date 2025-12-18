# backend/complaints/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q
from decimal import Decimal
from django.conf import settings

# Import Models
from .models import Complaint, ComplaintMedia
from orders.models import OrderItem, Order
from wallet.models import Wallet 

# Import Serializers
from .serializers import ComplaintSerializer

class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all().order_by('-created_at')
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
            return Complaint.objects.all().order_by('-created_at')
        
        # Buyer: Xem khiếu nại mình tạo
        # Seller: Xem khiếu nại liên quan đến sản phẩm shop mình bán
        # Lưu ý: Cần điều chỉnh query seller tùy theo model Seller của bạn
        return Complaint.objects.filter(
            Q(user=user) | 
            Q(order_item__product__seller__user=user) 
        ).distinct().order_by('-created_at')

    # ==========================================
    # 1. BUYER: TẠO KHIẾU NẠI
    # ==========================================
    def create(self, request, *args, **kwargs):
        files = request.FILES.getlist('media')
        # Lấy ID của Item trong đơn hàng (KHÔNG PHẢI Product ID)
        order_item_id = request.data.get('order_item_id') 
        reason = request.data.get('reason')

        if not order_item_id:
            return Response({'error': 'Thiếu order_item_id'}, status=status.HTTP_400_BAD_REQUEST)
        if not reason:
            return Response({'error': 'Thiếu lý do khiếu nại'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order_item = OrderItem.objects.get(id=order_item_id)
            
            # Check quyền: Chỉ người mua đơn này mới được kiện
            if order_item.order.user != request.user:
                return Response({'error': 'Bạn không sở hữu đơn hàng này'}, status=403)
            
            # Check trạng thái: Không thể kiện nếu đã xong
            if order_item.status in ['REFUND_REQUESTED', 'REFUND_APPROVED', 'DISPUTE_TO_ADMIN']:
                return Response({'error': 'Sản phẩm này đang được xử lý khiếu nại'}, status=400)

            with transaction.atomic():
                # Tạo Complaint
                complaint = Complaint.objects.create(
                    order_item=order_item,
                    user=request.user,
                    reason=reason,
                    status='pending'
                )

                # Lưu ảnh
                for f in files:
                    ComplaintMedia.objects.create(complaint=complaint, file=f)

                # Cập nhật trạng thái OrderItem & Order
                order_item.status = 'REFUND_REQUESTED'
                order_item.save()
                
                # Block tiền Seller
                order_item.order.is_disputed = True
                order_item.order.save(update_fields=['is_disputed'])

            serializer = self.get_serializer(complaint)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except OrderItem.DoesNotExist:
            return Response({'error': 'Không tìm thấy sản phẩm'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    # ==========================================
    # 2. SELLER: PHẢN HỒI (CHẤP NHẬN / TỪ CHỐI)
    # ==========================================
    @action(detail=True, methods=['post'], url_path='seller-respond')
    def seller_respond(self, request, pk=None):
        complaint = self.get_object()
        action_type = request.data.get('action') # 'accept' hoặc 'reject'
        reason = request.data.get('reason', '') # Lý do nếu từ chối
        
        # Check quyền chủ shop
        try:
            # Giả sử quan hệ: Product -> Seller -> User
            is_seller = complaint.order_item.product.seller.user == request.user
        except AttributeError:
            is_seller = False
            
        if not is_seller:
             return Response({'error': 'Bạn không phải người bán sản phẩm này'}, status=403)

        if complaint.status != 'pending':
            return Response({'error': 'Chỉ xử lý được khiếu nại đang chờ'}, status=400)

        with transaction.atomic():
            complaint.seller_response = reason
            
            if action_type == 'accept':
                # Seller đồng ý -> Hoàn tiền
                complaint.status = 'resolved_refund'
                complaint.order_item.status = 'REFUND_APPROVED'
                self._process_refund_wallet(complaint)
                
            elif action_type == 'reject':
                # Seller từ chối -> Chuyển sang trạng thái thương lượng
                complaint.status = 'negotiating'
                complaint.order_item.status = 'SELLER_REJECTED'
            
            else:
                 return Response({'error': 'Action không hợp lệ'}, status=400)

            complaint.save()
            complaint.order_item.save()
            self._check_and_unlock_order(complaint.order_item.order)

        return Response({'message': 'Đã phản hồi', 'status': complaint.status})

    # ==========================================
    # 3. BUYER: KHIẾU NẠI LÊN SÀN (ESCALATE)
    # ==========================================
    @action(detail=True, methods=['post'], url_path='escalate')
    def escalate(self, request, pk=None):
        complaint = self.get_object()
        
        if complaint.user != request.user:
            return Response({'error': 'Không có quyền'}, status=403)
            
        if complaint.status != 'negotiating':
            return Response({'error': 'Chỉ được khiếu nại khi Seller đã từ chối'}, status=400)

        complaint.status = 'admin_review'
        complaint.order_item.status = 'DISPUTE_TO_ADMIN'
        complaint.save()
        complaint.order_item.save()
            
        return Response({'message': 'Đã gửi yêu cầu lên Admin'})

    # ==========================================
    # 4. ADMIN: PHÁN QUYẾT
    # ==========================================
    @action(detail=True, methods=['post'], url_path='admin-resolve')
    def admin_resolve(self, request, pk=None):
        if not getattr(request.user, 'is_admin', False): # Hoặc check is_staff
            return Response({'error': 'Chỉ Admin mới có quyền'}, status=403)

        complaint = self.get_object()
        decision = request.data.get('decision') # 'refund_buyer' hoặc 'release_seller'
        note = request.data.get('note', '')

        with transaction.atomic():
            complaint.admin_notes = note
            
            if decision == 'refund_buyer':
                complaint.status = 'resolved_refund'
                complaint.order_item.status = 'REFUND_APPROVED'
                self._process_refund_wallet(complaint)
                
            elif decision == 'release_seller':
                complaint.status = 'resolved_reject'
                complaint.order_item.status = 'REFUND_REJECTED'
                # Tiền sẽ về seller khi hoàn tất đơn
            else:
                return Response({'error': 'Decision không hợp lệ'}, status=400)

            complaint.save()
            complaint.order_item.save()
            self._check_and_unlock_order(complaint.order_item.order)

        return Response({'message': 'Admin đã xử lý', 'result': decision})

    # --- HELPERS ---
    def _process_refund_wallet(self, complaint):
        # Tính tiền dựa trên giá lúc mua * số lượng
        amount = complaint.order_item.price * complaint.order_item.quantity
        amount = amount.quantize(Decimal('1'))
        
        if amount > 0:
            wallet, _ = Wallet.objects.get_or_create(user=complaint.user)
            wallet.balance = (wallet.balance or Decimal('0')) + amount
            wallet.save()

    def _check_and_unlock_order(self, order):
        # Nếu không còn complaint nào dang dở -> Mở khóa đơn
        active = Complaint.objects.filter(
            order_item__order=order
        ).exclude(status__in=['resolved_refund', 'resolved_reject', 'cancelled']).exists()
        
        if not active:
            order.is_disputed = False
            order.save(update_fields=['is_disputed'])