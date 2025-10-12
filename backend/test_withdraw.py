"""
Script kiểm tra chức năng rút tiền cho seller
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db.models import Sum
from sellers.models import Seller
from products.models import Product
from orders.models import OrderItem
from payments.models import Payment
from payments.models_withdraw import WithdrawRequest

def format_currency(amount):
    """Format số tiền theo định dạng VNĐ"""
    return f"{int(amount):,} VNĐ".replace(",", ".")

def check_withdraw_eligibility(seller_id):
    """Kiểm tra điều kiện rút tiền cho seller"""
    print("=" * 80)
    print("KIỂM TRA ĐIỀU KIỆN RÚT TIỀN")
    print("=" * 80)
    
    try:
        seller = Seller.objects.get(id=seller_id)
        print(f"✅ Seller: {seller.user.username} (ID: {seller.id})")
    except Seller.DoesNotExist:
        print(f"❌ Không tìm thấy seller với ID: {seller_id}")
        return
    
    # Lấy danh sách sản phẩm
    products = Product.objects.filter(seller=seller)
    product_ids = list(products.values_list('id', flat=True))
    print(f"📦 Số sản phẩm: {products.count()}")
    print(f"   Product IDs: {product_ids}")
    
    # Lấy danh sách order
    order_ids = OrderItem.objects.filter(product_id__in=product_ids).values_list('order_id', flat=True).distinct()
    print(f"📦 Số orders: {order_ids.count()}")
    
    # Tính tổng doanh thu từ payments SUCCESS
    payments = Payment.objects.filter(order_id__in=order_ids, status='success')
    total_revenue = payments.aggregate(total=Sum('amount'))['total'] or 0
    print(f"\n💰 DOANH THU:")
    print(f"   - Số payments SUCCESS: {payments.count()}")
    print(f"   - Tổng doanh thu: {format_currency(total_revenue)}")
    
    # Tính tổng đã rút
    withdraws = WithdrawRequest.objects.filter(seller=seller)
    total_withdrawn = withdraws.filter(status__in=['paid', 'approved']).aggregate(total=Sum('amount'))['total'] or 0
    pending_withdraws = withdraws.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0
    
    print(f"\n💸 RÚT TIỀN:")
    print(f"   - Tổng đã rút (PAID/APPROVED): {format_currency(total_withdrawn)}")
    print(f"   - Đang chờ xử lý (PENDING): {format_currency(pending_withdraws)}")
    
    # Tính số dư khả dụng
    available_balance = float(total_revenue) - float(total_withdrawn)
    print(f"\n✅ SỐ DƯ KHẢ DỤNG: {format_currency(available_balance)}")
    
    # Hiển thị lịch sử rút tiền
    print(f"\n📋 LỊCH SỬ RÚT TIỀN ({withdraws.count()} yêu cầu):")
    if withdraws.exists():
        for w in withdraws.order_by('-created_at'):
            status_icon = {
                'pending': '⏳',
                'approved': '✅',
                'paid': '💰',
                'rejected': '❌'
            }.get(w.status, '❓')
            print(f"   {status_icon} #{w.id}: {format_currency(w.amount)} - {w.status.upper()} - {w.created_at.strftime('%Y-%m-%d %H:%M')}")
    else:
        print("   (Chưa có yêu cầu rút tiền nào)")
    
    # Kiểm tra điều kiện rút tiền
    print(f"\n🔍 KIỂM TRA ĐIỀU KIỆN:")
    min_withdraw = 10000
    print(f"   - Số tiền tối thiểu: {format_currency(min_withdraw)}")
    print(f"   - Số dư khả dụng: {format_currency(available_balance)}")
    
    if available_balance >= min_withdraw:
        print(f"   ✅ Có thể rút tiền (tối đa {format_currency(available_balance)})")
    else:
        print(f"   ❌ Không đủ số dư để rút tiền")
    
    print("=" * 80)
    return available_balance

def simulate_withdraw(seller_id, amount):
    """Mô phỏng yêu cầu rút tiền"""
    print("\n" + "=" * 80)
    print("MÔ PHỎNG YÊU CẦU RÚT TIỀN")
    print("=" * 80)
    
    try:
        seller = Seller.objects.get(id=seller_id)
    except Seller.DoesNotExist:
        print(f"❌ Không tìm thấy seller với ID: {seller_id}")
        return
    
    print(f"Seller: {seller.user.username}")
    print(f"Số tiền yêu cầu: {format_currency(amount)}")
    
    # Kiểm tra số tiền hợp lệ
    if amount <= 0:
        print("❌ LỖI: Số tiền không hợp lệ")
        return
    
    if amount < 10000:
        print("❌ LỖI: Số tiền tối thiểu là 10,000 VNĐ")
        return
    
    # Tính số dư
    product_ids = Product.objects.filter(seller=seller).values_list('id', flat=True)
    order_ids = OrderItem.objects.filter(product_id__in=product_ids).values_list('order_id', flat=True).distinct()
    payments = Payment.objects.filter(order_id__in=order_ids, status='success')
    total_revenue = payments.aggregate(total=Sum('amount'))['total'] or 0
    total_withdrawn = WithdrawRequest.objects.filter(seller=seller, status__in=['paid', 'approved']).aggregate(total=Sum('amount'))['total'] or 0
    balance = float(total_revenue) - float(total_withdrawn)
    
    print(f"Số dư khả dụng: {format_currency(balance)}")
    
    # Kiểm tra số dư
    if amount > balance:
        print(f"❌ LỖI: Số dư không đủ (thiếu {format_currency(amount - balance)})")
        return
    
    # Tạo yêu cầu rút tiền (chỉ mô phỏng, không lưu thật)
    print(f"✅ THÀNH CÔNG: Yêu cầu rút tiền hợp lệ!")
    print(f"   - Số tiền rút: {format_currency(amount)}")
    print(f"   - Số dư còn lại (sau khi duyệt): {format_currency(balance - amount)}")
    print(f"   - Trạng thái: PENDING (đang chờ admin duyệt)")
    
    # Hỏi có muốn tạo thật không
    create = input("\n❓ Bạn có muốn TẠO THẬT yêu cầu rút tiền này không? (y/n): ")
    if create.lower() == 'y':
        withdraw = WithdrawRequest.objects.create(
            seller=seller,
            amount=amount,
            status='pending'
        )
        print(f"✅ Đã tạo yêu cầu rút tiền #{withdraw.id}")
    else:
        print("⏭️ Bỏ qua, không tạo yêu cầu")
    
    print("=" * 80)

if __name__ == "__main__":
    # Lấy seller có doanh thu để test (seller ID 2)
    try:
        seller = Seller.objects.get(id=2)
    except Seller.DoesNotExist:
        # Nếu không có seller ID 2, lấy seller đầu tiên
        seller = Seller.objects.first()
        if not seller:
            print("❌ Không có seller nào trong database")
            exit()
    
    seller_id = seller.id
    print(f"\n🧪 TEST CHỨC NĂNG RÚT TIỀN CHO SELLER ID: {seller_id}\n")
    
    # Kiểm tra điều kiện
    available_balance = check_withdraw_eligibility(seller_id)
    
    # Mô phỏng các trường hợp
    if available_balance and available_balance > 0:
        print("\n" + "=" * 80)
        print("CÁC TRƯỜNG HỢP TEST")
        print("=" * 80)
        
        # Test case 1: Rút số tiền hợp lệ
        print("\n📝 TEST CASE 1: Rút số tiền hợp lệ (100,000 VNĐ)")
        simulate_withdraw(seller_id, 100000)
        
        # Test case 2: Rút quá số dư
        print("\n📝 TEST CASE 2: Rút quá số dư")
        simulate_withdraw(seller_id, available_balance + 1000000)
        
        # Test case 3: Rút dưới mức tối thiểu
        print("\n📝 TEST CASE 3: Rút dưới mức tối thiểu (5,000 VNĐ)")
        simulate_withdraw(seller_id, 5000)
        
        # Test case 4: Rút số tiền âm
        print("\n📝 TEST CASE 4: Rút số tiền âm")
        simulate_withdraw(seller_id, -10000)