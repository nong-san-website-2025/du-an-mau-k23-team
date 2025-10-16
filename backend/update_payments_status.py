"""
Script để cập nhật status của Payments thành SUCCESS để có dữ liệu hiển thị
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from payments.models import Payment
from orders.models import Order

def update_payments_status():
    """Cập nhật 80% payments thành SUCCESS"""
    all_payments = Payment.objects.all()
    total = all_payments.count()
    
    # Cập nhật 80% đầu tiên thành SUCCESS
    success_count = int(total * 0.8)
    
    payments_to_update = all_payments[:success_count]
    
    updated = 0
    for payment in payments_to_update:
        payment.status = "SUCCESS"
        payment.save()
        
        # Cập nhật order status tương ứng
        if payment.order:
            payment.order.status = "Đã thanh toán"
            payment.order.save()
        
        updated += 1
        print(f"✓ Cập nhật Payment #{payment.id} - Order #{payment.order_id} thành SUCCESS")
    
    print(f"\n✅ Đã cập nhật {updated}/{total} Payments thành SUCCESS!")
    
    # Hiển thị thống kê
    success_payments = Payment.objects.filter(status__in=["SUCCESS", "Đã thanh toán"]).count()
    pending_payments = Payment.objects.filter(status="PENDING").count()
    
    print(f"\n📊 Thống kê sau khi cập nhật:")
    print(f"   - Tổng số Payments: {Payment.objects.count()}")
    print(f"   - Payments thành công: {success_payments}")
    print(f"   - Payments đang chờ: {pending_payments}")
    
    # Tính tổng doanh thu
    total_revenue = sum(p.amount for p in Payment.objects.filter(status__in=["SUCCESS", "Đã thanh toán"]))
    print(f"   - Tổng doanh thu: {total_revenue:,.0f} VNĐ")

if __name__ == "__main__":
    update_payments_status()