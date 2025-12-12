"""
Utility functions for users app views
"""
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode


def get_client_ip(request):
    """
    Lấy IP thực của client từ request
    Hỗ trợ proxy (HTTP_X_FORWARDED_FOR)
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def send_verification_email(user, request, email_field='email'):
    """
    Gửi email xác thực cho user
    
    Args:
        user: User object
        request: HTTP request object
        email_field: trường email ('email' hoặc 'pending_email')
    """
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    
    verification_url = f"http://localhost:8000/api/users/verify-email/{uid}/{token}/"
    
    subject = "Xác thực tài khoản của bạn"
    message = (
        f"Xin chào {user.username},\n\n"
        f"Vui lòng nhấn vào liên kết dưới đây để xác thực tài khoản:\n{verification_url}\n\n"
        "Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này."
    )
    
    recipient_email = getattr(user, email_field, user.email)
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [recipient_email],
        fail_silently=False,
    )


def send_email_change_verification(user, new_email):
    """
    Gửi email xác thực thay đổi email
    """
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    
    verify_link = f"http://localhost:8000/api/users/confirm-email-change/{uid}/{token}/"
    
    send_mail(
        subject="Xác nhận thay đổi email",
        message=f"Nhấn vào liên kết để xác nhận: {verify_link}",
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
        recipient_list=[new_email],
        fail_silently=True,
    )


def send_phone_otp_email(user, otp):
    """
    Gửi OTP xác nhận thay đổi số điện thoại qua email
    """
    if not user.email:
        return False
    
    send_mail(
        subject="Mã OTP xác nhận thay đổi số điện thoại",
        message=f"Mã OTP của bạn là: {otp} (hết hạn sau 10 phút)",
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
        recipient_list=[user.email],
        fail_silently=True,
    )
    return True


def create_wallet_transaction(user, amount, transaction_type, description=None, reference_id=None):
    """
    Tạo giao dịch ví và cập nhật số dư user
    
    Args:
        user: CustomUser instance
        amount: Số tiền (decimal)
        transaction_type: Loại giao dịch ('deposit', 'withdraw', 'payment', 'refund', 'adjustment')
        description: Mô tả giao dịch
        reference_id: ID tham chiếu (đơn hàng, hoàn tiền, v.v.)
    
    Returns:
        Tuple (transaction, success): Transaction object và boolean thành công/thất bại
    """
    from users.models import UserWalletTransaction
    from decimal import Decimal
    
    balance_before = user.wallet_balance
    
    if transaction_type in ['deposit', 'refund']:
        new_balance = balance_before + Decimal(str(amount))
    elif transaction_type in ['withdraw', 'payment']:
        if balance_before < Decimal(str(amount)):
            return None, False
        new_balance = balance_before - Decimal(str(amount))
    elif transaction_type == 'adjustment':
        new_balance = balance_before + Decimal(str(amount))
    else:
        return None, False
    
    try:
        transaction = UserWalletTransaction.objects.create(
            user=user,
            amount=amount,
            transaction_type=transaction_type,
            description=description,
            reference_id=reference_id,
            balance_before=balance_before,
            balance_after=new_balance,
        )
        
        user.wallet_balance = new_balance
        user.save(update_fields=['wallet_balance'])
        
        return transaction, True
    except Exception as e:
        return None, False


def get_wallet_balance(user):
    """
    Lấy số dư ví hiện tại của user
    
    Args:
        user: CustomUser instance
    
    Returns:
        Decimal: Số dư ví
    """
    return user.wallet_balance
