"""
Script để kiểm tra withdraw requests trong database
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from payments.models_withdraw import WithdrawRequest

def check_withdraws():
    """Kiểm tra withdraw requests"""
    withdraws = WithdrawRequest.objects.all()
    
    print(f"Tổng số WithdrawRequests: {withdraws.count()}")
    
    if withdraws.count() == 0:
        print("Không có withdraw request nào trong database")
    else:
        for w in withdraws:
            print(f"  - ID: {w.id}, Amount: {w.amount:,.0f} VNĐ, Status: {w.status}, Created: {w.created_at}")

if __name__ == "__main__":
    check_withdraws()