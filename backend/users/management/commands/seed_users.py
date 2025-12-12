# users/management/commands/seed_users.py
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from users.models import CustomUser, Role
import random

class Command(BaseCommand):
    help = "Seed 10 customers, 5 sellers, and 1 admin into the database"

    def handle(self, *args, **kwargs):
        # === Đảm bảo role tồn tại ===
        roles = ["customer", "seller", "admin", "employee", "support"]
        for role_name in roles:
            Role.objects.get_or_create(name=role_name)

        customer_role = Role.objects.get(name="customer")
        seller_role = Role.objects.get(name="seller")
        admin_role = Role.objects.get(name="admin")

        # === Tạo 10 khách hàng ===
        for i in range(1, 11):
            username = f"customer{i}"
            email = f"customer{i}@example.com"
            phone = f"09{random.randint(10000000, 99999999)}"

            user, created = CustomUser.objects.get_or_create(
                username=username,
                defaults={
                    "full_name": f"Khách hàng {i}",
                    "email": email,
                    "phone": phone,
                    "role": customer_role,
                    "password": make_password("123456"),
                    "status": "active",
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ Created customer: {username}"))
            else:
                self.stdout.write(self.style.WARNING(f"⚠️ Customer {username} already exists"))

        # === Tạo 5 người bán (seller) ===
        for i in range(1, 6):
            username = f"seller{i}"
            email = f"seller{i}@example.com"
            phone = f"08{random.randint(10000000, 99999999)}"

            seller, created = CustomUser.objects.get_or_create(
                username=username,
                defaults={
                    "full_name": f"Người bán {i}",
                    "email": email,
                    "phone": phone,
                    "role": seller_role,
                    "password": make_password("123456"),
                    "status": "active",
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ Created seller: {username}"))
            else:
                self.stdout.write(self.style.WARNING(f"⚠️ Seller {username} already exists"))

        # === Tạo admin ===
        admin_user, created = CustomUser.objects.get_or_create(
            username="admin",
            defaults={
                "full_name": "Quản trị viên",
                "email": "admin@example.com",
                "phone": "0900000000",
                "role": admin_role,
                "password": make_password("123456"),
                "is_staff": True,
                "is_superuser": True,
                "status": "active",
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS("✅ Created admin: admin (password: 123456)"))
        else:
            self.stdout.write(self.style.WARNING("⚠️ Admin already exists"))
