from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from decimal import Decimal

token_generator = PasswordResetTokenGenerator()

def generate_reset_link(user):
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = token_generator.make_token(user)
    return uidb64, token


def calculate_user_tier(total_spent):
    """
    Calculate user tier based on total spending
    Returns: tuple of (tier_code, tier_name, tier_color)
    """
    total_spent = Decimal(str(total_spent or 0))
    
    if total_spent >= Decimal('10000000'):
        return ('diamond', 'Kim cương', 'gold')
    elif total_spent >= Decimal('6000000'):
        return ('gold', 'Vàng', 'cyan')
    elif total_spent >= Decimal('2000000'):
        return ('silver', 'Bạc', 'silver')
    else:
        return ('member', 'Thành viên', 'default')


def update_user_tier(user):
    """
    Update user tier and total_spent based on their completed orders
    """
    from django.db.models import Sum
    from orders.models import Order
    
    total = Order.objects.filter(
        user=user,
        status__in=['completed', 'delivered']
    ).aggregate(total=Sum('total_price'))['total'] or 0
    
    tier_code, _, _ = calculate_user_tier(total)
    user.total_spent = total
    user.tier = tier_code
    user.save(update_fields=['total_spent', 'tier'])
    
    return user
