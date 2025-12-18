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
    help = 'Seed dữ liệu đơn hàng khớp với model Order/OrderItem mới (có xử lý tranh chấp)'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=180, help='Số ngày lùi về quá khứ')
        parser.add_argument('--amount', type=int, default=200, help='Số lượng đơn hàng')

    def handle(self, *args, **kwargs):
        fake = Faker(['vi_VN'])
        days_range = kwargs['days']
        total_orders = kwargs['amount']

        # Lấy users và products
        users = list(User.objects.all())
        products = list(Product.objects.filter(status='approved', is_hidden=False))

        if not users:
            self.stdout.write(self.style.ERROR('Chưa có User.'))
            return
        if not products:
            self.stdout.write(self.style.ERROR('Chưa có Product nào trạng thái approved.'))
            return

        self.stdout.write(self.style.SUCCESS(f'Đang tạo {total_orders} đơn hàng từ {len(products)} sản phẩm...'))

        # Cấu hình tỉ lệ trạng thái đơn hàng
        # Lưu ý: 'success' cũ giờ là 'completed'
        STATUS_WEIGHTS = [
            ('completed', 0.5),   # Đã hoàn thành (nhiều nhất)
            ('delivered', 0.2),   # Đã giao, chưa hoàn thành (có thể khiếu nại)
            ('shipping', 0.1),    # Đang giao
            ('pending', 0.1),     # Chờ xác nhận
            ('cancelled', 0.05),  # Đã hủy
            ('returned', 0.05)    # Trả hàng/Hoàn tiền (toàn bộ)
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

            # Tạo Order Header
            order = Order.objects.create(
                user=user,
                customer_name=f"{user.last_name} {user.first_name}".strip() or user.username,
                customer_phone=fake.phone_number(),
                address=fake.address(),
                note=fake.sentence() if random.random() > 0.8 else "",
                payment_method=random.choice(['Thanh toán khi nhận hàng', 'VNPay', 'Chuyển khoản']),
                status=status,
                # Logic boolean fields
                stock_deducted=status in ['shipping', 'delivered', 'completed', 'returned'],
                sold_counted=status in ['completed'], # Chỉ tính đã bán khi completed (hoặc delivered tùy logic bạn)
                ghn_order_code=fake.uuid4() if status in ['shipping', 'delivered', 'completed', 'returned'] else None,
                is_disputed=False, # Mặc định False, sẽ cập nhật sau nếu có item tranh chấp
                created_at=created_at_fake # Sẽ bị override bởi auto_now_add, cần update lại sau save
            )
            
            # Hack để override created_at vì auto_now_add=True
            order.created_at = created_at_fake 
            
            # Chọn sản phẩm
            num_items = random.randint(1, 5)
            selected_products = random.sample(products, k=min(len(products), num_items))
            
            current_total = 0
            has_active_dispute = False # Cờ để kiểm tra xem đơn này có đang tranh chấp không

            for product in selected_products:
                qty = random.randint(1, 3)
                
                # Logic giá
                final_price = product.discounted_price if (product.discounted_price and product.discounted_price > 0) else product.original_price
                img_url = product.image.url if product.image else ""
                
                # --- LOGIC SEED STATUS CHO ITEM (QUAN TRỌNG) ---
                item_status = 'NORMAL'
                
                # Chỉ sinh ra trạng thái hoàn tiền/tranh chấp nếu đơn hàng đã giao hoặc đang ở trạng thái completed
                # Và tỉ lệ xảy ra thấp (ví dụ 10% trong số các đơn đã giao)
                if status in ['delivered', 'completed'] and random.random() < 0.15:
                    dispute_choices = [
                        ('REFUND_REQUESTED', 0.4), # Mới yêu cầu
                        ('SELLER_REJECTED', 0.2),  # Shop từ chối -> Chờ Buyer phản hồi
                        ('DISPUTE_TO_ADMIN', 0.2), # Đã khiếu nại lên sàn
                        ('REFUND_APPROVED', 0.1),  # Đã xong (tiền về buyer)
                        ('REFUND_REJECTED', 0.1)   # Đã xong (tiền về seller)
                    ]
                    d_statuses = [d[0] for d in dispute_choices]
                    d_weights = [d[1] for d in dispute_choices]
                    item_status = random.choices(d_statuses, weights=d_weights, k=1)[0]
                
                # Nếu đơn hàng tổng là 'returned', tất cả item nên là REFUND_APPROVED hoặc REQUESTED
                if status == 'returned':
                    item_status = 'REFUND_APPROVED'

                # Tạo OrderItem
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_image=img_url,
                    unit=product.unit,
                    quantity=qty,
                    price=final_price,
                    status=item_status
                )
                
                current_total += final_price * qty
                
                # Kiểm tra xem item này có gây ra trạng thái "Đang tranh chấp" cho Order không
                # Các trạng thái chưa kết thúc:
                if item_status in ['REFUND_REQUESTED', 'SELLER_REJECTED', 'DISPUTE_TO_ADMIN']:
                    has_active_dispute = True

            # Cập nhật lại Order Header
            shipping_fee = random.choice([0, 16500, 32000])
            order.total_price = current_total + shipping_fee
            order.shipping_fee = shipping_fee
            
            # Cập nhật cờ tranh chấp
            order.is_disputed = has_active_dispute
            
            # Save lại lần nữa để cập nhật total và is_disputed
            order.save() 
            
            count += 1
            if count % 50 == 0:
                self.stdout.write(f" -> Đã tạo {count} đơn...")

        self.stdout.write(self.style.SUCCESS(f'XONG! Đã seed thành công {count} đơn hàng.'))