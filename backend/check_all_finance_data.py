"""
Script để kiểm tra toàn bộ dữ liệu finance
"""
import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from payments.models import Payment
from payments.models_withdraw import WithdrawRequest
from orders.models import Order
from django.utils import timezone

def check_all_finance_data():
    """Kiểm tra toàn bộ dữ liệu finance"""
    
    print("=" * 60)
    print("KIỂM TRA DỮ LIỆU FINANCE")
    print("=" * 60)
    
    # 1. Payments
    print("\n📊 PAYMENTS:")
    all_payments = Payment.objects.all()
    success_payments = Payment.objects.filter(status__in=["SUCCESS", "Đã thanh toán"])
    pending_payments = Payment.objects.filter(status="PENDING")
    
    print(f"   - Tổng số Payments: {all_payments.count()}")
    print(f"   - Payments SUCCESS: {success_payments.count()}")
    print(f"   - Payments PENDING: {pending_payments.count()}")
    
    total_revenue = sum(float(p.amount) for p in success_payments)
    pending_amount = sum(float(p.amount) for p in pending_payments)
    
    print(f"   - Tổng doanh thu (SUCCESS): {total_revenue:,.0f} VNĐ")
    print(f"   - Số dư đang chờ (PENDING): {pending_amount:,.0f} VNĐ")
    
    # Payments trong tháng này
    current_month = timezone.now().month
    current_year = timezone.now().year
    monthly_payments = success_payments.filter(
        created_at__month=current_month,
        created_at__year=current_year
    )
    monthly_revenue = sum(float(p.amount) for p in monthly_payments)
    
    print(f"   - Payments SUCCESS trong tháng này: {monthly_payments.count()}")
    print(f"   - Doanh thu tháng này: {monthly_revenue:,.0f} VNĐ")
    
    # 2. Withdraws
    print("\n💰 WITHDRAW REQUESTS:")
    all_withdraws = WithdrawRequest.objects.all()
    paid_withdraws = WithdrawRequest.objects.filter(status__in=["paid", "approved"])
    pending_withdraws = WithdrawRequest.objects.filter(status="pending")
    
    print(f"   - Tổng số WithdrawRequests: {all_withdraws.count()}")
    print(f"   - Withdraws PAID: {paid_withdraws.count()}")
    print(f"   - Withdraws PENDING: {pending_withdraws.count()}")
    
    total_withdrawn = sum(float(w.amount) for w in paid_withdraws)
    print(f"   - Tổng số tiền đã rút: {total_withdrawn:,.0f} VNĐ")
    
    # Withdraws trong tháng này
    monthly_withdraws = paid_withdraws.filter(
        created_at__month=current_month,
        created_at__year=current_year
    )
    monthly_withdrawn = sum(float(w.amount) for w in monthly_withdraws)
    
    print(f"   - Withdraws PAID trong tháng này: {monthly_withdraws.count()}")
    print(f"   - Số tiền đã rút tháng này: {monthly_withdrawn:,.0f} VNĐ")
    
    # 3. Số dư khả dụng
    print("\n💵 SỐ DƯ:")
    available_balance = total_revenue - total_withdrawn
    print(f"   - Số dư khả dụng: {available_balance:,.0f} VNĐ")
    print(f"   - Số dư đang chờ: {pending_amount:,.0f} VNĐ")
    
    print("\n" + "=" * 60)
    print("KẾT LUẬN:")
    print("=" * 60)
    print(f"✓ Số dư khả dụng: {available_balance:,.0f} ₫")
    print(f"✓ Số dư đang chờ xử lý: {pending_amount:,.0f} ₫")
    print(f"✓ Tổng doanh thu (tháng này): {monthly_revenue:,.0f} ₫")
    print(f"✓ Số tiền đã rút (tháng này): {monthly_withdrawn:,.0f} ₫")
    print("=" * 60)

if __name__ == "__main__":
    check_all_finance_data()