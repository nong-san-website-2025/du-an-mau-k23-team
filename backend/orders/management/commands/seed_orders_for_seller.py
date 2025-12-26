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
from sellers.models import Seller

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed orders only for a specific seller (products belonging to that seller)'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, required=True, help='Username of the seller user (e.g. seller1)')
        parser.add_argument('--days', type=int, default=30, help='Number of past days to distribute orders over')
        parser.add_argument('--total', type=int, default=200, help='Total number of orders to create')

    def handle(self, *args, **kwargs):
        fake = Faker(['vi_VN'])
        days_range = kwargs['days']
        target_total = kwargs['total']
        username = kwargs['username']

        try:
            seller_user = User.objects.get(username=username)
            seller = Seller.objects.get(user=seller_user)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User with username "{username}" not found.'))
            return
        except Seller.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Seller profile for user "{username}" not found.'))
            return

        products = list(Product.objects.filter(seller=seller, status='approved', is_hidden=False))
        customers = list(User.objects.filter(is_active=True).exclude(id=seller_user.id))

        if not products:
            self.stdout.write(self.style.ERROR('Không tìm thấy sản phẩm nào cho seller này (approved, not hidden).'))
            return
        if not customers:
            self.stdout.write(self.style.ERROR('Không có users khác làm khách hàng để tạo đơn.'))
            return

        avg_per_day = target_total / max(1, days_range)
        total_created = 0

        period = max(7, int(days_range / 4))
        amplitude = avg_per_day * 0.9

        for day_idx in range(days_range):
            days_ago = days_range - day_idx
            current_date = timezone.now() - timedelta(days=days_ago)

            sine_val = math.sin((2 * math.pi * day_idx) / period)
            expected_count = avg_per_day + (amplitude * sine_val) + random.uniform(-0.2, 0.2)
            expected_count = max(0, expected_count)

            integer_part = int(expected_count)
            fractional_part = expected_count - integer_part
            if random.random() < fractional_part:
                daily_order_count = integer_part + 1
            else:
                daily_order_count = integer_part

            for _ in range(daily_order_count):
                customer = random.choice(customers)
                random_second_in_day = random.randint(0, 86400)
                created_at_fake = current_date + timedelta(seconds=random_second_in_day)

                status = random.choice(['pending', 'shipping', 'delivered', 'completed', 'cancelled'])

                order = Order.objects.create(
                    user=customer,
                    customer_name=f"{customer.last_name} {customer.first_name}".strip() or customer.username,
                    customer_phone=fake.phone_number(),
                    address=fake.address(),
                    note=fake.sentence() if random.random() > 0.8 else "",
                    payment_method=random.choice(['Thanh toán khi nhận hàng', 'VNPay', 'Chuyển khoản']),
                    status=status,
                    stock_deducted=status in ['shipping', 'delivered', 'completed'],
                    sold_counted=status in ['completed'],
                    ghn_order_code=fake.uuid4() if status in ['shipping', 'delivered', 'completed'] else None,
                    is_disputed=False,
                    created_at=created_at_fake
                )
                order.created_at = created_at_fake

                num_items = random.randint(1, 3)
                selected_products = random.sample(products, k=min(len(products), num_items))
                current_total = 0
                has_active_dispute = False

                for product in selected_products:
                    qty = random.randint(1, 3)
                    final_price = product.discounted_price if (product.discounted_price and product.discounted_price > 0) else product.original_price
                    img_url = product.image.url if product.image else ""

                    item_status = 'NORMAL'
                    if status in ['delivered', 'completed'] and random.random() < 0.05:
                        item_status = 'REFUND_REQUESTED'

                    OrderItem.objects.create(
                        order=order, product=product, product_image=img_url, unit=product.unit,
                        quantity=qty, price=final_price, status=item_status
                    )
                    current_total += final_price * qty
                    if item_status in ['REFUND_REQUESTED']:
                        has_active_dispute = True

                order.total_price = current_total + random.choice([0, 16500, 32000])
                order.shipping_fee = order.total_price - current_total
                order.is_disputed = has_active_dispute
                order.save()

                total_created += 1

            if day_idx % 10 == 0:
                self.stdout.write(f" -> Đã tạo {total_created} đơn (tính đến ngày {day_idx}).")

        self.stdout.write(self.style.SUCCESS(f'Hoàn tất. Đã tạo {total_created} đơn cho seller "{username}" trong {days_range} ngày.'))
