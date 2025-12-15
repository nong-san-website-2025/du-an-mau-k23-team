from django.core.management.base import BaseCommand
from faker import Faker
import random
from users.models import CustomUser
from sellers.models import Seller

class Command(BaseCommand):
    help = "Seed sellers based on existing seller users with GHN location data"

    def handle(self, *args, **kwargs):
        fake = Faker("vi_VN")
        status_choices = [choice[0] for choice in Seller.STATUS_CHOICES]
        
        # Danh sách mẫu các địa điểm có thật của GHN (District ID và Ward Code)
        # Lưu ý: District ID là số, Ward Code là chuỗi
        GHN_SAMPLE_LOCATIONS = [
            # Hồ Chí Minh - Quận 1 - Phường Bến Nghé
            {"district_id": 1442, "ward_code": "20101", "address_prefix": "Đường Nguyễn Huệ, Quận 1, TP.HCM"},
            # Hồ Chí Minh - Quận 3 - Phường 6
            {"district_id": 1444, "ward_code": "20308", "address_prefix": "Đường Võ Văn Tần, Quận 3, TP.HCM"},
            # Hà Nội - Quận Hoàn Kiếm - Phường Hàng Trống
            {"district_id": 1490, "ward_code": "1A0807", "address_prefix": "Phố Hàng Trống, Hoàn Kiếm, Hà Nội"},
            # Hà Nội - Quận Cầu Giấy - Phường Dịch Vọng
            {"district_id": 1542, "ward_code": "1B2101", "address_prefix": "Đường Cầu Giấy, Cầu Giấy, Hà Nội"},
            # Cần Thơ - Quận Ninh Kiều - Phường Tân An
            {"district_id": 1461, "ward_code": "630104", "address_prefix": "Đại lộ Hòa Bình, Ninh Kiều, Cần Thơ"},
            # Đà Nẵng - Quận Hải Châu - Phường Thạch Thang
            {"district_id": 1530, "ward_code": "40105", "address_prefix": "Đường Bạch Đằng, Hải Châu, Đà Nẵng"},
        ]

        self.stdout.write(self.style.NOTICE("Bắt đầu seed dữ liệu Seller kèm thông tin GHN..."))

        # Lấy ra các user có role seller
        seller_users = CustomUser.objects.filter(role__name="seller")

        count_created = 0
        count_exist = 0

        for user in seller_users:
            location = random.choice(GHN_SAMPLE_LOCATIONS)
            street_address = fake.street_address()
            full_address = f"{street_address}, {location['address_prefix']}"

            # SỬ DỤNG update_or_create thay vì get_or_create
            seller, created = Seller.objects.update_or_create(
                user=user,
                defaults={
                    "store_name": fake.company(),
                    "bio": fake.text(max_nb_chars=200),
                    "address": full_address,
                    "phone": user.phone if user.phone else fake.phone_number(),
                    "status": random.choice(status_choices),
                    
                    # Dữ liệu GHN sẽ luôn được cập nhật kể cả user cũ
                    "district_id": location["district_id"],
                    "ward_code": location["ward_code"],
                    
                    "business_type": random.choice([c[0] for c in Seller.BUSINESS_TYPE_CHOICES]),
                    "tax_code": fake.isbn13().replace("-", "") if random.choice([True, False]) else None
                }
            )

            if created:
                count_created += 1
                self.stdout.write(self.style.SUCCESS(f"✅ Created: {seller.store_name}"))
            else:
                count_exist += 1
                # Thông báo đã update
                self.stdout.write(self.style.WARNING(f"🔄 Updated: {seller.store_name} with GHN ID {location['district_id']}"))

        self.stdout.write(self.style.SUCCESS(f"Hoàn tất! Mới: {count_created}, Tồn tại: {count_exist}"))