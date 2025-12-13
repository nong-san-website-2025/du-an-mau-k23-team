# core/management/commands/seed_all.py
from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = "Seed toàn bộ dữ liệu mẫu: Roles, Users, Sellers, Products, Vouchers"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("🚀 Bắt đầu seed toàn bộ dữ liệu...\n"))

        steps = [
            ("Seed Users & Roles", "seed_users"),
            ("Seed Sellers từ Users", "seed_sellers"),
            ("Reset & Seed Products", "seed_products"),
            ("Seed Vouchers", "seed_vouchers"),
            ("Seed Blog Posts", "seed_blog"),
            ("Seed Orders", "seed_orders"),
        ]

        for step_name, command_name in steps:
            self.stdout.write(self.style.NOTICE(f"▶️ {step_name} ..."))
            try:
                call_command(command_name)
                self.stdout.write(self.style.SUCCESS(f"✅ Hoàn tất: {step_name}\n"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Lỗi ở bước {step_name}: {str(e)}"))
                break  # Dừng luôn nếu có lỗi

        self.stdout.write(self.style.SUCCESS("🎉 Hoàn tất seed tất cả dữ liệu!"))
