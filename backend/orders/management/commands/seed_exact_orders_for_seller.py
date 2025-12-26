import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from faker import Faker

from orders.models import Order, OrderItem
from products.models import Product
from sellers.models import Seller

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed an exact number of orders for a specific seller'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, required=True, help='Username of the seller user (e.g. seller1)')
        parser.add_argument('--days', type=int, default=30, help='Number of past days to distribute orders over')
        parser.add_argument('--total', type=int, default=100, help='Exact total number of orders to create')

    def handle(self, *args, **kwargs):
        fake = Faker(['vi_VN'])
        days_range = kwargs['days']
        total_needed = kwargs['total']
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
            self.stdout.write(self.style.ERROR('No approved, visible products found for this seller.'))
            return
        if not customers:
            self.stdout.write(self.style.ERROR('No other active users to act as customers.'))
            return

        created = 0
        for i in range(total_needed):
            # distribute timestamps across days_range uniformly
            days_ago = random.randint(0, max(0, days_range - 1))
            seconds = random.randint(0, 86399)
            created_at = timezone.now() - timedelta(days=days_ago, seconds=seconds)

            customer = random.choice(customers)
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
                created_at=created_at,
            )
            order.created_at = created_at

            num_items = random.randint(1, 3)
            selected_products = random.sample(products, k=min(len(products), num_items))
            total_price = 0

            for p in selected_products:
                qty = random.randint(1, 3)
                final_price = p.discounted_price if (p.discounted_price and p.discounted_price > 0) else p.original_price
                img_url = p.image.url if p.image else ""
                OrderItem.objects.create(
                    order=order, product=p, product_image=img_url, unit=p.unit,
                    quantity=qty, price=final_price, status='NORMAL'
                )
                total_price += final_price * qty

            order.total_price = total_price + random.choice([0, 16500, 32000])
            order.shipping_fee = order.total_price - total_price
            order.save()

            created += 1
            if created % 50 == 0:
                self.stdout.write(f" -> Created {created}/{total_needed} orders...")

        self.stdout.write(self.style.SUCCESS(f'Created {created} orders for seller "{username}".'))
