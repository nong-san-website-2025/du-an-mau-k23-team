"""
Script để kiểm tra dữ liệu của từng seller
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from sellers.models import Seller
from products.models import Product
from orders.models import OrderItem
from payments.models import Payment
from payments.models_withdraw import WithdrawRequest
from django.db.models import Sum

def check_seller_data():
    """Kiểm tra dữ liệu của từng seller"""
    
    sellers = Seller.objects.all()
    
    print("=" * 80)
    print("KIỂM TRA DỮ LIỆU CỦA TỪNG SELLER")
    print("=" * 80)
    
    for seller in sellers:
        print(f"\n📦 SELLER: {seller.user.username} (ID: {seller.id})")
        print("-" * 80)
        
        # Products của seller
        products = Product.objects.filter(seller=seller)
        print(f"   - Số lượng sản phẩm: {products.count()}")
        
        if products.count() > 0:
            print(f"   - Danh sách sản phẩm:")
            for product in products:
                print(f"      • {product.name} (ID: {product.id}, Giá: {product.price:,.0f} VNĐ)")
        
        # Order items có product của seller
        product_ids = products.values_list("id", flat=True)
        order_items = OrderItem.objects.filter(product_id__in=product_ids)
        print(f"   - Số lượng order items: {order_items.count()}")
        
        # Orders có chứa products của seller
        order_ids = order_items.values_list("order_id", flat=True).distinct()
        print(f"   - Số lượng orders: {len(order_ids)}")
        
        # Payments của các orders này
        payments = Payment.objects.filter(order_id__in=order_ids)
        success_payments = payments.filter(status__in=["SUCCESS", "Đã thanh toán"])
        pending_payments = payments.filter(status="PENDING")
        
        print(f"   - Số lượng payments: {payments.count()}")
        print(f"      • SUCCESS: {success_payments.count()}")
        print(f"      • PENDING: {pending_payments.count()}")
        
        # Tính doanh thu
        total_revenue = success_payments.aggregate(total=Sum("amount"))['total'] or 0
        pending_amount = pending_payments.aggregate(total=Sum("amount"))['total'] or 0
        
        print(f"   - Tổng doanh thu (SUCCESS): {float(total_revenue):,.0f} VNĐ")
        print(f"   - Số dư đang chờ (PENDING): {float(pending_amount):,.0f} VNĐ")
        
        # Withdraws của seller
        withdraws = WithdrawRequest.objects.filter(seller=seller)
        paid_withdraws = withdraws.filter(status__in=["paid", "approved"])
        
        print(f"   - Số lượng withdraws: {withdraws.count()}")
        print(f"      • PAID: {paid_withdraws.count()}")
        
        total_withdrawn = paid_withdraws.aggregate(total=Sum("amount"))['total'] or 0
        print(f"   - Tổng số tiền đã rút: {float(total_withdrawn):,.0f} VNĐ")
        
        # Số dư khả dụng
        available_balance = float(total_revenue) - float(total_withdrawn)
        print(f"   - Số dư khả dụng: {available_balance:,.0f} VNĐ")
        
        print("\n   📊 KẾT QUẢ CHO SELLER NÀY:")
        print(f"      ✓ Số dư khả dụng: {available_balance:,.0f} ₫")
        print(f"      ✓ Số dư đang chờ xử lý: {float(pending_amount):,.0f} ₫")
        print(f"      ✓ Tổng doanh thu: {float(total_revenue):,.0f} ₫")
        print(f"      ✓ Số tiền đã rút: {float(total_withdrawn):,.0f} ₫")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    check_seller_data()