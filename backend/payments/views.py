from django.utils import timezone
from django.db import models
from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Payment
from products.models import Product
from orders.models import OrderItem
from sellers.models import Seller
from .models_withdraw import WithdrawRequest
from .serializers import WithdrawRequestSerializer
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.http import JsonResponse
import hashlib
from .serializers import PaymentSerializer
import logging
from vnpay_python.vnpay import vnpay
from django.shortcuts import redirect
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny
from django.db import transaction
from orders.models import Order, OrderItem
from django.core.cache import cache
from .models import Payment, SellerWallet, WalletTransaction  # ← Thêm 2 models
from .models_withdraw import WithdrawRequest
from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from products.models import Product
from decimal import Decimal


logger = logging.getLogger(__name__)


def seed_finance_demo_data(request):
    """API tạm thời để seed dữ liệu demo cho seller hiện tại"""
    user = request.user
    from sellers.models import Seller
    from products.models import Product
    from orders.models import Order, OrderItem
    from .models import Payment
    from .models_withdraw import WithdrawRequest
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)
    # Tạo 1 sản phẩm nếu chưa có
    product, _ = Product.objects.get_or_create(seller=seller, name="Demo Product", defaults={"price": 100000, "stock": 10})
    # Tạo 2 order và payment
    for i, (date, amount, status) in enumerate([
        (timezone.now(), 500000, "SUCCESS"),
        (timezone.now() - timezone.timedelta(days=1), 300000, "PENDING")]):
        order, _ = Order.objects.get_or_create(user=user, total_price=amount, status=status, defaults={"customer_name": "Demo", "address": "Test"})
        OrderItem.objects.get_or_create(order=order, product=product, quantity=1, price=amount)
        Payment.objects.get_or_create(order=order, defaults={"amount": amount, "status": status, "created_at": date})
    # Tạo 1 withdraw
    WithdrawRequest.objects.get_or_create(seller=seller, amount=500000, status="paid", defaults={"created_at": timezone.now()})
    return Response({"message": "Demo data seeded!"})



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def withdraw_request(request):
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)
    amount = request.data.get("amount")
    if not amount or float(amount) <= 0:
        return Response({"error": "Số tiền không hợp lệ"}, status=400)
    # Kiểm tra số dư
    product_ids = Product.objects.filter(seller=seller).values_list("id", flat=True)
    order_ids = OrderItem.objects.filter(product_id__in=product_ids).values_list("order_id", flat=True).distinct()
    payments = Payment.objects.filter(order_id__in=order_ids, status="success")
    total_revenue = payments.aggregate(total=Sum("amount"))['total'] or 0
    total_withdrawn = WithdrawRequest.objects.filter(seller=seller, status__in=["paid", "approved"]).aggregate(total=Sum("amount"))['total'] or 0
    balance = float(total_revenue) - float(total_withdrawn)
    if float(amount) > balance:
        return Response({"error": "Số dư không đủ"}, status=400)
    # Lưu yêu cầu rút tiền
    withdraw = WithdrawRequest.objects.create(seller=seller, amount=amount, status="pending")
    return Response({"message": "Yêu cầu rút tiền đã được gửi!", "id": withdraw.id})
# API: Số dư khả dụng cho seller
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def wallet_balance(request):
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
        wallet = SellerWallet.objects.get(seller=seller)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)
    except SellerWallet.DoesNotExist:
        return Response({"error": "Wallet not found"}, status=404)
    
    return Response({
        "balance": float(wallet.balance),
        "pending_balance": float(wallet.pending_balance)
    })
# API: Doanh thu theo ngày/tháng cho seller (dùng cho biểu đồ)
from django.db.models.functions import TruncDay, TruncMonth
from django.db.models import Sum

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def revenue_chart(request):
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)
    product_ids = Product.objects.filter(seller=seller).values_list("id", flat=True)
    order_ids = OrderItem.objects.filter(product_id__in=product_ids).values_list("order_id", flat=True).distinct()
    payments = Payment.objects.filter(order_id__in=order_ids, status="success")

    # Doanh thu theo ngày (7 ngày gần nhất)
    daily = payments.annotate(day=TruncDay("created_at")).values("day").annotate(amount=Sum("amount")).order_by("day")
    daily_data = [{"date": d["day"].strftime("%Y-%m-%d"), "amount": float(d["amount"] or 0), "type": "Ngày"} for d in daily]

    # Doanh thu theo tháng (6 tháng gần nhất)
    monthly = payments.annotate(month=TruncMonth("created_at")).values("month").annotate(amount=Sum("amount")).order_by("month")
    monthly_data = [{"date": m["month"].strftime("%Y-%m"), "amount": float(m["amount"] or 0), "type": "Tháng"} for m in monthly]

    return Response({"data": daily_data + monthly_data})
from .models_withdraw import WithdrawRequest
from .serializers import WithdrawRequestSerializer
# API: Lịch sử rút tiền của seller
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def withdraw_history(request):
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)
    withdraws = WithdrawRequest.objects.filter(seller=seller).order_by("-created_at")
    data = WithdrawRequestSerializer(withdraws, many=True).data
    return Response({"data": data})



# API: Lấy danh sách payment và tổng doanh thu cho seller
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def seller_finance(request):
    """
    Trả về danh sách payment và tổng doanh thu cho seller hiện tại
    """
    user = request.user
    try:
        seller = Seller.objects.get(user=user)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)

    # Lấy tất cả sản phẩm của seller
    product_ids = Product.objects.filter(seller=seller).values_list("id", flat=True)
    # Lấy tất cả order item có product thuộc seller
    order_ids = OrderItem.objects.filter(product_id__in=product_ids).values_list("order_id", flat=True).distinct()
    # Lấy TẤT CẢ payment liên quan các order này (cả success và pending)
    payments = Payment.objects.filter(order_id__in=order_ids)

    # Tổng doanh thu (chỉ tính success)
    total_revenue = payments.filter(status="success").aggregate(total=models.Sum("amount"))['total'] or 0

    # Serialize danh sách payment
    payment_data = PaymentSerializer(payments, many=True).data
    
    # Lấy lịch sử rút tiền của seller
    withdraws = WithdrawRequest.objects.filter(seller=seller).order_by("-created_at")
    withdraw_data = WithdrawRequestSerializer(withdraws, many=True).data

    return Response({
        "payments": payment_data,
        "total_revenue": total_revenue,
        "withdraws": withdraw_data
    })




@api_view(["POST"])  # dùng DRF để JWT auth set request.user
@permission_classes([AllowAny])
@csrf_exempt
def create_payment(request):
    try:
        order_id = timezone.now().strftime("%Y%m%d%H%M%S")

        # Nhận dữ liệu từ FE (DRF Request)
        amount = int(request.data.get("amount") or 0)
        order_data = request.data.get("order_data") or {}

        if amount <= 0:
            amount = 100000  # mặc định nếu không hợp lệ

        # Lưu order_data vào session để dùng ở vnpay_return
        # Lưu vào cache theo txn_ref để không phụ thuộc session cookie
        if order_data is not None:
            # Gắn thêm thông tin user và session để dùng sau khi trả về
            if getattr(request, 'user', None) and request.user.is_authenticated:
                try:
                    order_data["user_id"] = request.user.id
                except Exception:
                    pass
            # Lưu session_key cho khách vãng lai
            try:
                # Đảm bảo có sessionid (dùng cho guest cart)
                if not request.session.session_key:
                    request.session.create()
                order_data["session_key"] = request.session.session_key
            except Exception:
                pass

            cache_key = f"vnp_order:{order_id}"
            cache.set(cache_key, order_data, timeout=60*30)  # 30 phút

        vnp = vnpay()
        vnp.requestData = {
            'vnp_Version': '2.1.0',
            'vnp_Command': 'pay',
            'vnp_TmnCode': settings.VNPAY_CONFIG["TMN_CODE"],
            'vnp_Amount': amount * 100,  # ⚠️ VNPAY yêu cầu nhân 100
            'vnp_CurrCode': 'VND',
            'vnp_TxnRef': order_id,
            'vnp_OrderInfo': f"Thanh toan don hang {order_id}",
            'vnp_OrderType': 'other',
            'vnp_Locale': 'vn',
            'vnp_ReturnUrl': settings.VNPAY_CONFIG["RETURN_URL"],
            'vnp_IpAddr': request.META.get('REMOTE_ADDR', '127.0.0.1'),
            'vnp_CreateDate': timezone.now().strftime("%Y%m%d%H%M%S"),  # chuẩn format
        }

        payment_url = vnp.get_payment_url(
            settings.VNPAY_CONFIG["VNPAY_URL"],
            settings.VNPAY_CONFIG["HASH_SECRET_KEY"]   # đúng tên key
        )

        logger.info(f"VNPAY Payment URL: {payment_url}")
        print(f"[DEBUG] Payment URL gửi sang VNPAY: {payment_url}")
        print(f"[DEBUG] VNPAY Return URL: {settings.VNPAY_CONFIG['RETURN_URL']}")
        print(f"[DEBUG] Order data cached: {order_data}")

        return JsonResponse({"payment_url": payment_url})
    except Exception as e:
        logger.error(f"Error in create_payment: {e}", exc_info=True)
        return JsonResponse({"error": str(e)}, status=500)


def vnpay_return(request):
    """DEPRECATED: VNPAY return handler - redirect to frontend"""
    # VNPAY sẽ redirect về frontend, không xử lý ở đây nữa
    return redirect("http://localhost:3000/vnpay-return")
    

def verify_vnpay_signature(request_data):
    """Hàm verify chữ ký VNPAY"""
    vnp_secure_hash = request_data.get("vnp_SecureHash")
    if not vnp_secure_hash:
        return False

    input_data = {k: v for k, v in request_data.items() if k.startswith("vnp_") and k != "vnp_SecureHash"}
    sorted_data = sorted(input_data.items())
    query = "&".join(f"{k}={v}" for k, v in sorted_data)
    hash_value = hashlib.sha256((settings.VNP_HASH_SECRET + query).encode("utf-8")).hexdigest().upper()
    return hash_value == vnp_secure_hash


@api_view(["POST"])
@csrf_exempt
def vnpay_return_api(request):
    """API endpoint cho frontend gọi để xử lý VNPAY return"""
    try:
        # Lấy params từ request body (frontend gửi lên)
        vnp_params = request.data if hasattr(request, 'data') else request.GET.dict()
        
        logger.info(f"[VNPAY_RETURN_API] Received params: {list(vnp_params.keys())}")
        
        vnp = vnpay()
        vnp.responseData = vnp_params

        if vnp.validate_response(settings.VNPAY_CONFIG["HASH_SECRET_KEY"]):
            response_code = vnp_params.get('vnp_ResponseCode')
            if response_code == '00':
                try:
                    # Lấy dữ liệu giỏ hàng từ cache theo TxnRef
                    txn_ref = vnp_params.get('vnp_TxnRef')
                    cache_key = f"vnp_order:{txn_ref}"
                    # Idempotency lock: tránh xử lý trùng cho cùng txn_ref
                    lock_key = f"vnp_lock:{txn_ref}"
                    got_lock = cache.add(lock_key, True, timeout=60)  # chỉ một process giữ lock trong 60s
                    if not got_lock:
                        logger.warning(f"[VNPAY_RETURN_API] Duplicate call detected for txn_ref={txn_ref}; skipping")
                        existing_payment = Payment.objects.filter(vnp_transaction_no=vnp_params.get("vnp_TransactionNo")).first()
                        if existing_payment:
                            return JsonResponse({"success": True, "order_id": existing_payment.order.id, "message": "Duplicate ignored"})
                        return JsonResponse({"success": True, "message": "Duplicate ignored"})
                    order_data = cache.get(cache_key) or {}
                    logger.info(f"[VNPAY_RETURN_API] txn_ref={txn_ref}, order_data_keys={list(order_data.keys()) if isinstance(order_data, dict) else type(order_data)}")
                    
                    # Kiểm tra xem đã tạo đơn cho txn_ref này chưa
                    existing_payment = Payment.objects.filter(vnp_transaction_no=vnp_params.get("vnp_TransactionNo")).first()
                    if existing_payment:
                        logger.warning(f"[VNPAY_RETURN_API] Order already exists for transaction {vnp_params.get('vnp_TransactionNo')}")
                        return JsonResponse({"success": True, "order_id": existing_payment.order.id, "message": "Order already exists"})
                    
                    items = order_data.get("items", [])
                    user_instance = None
                    UserModel = get_user_model()
                    user_id = order_data.get("user_id")
                    if user_id:
                        try:
                            user_instance = UserModel.objects.get(pk=user_id)
                        except UserModel.DoesNotExist:
                            user_instance = None

                    if not user_instance and (not getattr(request, "user", None) or not request.user.is_authenticated):
                        logger.error("[VNPAY_RETURN_API] Missing user for order creation. order_data has no user_id and request.user is anonymous.")
                        return JsonResponse({"success": False, "error": "Missing user"})

                    # Tạo Order ở trạng thái pending (chờ xác nhận)
                    order = Order.objects.create(
                        user=user_instance or (request.user if getattr(request, "user", None) and request.user.is_authenticated else None),
                        total_price=order_data.get("total_price") or (sum((float(i.get('price', 0)) * int(i.get('quantity', 0))) for i in items)),
                        status="pending",
                        customer_name=order_data.get("customer_name", ""),
                        customer_phone=order_data.get("customer_phone", ""),
                        address=order_data.get("address", ""),
                        note=order_data.get("note", ""),
                        payment_method="vnpay",
                    )

                    # Tạo các OrderItem theo giỏ hàng
                    for it in items:
                        try:
                            OrderItem.objects.create(
                                order=order,
                                product_id=it.get("product"),
                                quantity=int(it.get("quantity", 1)),
                                price=float(it.get("price", 0)),
                            )
                        except Exception:
                            # Nếu có item lỗi, bỏ qua item đó
                            pass

                    # Lưu payment record
                    Payment.objects.create(
                        order=order,
                        amount=float(vnp_params.get("vnp_Amount", 0)) / 100,
                        status="success",
                        vnp_response_code=response_code,
                        vnp_transaction_no=vnp_params.get("vnp_TransactionNo"),
                        order_data=order_data,
                    )

                    # Xóa giỏ hàng sau khi tạo đơn thành công (chỉ những sản phẩm đã chọn)
                    try:
                        session_key = order_data.get("session_key")
                        selected_product_ids = [item.get("product") for item in items if item.get("product")]
                        
                        if user_instance:
                            # Xóa cart items của user đã đăng nhập (chỉ những sản phẩm đã chọn)
                            from cart.models import Cart as CartModel, CartItem as CartItemModel
                            cart = CartModel.objects.filter(user=user_instance).first()
                            if cart and selected_product_ids:
                                deleted_count = CartItemModel.objects.filter(
                                    cart=cart, 
                                    product_id__in=selected_product_ids
                                ).delete()[0]
                                logger.info(f"[VNPAY_RETURN_API] Cleared {deleted_count} selected items for user {user_instance.id}")
                        elif session_key:
                            # Xóa cart items của guest theo session_key (chỉ những sản phẩm đã chọn)
                            from cart.models import Cart as CartModel, CartItem as CartItemModel
                            cart = CartModel.objects.filter(session_key=session_key, user=None).first()
                            if cart and selected_product_ids:
                                deleted_count = CartItemModel.objects.filter(
                                    cart=cart, 
                                    product_id__in=selected_product_ids
                                ).delete()[0]
                                logger.info(f"[VNPAY_RETURN_API] Cleared {deleted_count} selected items for session {session_key}")
                    except Exception as e:
                        logger.exception(f"[VNPAY_RETURN_API] Error while clearing selected cart items: {e}")
                        # Không chặn luồng nếu xóa giỏ hàng lỗi
                        pass

                    # Xóa cache để tránh tạo lại
                    try:
                        cache.delete(cache_key)
                    except Exception:
                        pass

                    return JsonResponse({"success": True, "order_id": order.id})
                except Exception as e:
                    logger.exception(f"[VNPAY_RETURN_API] Error creating order: {e}")
                    return JsonResponse({"success": False, "error": str(e)})
            else:
                return JsonResponse({"success": False, "error": "Payment failed"})
        else:
            return JsonResponse({"success": False, "error": "Invalid signature"})
    except Exception as e:
        logger.exception(f"[VNPAY_RETURN_API] Unexpected error: {e}")
        return JsonResponse({"success": False, "error": str(e)})
    finally:
        # Release lock if held
        try:
            txn_ref = None
            if 'vnp_TxnRef' in request.data:
                txn_ref = request.data.get('vnp_TxnRef')
            elif request.GET.get('vnp_TxnRef'):
                txn_ref = request.GET.get('vnp_TxnRef')
            if txn_ref:
                cache.delete(f"vnp_lock:{txn_ref}")
        except Exception:
            pass


@api_view(["GET"])
@csrf_exempt
def vnpay_callback(request):
    vnp = vnpay()
    inputData = request.GET.dict()
    vnp.responseData = inputData

    if vnp.validate_response(settings.VNPAY_CONFIG["HASH_SECRET_KEY"]):
        txn_ref = inputData.get("vnp_TxnRef")
        response_code = inputData.get("vnp_ResponseCode")
        amount = int(inputData.get("vnp_Amount", 0)) / 100
        trans_no = inputData.get("vnp_TransactionNo")

        # 🔹 Lấy giỏ hàng từ session hoặc từ Payment.order_data (bạn gửi lên create_payment)
        order_data = request.session.get("order_data")  

        if response_code == "00":
            # Tạo Order trong DB
            order = Order.objects.create(
                user=request.user if request.user.is_authenticated else None,
                total_price=amount,
                status="success",
                customer_name=order_data.get("customer_name"),
                customer_phone=order_data.get("customer_phone"),
                address=order_data.get("address"),
                note=order_data.get("note", ""),
                payment_method="vnpay",
            )

            # Tạo Payment record
            Payment.objects.create(
                order=order,
                amount=amount,
                status="success",
                vnp_response_code=response_code,
                vnp_transaction_no=trans_no,
                order_data=order_data
            )

            return JsonResponse({"RspCode": "00", "Message": "Confirm Success"})
        else:
            return JsonResponse({"RspCode": "01", "Message": "Payment Failed"})
    else:
        return JsonResponse({"RspCode": "97", "Message": "Invalid signature"})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_wallets(request):
    """Get all seller wallets for admin"""
    if not request.user.is_staff:
        return Response({"error": "Permission denied"}, status=403)

    # ✅ Select related đến seller.user để tránh N+1 query
    wallets = SellerWallet.objects.select_related('seller__user').all()
    
    data = []
    for wallet in wallets:
        data.append({
            "seller_id": wallet.seller.user.id,
            "store_name": wallet.seller.store_name,
            "email": wallet.seller.user.email,
            "balance": float(wallet.balance),
            "pending_balance": float(wallet.pending_balance),
            "updated_at": wallet.updated_at.isoformat() if wallet.updated_at else None,
        })
    return Response(data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_pending_balance(request, seller_id):
    """Approve pending balance for a seller"""
    if not request.user.is_staff:
        return Response({"error": "Permission denied"}, status=403)

    try:
        from sellers.models import Seller
        seller = Seller.objects.get(user_id=seller_id)
        wallet = SellerWallet.objects.get(seller=seller)

        if wallet.pending_balance > 0:
            # Move pending to balance
            wallet.balance += wallet.pending_balance
            wallet.pending_balance = 0
            wallet.last_pending_approved_at = timezone.now()
            wallet.save()

            # Update transactions from pending_add to add
            WalletTransaction.objects.filter(
                wallet=wallet,
                type='pending_add'
            ).update(type='add', note="Đã duyệt số dư chờ")

            return Response({"message": "Approved pending balance"})
        else:
            return Response({"error": "No pending balance to approve"}, status=400)
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)
    except SellerWallet.DoesNotExist:
        return Response({"error": "Wallet not found"}, status=404)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_wallet_transactions(request, seller_id):
    """Get transactions for a seller wallet"""
    if not request.user.is_staff:
        return Response({"error": "Permission denied"}, status=403)

    try:
        from sellers.models import Seller
        seller = Seller.objects.get(user_id=seller_id)
        wallet = SellerWallet.objects.get(seller=seller)

        transactions = WalletTransaction.objects.filter(wallet=wallet).order_by('-created_at')
        data = []
        for tx in transactions:
            data.append({
                "id": tx.id,
                "amount": float(tx.amount),
                "type": tx.type,
                "note": tx.note,
                "created_at": tx.created_at.isoformat(),
            })
        return Response({"transactions": data})
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)
    except SellerWallet.DoesNotExist:
        return Response({"error": "Wallet not found"}, status=404)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def recalculate_pending_balance(request, seller_id):
    """Recalculate pending_balance từ orders thực tế"""
    if not request.user.is_staff:
        return Response({"error": "Permission denied"}, status=403)

    try:
        from sellers.models import Seller
        from decimal import Decimal
        
        seller = Seller.objects.get(user_id=seller_id)
        wallet = SellerWallet.objects.get(seller=seller)

        order_ids = (
            OrderItem.objects.filter(product__seller=seller)
            .values_list("order_id", flat=True)
            .distinct()
        )
        
        # Chỉ tính orders success sau lần duyệt cuối cùng
        success_orders_query = Order.objects.filter(
            id__in=order_ids,
            status="success"
        )
        
        if wallet.last_pending_approved_at:
            success_orders_query = success_orders_query.filter(updated_at__gt=wallet.last_pending_approved_at)
        
        success_orders = success_orders_query.prefetch_related('items', 'items__product')

        total_earned = Decimal('0')
        
        for order in success_orders:
            order_total = Decimal(str(order.total_price or 0))
            shipping_fee = Decimal(str(order.shipping_fee or 0))
            
            seller_item_total = Decimal('0')
            commission = Decimal('0')
            
            for item in order.items.all():
                if item.product and item.product.seller_id == seller.id:
                    item_total = Decimal(str(item.price or 0)) * item.quantity
                    seller_item_total += item_total
                    
                    commission_rate = (
                        Decimal(str(item.product.category.commission_rate)) 
                        if item.product.category else Decimal('0')
                    )
                    commission += item_total * commission_rate
            
            if order_total > 0 and seller_item_total > 0:
                shipping_fee_seller = (seller_item_total / order_total) * shipping_fee
            else:
                shipping_fee_seller = Decimal('0')
            
            seller_share = seller_item_total - shipping_fee_seller - commission
            total_earned += seller_share

        withdrawn = (
            WithdrawRequest.objects.filter(
                seller=seller,
                status__in=["paid", "approved"]
            ).aggregate(total=Sum("amount"))["total"] or 0
        )

        pending_balance = float(total_earned) - float(withdrawn)
        
        wallet.pending_balance = max(pending_balance, 0)
        wallet.save()

        return Response({
            "message": "Recalculated pending balance",
            "total_earned": float(total_earned),
            "total_withdrawn": float(withdrawn),
            "new_pending_balance": float(wallet.pending_balance),
        })
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)
    except SellerWallet.DoesNotExist:
        return Response({"error": "Wallet not found"}, status=404)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_withdraw_requests(request):
    """Get all pending withdraw requests for admin"""
    if not request.user.is_staff:
        return Response({"error": "Permission denied"}, status=403)

    status_filter = request.GET.get('status', 'pending')
    
    query = WithdrawRequest.objects.select_related('seller', 'seller__user').order_by('-created_at')
    
    if status_filter and status_filter != 'all':
        query = query.filter(status=status_filter)
    
    data = []
    for wr in query:
        data.append({
            "id": wr.id,
            "seller_id": wr.seller.user.id,
            "store_name": wr.seller.store_name,
            "seller_email": wr.seller.user.email,
            "amount": float(wr.amount),
            "status": wr.status,
            "note": wr.note,
            "created_at": wr.created_at.isoformat(),
            "processed_at": wr.processed_at.isoformat() if wr.processed_at else None,
        })
    
    return Response({"results": data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_withdraw_request(request, withdraw_id):
    """Approve a withdrawal request and deduct from seller's balance"""
    if not request.user.is_staff:
        return Response({"error": "Permission denied"}, status=403)

    try:
        from decimal import Decimal
        from django.db import transaction
        
        withdraw = WithdrawRequest.objects.get(id=withdraw_id)
        
        if withdraw.status != "pending":
            return Response({"error": "Only pending requests can be approved"}, status=400)
        
        seller = withdraw.seller
        amount = Decimal(str(withdraw.amount))
        
        with transaction.atomic():
            wallet = SellerWallet.objects.select_for_update().get(seller=seller)
            
            if wallet.balance < amount:
                return Response({
                    "error": f"Insufficient balance. Required: {amount}, Available: {wallet.balance}"
                }, status=400)
            
            if wallet.balance < 0:
                return Response({
                    "error": "Wallet balance is negative. Cannot process withdrawal."
                }, status=400)
            
            wallet.balance -= amount
            wallet.save()
            
            withdraw.status = "paid"
            withdraw.processed_at = timezone.now()
            withdraw.save()
            
            WalletTransaction.objects.create(
                wallet=wallet,
                amount=amount,
                type="withdraw",
                note=f"Approved withdrawal request #{withdraw.id}"
            )
        
        return Response({
            "message": "Withdrawal approved successfully",
            "new_balance": float(wallet.balance)
        })
    
    except WithdrawRequest.DoesNotExist:
        return Response({"error": "Withdrawal request not found"}, status=404)
    except SellerWallet.DoesNotExist:
        return Response({"error": "Seller wallet not found"}, status=404)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_withdraw_request(request, withdraw_id):
    """Reject a withdrawal request"""
    if not request.user.is_staff:
        return Response({"error": "Permission denied"}, status=403)

    try:
        withdraw = WithdrawRequest.objects.get(id=withdraw_id)
        
        if withdraw.status != "pending":
            return Response({"error": "Only pending requests can be rejected"}, status=400)
        
        note = request.data.get('note', 'Rejected by admin')
        
        withdraw.status = "rejected"
        withdraw.processed_at = timezone.now()
        withdraw.note = note
        withdraw.save()
        
        return Response({
            "message": "Withdrawal request rejected successfully"
        })
    
    except WithdrawRequest.DoesNotExist:
        return Response({"error": "Withdrawal request not found"}, status=404)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def wallet_balance_detail(request, seller_id):
    """Get detailed wallet balance info for admin debugging"""
    if not request.user.is_staff:
        return Response({"error": "Permission denied"}, status=403)
    
    try:
        from decimal import Decimal
        
        seller = Seller.objects.get(user_id=seller_id)
        wallet = SellerWallet.objects.get(seller=seller)
        
        order_ids = (
            OrderItem.objects.filter(product__seller=seller)
            .values_list("order_id", flat=True)
            .distinct()
        )
        
        success_orders = Order.objects.filter(
            id__in=order_ids,
            status="success"
        ).prefetch_related('items', 'items__product')
        
        total_earned = Decimal('0')
        orders_breakdown = []
        
        for order in success_orders:
            order_total = Decimal(str(order.total_price or 0))
            shipping_fee = Decimal(str(order.shipping_fee or 0))
            
            seller_item_total = Decimal('0')
            commission = Decimal('0')
            
            for item in order.items.all():
                if item.product and item.product.seller_id == seller.id:
                    item_total = Decimal(str(item.price or 0)) * item.quantity
                    seller_item_total += item_total
                    
                    commission_rate = (
                        Decimal(str(item.product.category.commission_rate)) 
                        if item.product.category else Decimal('0')
                    )
                    commission += item_total * commission_rate
            
            if order_total > 0 and seller_item_total > 0:
                shipping_fee_seller = (seller_item_total / order_total) * shipping_fee
            else:
                shipping_fee_seller = Decimal('0')
            
            seller_share = seller_item_total - shipping_fee_seller - commission
            total_earned += seller_share
            
            orders_breakdown.append({
                "order_id": order.id,
                "seller_item_total": float(seller_item_total),
                "shipping_fee_seller": float(shipping_fee_seller),
                "commission": float(commission),
                "seller_share": float(seller_share)
            })
        
        withdrawn_paid = (
            WithdrawRequest.objects.filter(
                seller=seller,
                status__in=["paid", "approved"]
            ).aggregate(total=Sum("amount"))["total"] or Decimal(0)
        )
        
        withdrawn_pending = (
            WithdrawRequest.objects.filter(
                seller=seller,
                status="pending"
            ).aggregate(total=Sum("amount"))["total"] or Decimal(0)
        )
        
        return Response({
            "seller_id": seller_id,
            "store_name": seller.store_name,
            "balance": float(wallet.balance),
            "pending_balance": float(wallet.pending_balance),
            "total_earned": float(total_earned),
            "withdrawn_paid": float(withdrawn_paid),
            "withdrawn_pending": float(withdrawn_pending),
            "calculated_pending_balance": float(max(total_earned - withdrawn_paid, Decimal(0))),
            "orders_count": len(orders_breakdown),
            "orders_breakdown": orders_breakdown
        })
    
    except Seller.DoesNotExist:
        return Response({"error": "Seller not found"}, status=404)
    except SellerWallet.DoesNotExist:
        return Response({"error": "Seller wallet not found"}, status=404)


def calculate_order_net_income(order, seller_id):
    """Tính tiền seller nhận được (Giá bán - Phí sàn - Hoa hồng...)"""
    order_total = Decimal(str(order.total_price or 0))
    shipping_fee = Decimal(str(order.shipping_fee or 0))
    
    seller_item_total = Decimal('0')
    commission = Decimal('0')
    
    for item in order.items.all():
        if item.product and item.product.seller_id == seller_id:
            item_total = Decimal(str(item.price or 0)) * item.quantity
            seller_item_total += item_total
            
            commission_rate = (
                Decimal(str(item.product.category.commission_rate)) 
                if item.product.category else Decimal('0')
            )
            commission += item_total * commission_rate
            
    if order_total > 0 and seller_item_total > 0:
        shipping_fee_seller = (seller_item_total / order_total) * shipping_fee
    else:
        shipping_fee_seller = Decimal('0')
        
    seller_share = seller_item_total - shipping_fee_seller - commission
    return max(seller_share, Decimal('0'))

# --- API 1: Lấy danh sách đơn hàng CHỜ DUYỆT TIỀN ---
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_pending_orders_for_wallet(request, seller_id):
    if not request.user.is_staff:
        return Response({"error": "Permission denied"}, status=403)

    try:
        from sellers.models import Seller
        seller = Seller.objects.get(user_id=seller_id)
        
        # 1. Lấy tất cả Order thành công của Seller
        product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
        order_ids = OrderItem.objects.filter(product_id__in=product_ids).values_list('order_id', flat=True).distinct()
        
        success_orders = Order.objects.filter(
            id__in=order_ids, 
            status="success"
        ).prefetch_related('items', 'items__product').order_by('-created_at')

        pending_orders_data = []
        
        # 2. Lọc ra những đơn chưa có trong WalletTransaction
        # Note: Cách này đơn giản, nếu system lớn nên thêm field is_paid vào Order
        for order in success_orders:
            # Check xem đã có giao dịch nào ghi chú là đơn này chưa
            is_processed = WalletTransaction.objects.filter(
                wallet__seller=seller,
                note__contains=f"Order #{order.id}"
            ).exists()
            
            if not is_processed:
                net_income = calculate_order_net_income(order, seller.id)
                if net_income > 0:
                    pending_orders_data.append({
                        "id": order.id,
                        "created_at": order.created_at,
                        "customer_name": order.customer_name,
                        "total_order_value": float(order.total_price),
                        "net_income": float(net_income),
                    })

        return Response({"pending_orders": pending_orders_data})

    except Exception as e:
        logger.error(f"Error: {e}")
        return Response({"error": str(e)}, status=500)

# --- API 2: DUYỆT TIỀN CHO TỪNG ĐƠN (QUAN TRỌNG NHẤT) ---
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_order_revenue(request, order_id):
    """Duyệt doanh thu: Cộng Balance, Trừ Pending Balance"""
    if not request.user.is_staff:
        return Response({"error": "Permission denied"}, status=403)

    try:
        with transaction.atomic():
            order = Order.objects.select_for_update().get(id=order_id)
            
            # Tìm seller của đơn hàng
            first_item = order.items.first()
            if not first_item or not first_item.product.seller:
                return Response({"error": "Cannot identify seller"}, status=400)
            
            seller = first_item.product.seller
            wallet = SellerWallet.objects.select_for_update().get(seller=seller)

            # Check trùng lặp
            if WalletTransaction.objects.filter(wallet=wallet, note__contains=f"Order #{order.id}").exists():
                return Response({"error": "Đơn hàng này đã được cộng tiền rồi"}, status=400)

            # Tính tiền
            amount = calculate_order_net_income(order, seller.id)
            
            # ✅ UPDATE LOGIC VÍ (FIX LỖI CỦA BẠN TẠI ĐÂY)
            wallet.balance += amount
            wallet.pending_balance = max(wallet.pending_balance - amount, Decimal('0')) # Trừ pending
            wallet.save()

            # Tạo lịch sử
            WalletTransaction.objects.create(
                wallet=wallet,
                amount=amount,
                type="add", 
                note=f"Doanh thu từ đơn hàng Order #{order.id}"
            )

            return Response({
                "message": "Approved success",
                "new_balance": float(wallet.balance),
                "new_pending": float(wallet.pending_balance)
            })

    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)
    except Exception as e:
        logger.error(f"Approve error: {e}")
        return Response({"error": str(e)}, status=500)