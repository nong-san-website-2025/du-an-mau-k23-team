import random
import math
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
    help = 'Seed dữ liệu đơn hàng theo biểu đồ hình SIN (chính xác số lượng tổng)'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=365, help='Số ngày lùi về quá khứ (Trục X)')
        parser.add_argument('--total', type=int, default=500, help='Tổng số lượng đơn hàng mong muốn')

    def handle(self, *args, **kwargs):
        fake = Faker(['vi_VN'])
        days_range = kwargs['days']
        target_total = kwargs['total']

        # Lấy users và products
        users = list(User.objects.all())
        products = list(Product.objects.filter(status='approved', is_hidden=False))

        if not users or not products:
            self.stdout.write(self.style.ERROR('Chưa có User hoặc Product (approved).'))
            return

        # Tính toán trung bình mỗi ngày
        avg_per_day = target_total / days_range
        self.stdout.write(self.style.SUCCESS(f'Mục tiêu: {target_total} đơn / {days_range} ngày (~{avg_per_day:.2f} đơn/ngày).'))

        total_created = 0

        # --- CẤU HÌNH HÌNH SIN ---
        # Chu kỳ: 60 ngày lên xuống 1 lần để nhìn rõ sóng trong 1 năm
        period = 60 
        # Biên độ: Dao động 90% so với trung bình (tạo sóng cao/thấp rõ rệt)
        amplitude = avg_per_day * 0.9 

        for day_idx in range(days_range):
            days_ago = days_range - day_idx
            current_date = timezone.now() - timedelta(days=days_ago)
            
            # --- CÔNG THỨC HÌNH SIN ---
            sine_val = math.sin((2 * math.pi * day_idx) / period)
            
            # Tính số lượng đơn dự kiến (dạng số thực, vd: 1.45 đơn)
            # Cộng thêm chút noise random nhẹ (-0.2 đến 0.2) để không quá máy móc
            expected_count = avg_per_day + (amplitude * sine_val) + random.uniform(-0.2, 0.2)
            expected_count = max(0, expected_count) # Không âm

            # --- LÀM TRÒN THEO XÁC SUẤT ---
            # Ví dụ: 1.4 đơn -> 40% ra 2 đơn, 60% ra 1 đơn
            integer_part = int(expected_count)
            fractional_part = expected_count - integer_part
            
            if random.random() < fractional_part:
                daily_order_count = integer_part + 1
            else:
                daily_order_count = integer_part

            # --- TẠO ĐƠN ---
            for _ in range(daily_order_count):
                user = random.choice(users)
                random_second_in_day = random.randint(0, 86400)
                created_at_fake = current_date + timedelta(seconds=random_second_in_day)
                
                status = self.get_realistic_status(days_ago)

                order = Order.objects.create(
                    user=user,
                    customer_name=f"{user.last_name} {user.first_name}".strip() or user.username,
                    customer_phone=fake.phone_number(),
                    address=fake.address(),
                    note=fake.sentence() if random.random() > 0.8 else "",
                    payment_method=random.choice(['Thanh toán khi nhận hàng', 'VNPay', 'Chuyển khoản']),
                    status=status,
                    stock_deducted=status in ['shipping', 'delivered', 'completed', 'returned'],
                    sold_counted=status in ['completed'],
                    ghn_order_code=fake.uuid4() if status in ['shipping', 'delivered', 'completed', 'returned'] else None,
                    is_disputed=False,
                    created_at=created_at_fake
                )
                order.created_at = created_at_fake # Override time
                
                # --- ORDER ITEMS ---
                num_items = random.randint(1, 4)
                selected_products = random.sample(products, k=min(len(products), num_items))
                current_total = 0
                has_active_dispute = False

                for product in selected_products:
                    qty = random.randint(1, 3)
                    final_price = product.discounted_price if (product.discounted_price and product.discounted_price > 0) else product.original_price
                    img_url = product.image.url if product.image else ""
                    
                    # Logic dispute/refund
                    item_status = 'NORMAL'
                    if status in ['delivered', 'completed'] and days_ago < 30 and random.random() < 0.1:
                        dispute_choices = [('REFUND_REQUESTED', 0.5), ('SELLER_REJECTED', 0.2), ('DISPUTE_TO_ADMIN', 0.3)]
                        if days_ago > 14:
                             dispute_choices = [('REFUND_APPROVED', 0.5), ('REFUND_REJECTED', 0.5)]
                        d_statuses = [d[0] for d in dispute_choices]
                        d_weights = [d[1] for d in dispute_choices]
                        item_status = random.choices(d_statuses, weights=d_weights, k=1)[0]
                    
                    if status == 'returned':
                        item_status = 'REFUND_APPROVED'

                    OrderItem.objects.create(
                        order=order, product=product, product_image=img_url, unit=product.unit,
                        quantity=qty, price=final_price, status=item_status
                    )
                    current_total += final_price * qty
                    if item_status in ['REFUND_REQUESTED', 'SELLER_REJECTED', 'DISPUTE_TO_ADMIN']:
                        has_active_dispute = True

                order.total_price = current_total + random.choice([0, 16500, 32000])
                order.shipping_fee = order.total_price - current_total
                order.is_disputed = has_active_dispute
                order.save()
                
                total_created += 1

            if day_idx % 30 == 0:
                self.stdout.write(f" -> Tháng thứ {day_idx // 30 + 1}: Đã tích lũy {total_created} đơn.")

        self.stdout.write(self.style.SUCCESS(f'XONG! Đã tạo tổng cộng {total_created} đơn hàng trong {days_range} ngày.'))

    def get_realistic_status(self, days_ago):
        status_choices = ['pending', 'shipping', 'delivered', 'completed', 'cancelled', 'returned']
        if days_ago > 14:
            weights = [0.0, 0.0, 0.05, 0.85, 0.05, 0.05] 
        elif 7 < days_ago <= 14:
            weights = [0.0, 0.1, 0.3, 0.5, 0.05, 0.05]
        elif 3 < days_ago <= 7:
            weights = [0.05, 0.4, 0.4, 0.1, 0.05, 0.0]
        else:
            weights = [0.5, 0.4, 0.1, 0.0, 0.0, 0.0]
        return random.choices(status_choices, weights=weights, k=1)[0]