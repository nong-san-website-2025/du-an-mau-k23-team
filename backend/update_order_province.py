"""
Script để update province_id cho các đơn hàng cũ
Lấy province_id từ địa chỉ mặc định của user
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from orders.models import Order
from users.models import Address

print("=" * 60)
print("🔄 CẬP NHẬT PROVINCE_ID CHO ĐƠN HÀNG CŨ")
print("=" * 60)

# Lấy tất cả đơn hàng không có province_id
orders_without_province = Order.objects.filter(
    province_id__isnull=True
).select_related('user')

total_orders = orders_without_province.count()
print(f"\n📦 Tìm thấy {total_orders} đơn hàng chưa có province_id")

updated_count = 0
skipped_count = 0

for order in orders_without_province:
    try:
        if not order.user:
            print(f"   ⚠️  Order #{order.id}: Không có user")
            skipped_count += 1
            continue
        
        # Lấy địa chỉ mặc định của user
        default_address = Address.objects.filter(
            user=order.user,
            is_default=True
        ).first()
        
        if not default_address:
            # Nếu không có địa chỉ mặc định, lấy địa chỉ đầu tiên
            default_address = Address.objects.filter(user=order.user).first()
        
        if default_address and default_address.province_id:
            # Update order với province_id từ address
            order.province_id = default_address.province_id
            order.district_id = default_address.district_id
            order.ward_code = default_address.ward_code
            order.save(update_fields=['province_id', 'district_id', 'ward_code'])
            
            updated_count += 1
            if updated_count <= 5:  # Chỉ in 5 đơn đầu
                print(f"   ✅ Order #{order.id}: Updated province_id={default_address.province_id}")
        else:
            skipped_count += 1
            if skipped_count <= 3:  # Chỉ in 3 đơn bị skip đầu
                print(f"   ⚠️  Order #{order.id}: User không có địa chỉ với province_id")
    
    except Exception as e:
        print(f"   ❌ Error updating Order #{order.id}: {e}")
        skipped_count += 1

print("\n" + "=" * 60)
print("KẾT QUẢ:")
print("=" * 60)
print(f"✅ Đã cập nhật: {updated_count} đơn hàng")
print(f"⚠️  Bỏ qua: {skipped_count} đơn hàng")
print(f"📊 Tổng: {total_orders} đơn hàng")
print("=" * 60)

# Kiểm tra lại
print("\n🔍 KIỂM TRA SAU KHI CẬP NHẬT:")
successful_orders = Order.objects.filter(
    status__in=['delivered', 'completed'],
    province_id__isnull=False
)
print(f"✅ Đơn hàng delivered/completed CÓ province_id: {successful_orders.count()}")

from django.db.models import Count
province_stats = successful_orders.values('province_id').annotate(
    count=Count('id')
).order_by('-count')

if province_stats:
    print("\n📍 Thống kê theo province_id:")
    for stat in province_stats[:5]:
        print(f"   Province {stat['province_id']}: {stat['count']} đơn")
else:
    print("\n⚠️  Vẫn chưa có dữ liệu province")

print("\n💡 Bây giờ reload trang thống kê để xem kết quả!")
