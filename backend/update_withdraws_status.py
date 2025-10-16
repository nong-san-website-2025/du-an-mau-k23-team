"""
Script để cập nhật status của WithdrawRequests thành paid
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from payments.models_withdraw import WithdrawRequest

def update_withdraws_status():
    """Cập nhật 2 withdraw đầu tiên thành paid"""
    withdraws = WithdrawRequest.objects.all().order_by('created_at')
    
    if withdraws.count() == 0:
        print("Không có withdraw request nào để cập nhật")
        return
    
    # Cập nhật 2 withdraw đầu tiên thành paid
    updated = 0
    for withdraw in withdraws[:2]:
        withdraw.status = "paid"
        withdraw.save()
        updated += 1
        print(f"✓ Cập nhật WithdrawRequest #{withdraw.id} - {withdraw.amount:,.0f} VNĐ thành PAID")
    
    print(f"\n✅ Đã cập nhật {updated} WithdrawRequests thành PAID!")
    
    # Hiển thị thống kê
    paid_withdraws = WithdrawRequest.objects.filter(status="paid").count()
    pending_withdraws = WithdrawRequest.objects.filter(status="pending").count()
    
    print(f"\n📊 Thống kê sau khi cập nhật:")
    print(f"   - Tổng số WithdrawRequests: {WithdrawRequest.objects.count()}")
    print(f"   - Withdraws đã paid: {paid_withdraws}")
    print(f"   - Withdraws đang pending: {pending_withdraws}")
    
    # Tính tổng số tiền đã rút
    total_withdrawn = sum(w.amount for w in WithdrawRequest.objects.filter(status="paid"))
    print(f"   - Tổng số tiền đã rút: {total_withdrawn:,.0f} VNĐ")

if __name__ == "__main__":
    update_withdraws_status()