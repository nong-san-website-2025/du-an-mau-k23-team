import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from faker import Faker

# Import models
from orders.models import Order, OrderItem
from products.models import Product

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed dữ liệu đơn hàng khớp với model Product hiện tại'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=180, help='Số ngày lùi về quá khứ')
        parser.add_argument('--amount', type=int, default=200, help='Số lượng đơn hàng')

    def handle(self, *args, **kwargs):
        fake = Faker(['vi_VN'])
        days_range = kwargs['days']
        total_orders = kwargs['amount']

        # Lấy users và products (Chỉ lấy sản phẩm đã duyệt và không ẩn)
        users = list(User.objects.all())
        products = list(Product.objects.filter(status='approved', is_hidden=False))

        if not users:
            self.stdout.write(self.style.ERROR('Chưa có User.'))
            return
        if not products:
            self.stdout.write(self.style.ERROR('Chưa có Product nào trạng thái approved.'))
            return

        self.stdout.write(self.style.SUCCESS(f'Đang tạo {total_orders} đơn hàng từ {len(products)} sản phẩm...'))

        # Cấu hình tỉ lệ trạng thái đơn hàng (Ưu tiên đã giao để biểu đồ đẹp)
        STATUS_WEIGHTS = [
            ('delivered', 0.6), ('success', 0.15), 
            ('cancelled', 0.1), ('returned', 0.05),
            ('shipping', 0.05), ('pending', 0.05)
        ]
        status_choices = [s[0] for s in STATUS_WEIGHTS]
        weights = [s[1] for s in STATUS_WEIGHTS]

        count = 0

        for _ in range(total_orders):
            user = random.choice(users)
            status = random.choices(status_choices, weights=weights, k=1)[0]
            
            # Random thời gian
            random_days = random.randint(0, days_range)
            random_seconds = random.randint(0, 86400)
            created_at_fake = timezone.now() - timedelta(days=random_days, seconds=random_seconds)

            # Tạo đơn hàng header
            order = Order.objects.create(
                user=user,
                customer_name=f"{user.last_name} {user.first_name}".strip() or user.username,
                customer_phone=fake.phone_number(),
                address=fake.address(),
                note=fake.sentence() if random.random() > 0.7 else "",
                payment_method=random.choice(['Thanh toán khi nhận hàng', 'VNPay', 'Chuyển khoản']),
                status=status,
                stock_deducted=status in ['shipping', 'delivered', 'success'],
                sold_counted=status in ['delivered', 'success'],
                ghn_order_code=fake.uuid4() if status in ['shipping', 'delivered'] else None
            )

            # Chọn ngẫu nhiên 1-5 sản phẩm cho đơn này
            num_items = random.randint(1, 5)
            selected_products = random.sample(products, k=min(len(products), num_items))
            
            current_total = 0
            
            for product in selected_products:
                qty = random.randint(1, 5)
                
                # --- LOGIC GIÁ (QUAN TRỌNG) ---
                # Kiểm tra xem có giá giảm không, nếu có dùng giá giảm, không thì dùng giá gốc
                if product.discounted_price and product.discounted_price > 0:
                    final_price = product.discounted_price
                else:
                    final_price = product.original_price
                
                # Xử lý ảnh (tránh lỗi nếu không có ảnh)
                img_url = product.image.url if product.image else ""
                
                # Tạo OrderItem
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_image=img_url,
                    unit=product.unit,  # Lấy từ model Product
                    quantity=qty,
                    price=final_price   # Lưu giá tại thời điểm mua
                )
                current_total += final_price * qty

            # Cập nhật tổng tiền đơn hàng
            shipping_fee = random.choice([0, 15000, 30000])
            order.total_price = current_total + shipping_fee
            order.shipping_fee = shipping_fee
            
            # Ghi đè thời gian tạo (Để vẽ biểu đồ lịch sử)
            order.created_at = created_at_fake
            
            # Logic xóa mềm nếu cần (nhưng ở đây giữ lại để hiện thống kê)
            # order.is_deleted = False 

            order.save()
            count += 1

            # In tiến độ mỗi 50 đơn
            if count % 50 == 0:
                self.stdout.write(f" -> Đã tạo {count} đơn...")

        self.stdout.write(self.style.SUCCESS(f'XONG! Đã seed thành công {count} đơn hàng.'))