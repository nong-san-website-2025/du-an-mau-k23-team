from django.core.management.base import BaseCommand
from faker import Faker
import random

from users.models import CustomUser
from sellers.models import Seller

class Command(BaseCommand):
    help = "Seed sellers based on existing seller users"

    def handle(self, *args, **kwargs):
        fake = Faker("vi_VN")
        status_choices = [choice[0] for choice in Seller.STATUS_CHOICES]

        self.stdout.write(self.style.NOTICE("Bắt đầu seed dữ liệu Seller..."))

        # Lấy ra các user có role seller
        seller_users = CustomUser.objects.filter(role__name="seller")

        for user in seller_users:
            seller, created = Seller.objects.get_or_create(
                user=user,
                defaults={
                    "store_name": fake.company(),
                    "bio": fake.text(max_nb_chars=200),
                    "address": fake.address(),
                    "phone": user.phone,
                    "status": random.choice(status_choices),
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ Created Seller for {user.username}"))
            else:
                self.stdout.write(self.style.WARNING(f"⚠️ Seller for {user.username} already exists"))

        self.stdout.write(self.style.SUCCESS("Hoàn tất seed dữ liệu Seller!"))
