"""
Script test để kiểm tra dữ liệu geographic distribution
"""
import os
import sys
import django

# Thêm thư mục backend vào Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from orders.models import Order
from users.models import Address, CustomUser
from delivery.services.ghn import GHNClient

print("=" * 60)
print("🔍 KIỂM TRA DỮ LIỆU ĐƠN HÀNG VÀ ĐỊA CHỈ")
print("=" * 60)

# 1. Kiểm tra tổng số đơn hàng
all_orders = Order.objects.all()
print(f"\n📦 Tổng số đơn hàng: {all_orders.count()}")

# 2. Kiểm tra đơn hàng theo trạng thái
from django.db.models import Count
status_counts = Order.objects.values('status').annotate(
    count=Count('id')
).order_by('-count')

print("\n📊 Phân bố theo trạng thái:")
for item in status_counts:
    print(f"   {item['status']}: {item['count']}")

# 3. Kiểm tra đơn hàng delivered/completed
successful_orders = Order.objects.filter(
    status__in=['delivered', 'completed']
)
print(f"\n✅ Đơn hàng giao thành công (delivered/completed): {successful_orders.count()}")

# 4. Kiểm tra province_id trong đơn hàng
if successful_orders.exists():
    print("\n🌍 Chi tiết 5 đơn hàng giao thành công đầu tiên:")
    for order in successful_orders[:5]:
        print(f"   Order #{order.id}:")
        print(f"      - Status: {order.status}")
        print(f"      - Province ID: {order.province_id}")
        print(f"      - District ID: {order.district_id}")
        print(f"      - Ward Code: {order.ward_code}")
        
        # Kiểm tra địa chỉ mặc định của user
        if order.user:
            default_addr = Address.objects.filter(
                user=order.user, 
                is_default=True
            ).first()
            if default_addr:
                print(f"      - User's default address province_id: {default_addr.province_id}")
            else:
                print(f"      - User không có địa chỉ mặc định")

# 5. Tính province_count như trong API
province_count = {}
for order in successful_orders:
    province_id = order.province_id
    
    if not province_id and order.user:
        default_address = Address.objects.filter(
            user=order.user, 
            is_default=True
        ).first()
        
        if default_address and default_address.province_id:
            province_id = default_address.province_id
    
    if province_id:
        province_count[province_id] = province_count.get(province_id, 0) + 1

print(f"\n📍 Province count dict: {province_count}")

# 6. Test GHN API
if province_count:
    print("\n🌐 Test GHN API get_provinces:")
    try:
        provinces_res = GHNClient.get_provinces()
        print(f"   Success: {provinces_res.get('success')}")
        
        if provinces_res.get('success') and provinces_res.get('data'):
            province_data = provinces_res['data']
            print(f"   Số lượng tỉnh từ GHN: {len(province_data)}")
            
            # Map province_id sang tên
            province_map = {
                p['ProvinceID']: p['ProvinceName'] 
                for p in province_data
            }
            
            print("\n   Mapping province_id -> tên tỉnh:")
            for pid, count in province_count.items():
                name = province_map.get(pid, f'Province {pid}')
                print(f"      {pid} -> {name} ({count} đơn)")
        else:
            print(f"   ❌ GHN API failed: {provinces_res}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
else:
    print("\n⚠️  Không có province_count để test GHN API")

print("\n" + "=" * 60)
print("KẾT LUẬN:")
print("=" * 60)
if successful_orders.count() == 0:
    print("❌ NGUYÊN NHÂN: Không có đơn hàng nào ở trạng thái 'delivered' hoặc 'completed'")
    print("   GIẢI PHÁP: Cập nhật status của ít nhất 1 đơn hàng thành 'delivered'")
elif not province_count:
    print("❌ NGUYÊN NHÂN: Các đơn hàng delivered/completed không có province_id")
    print("   GIẢI PHÁP: Đơn hàng cũ chưa có province_id, cần tạo đơn mới hoặc update province_id")
else:
    print("✅ Dữ liệu OK - Khu vực hoạt động sẽ hiển thị khi reload trang")

print("=" * 60)
