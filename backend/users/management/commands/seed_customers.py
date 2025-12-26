from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Seed customer users customer10..customer20 and create 5 pending seller applications'

    def handle(self, *args, **options):
        from users.models import CustomUser
        from sellers.models import Seller

        created = []
        for i in range(10, 21):
            username = f'customer{i}'
            email = f'customer{i}@example.test'
            if CustomUser.objects.filter(username=username).exists():
                created.append((username, 'exists'))
                continue
            phone = '0' + str(900000000 + i)
            u = CustomUser(username=username, email=email, full_name=f'Customer {i}', phone=phone, is_active=True)
            u.set_password('Password123!')
            u.save()
            created.append((username, 'created'))

        # Create 5 seller applications (pending) for customer10..customer14
        for i in range(10, 15):
            try:
                u = CustomUser.objects.get(username=f'customer{i}')
                if not hasattr(u, 'seller') or u.seller is None:
                    Seller.objects.create(user=u, store_name=f'Cửa hàng {u.username}', phone=u.phone, status='pending')
            except Exception:
                # ignore errors for existing records
                continue

        self.stdout.write(self.style.SUCCESS(f'Seed complete: {created}'))
