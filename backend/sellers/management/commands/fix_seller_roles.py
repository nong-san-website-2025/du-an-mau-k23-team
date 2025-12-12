from django.core.management.base import BaseCommand
from sellers.models import Seller
from users.models import Role, CustomUser

class Command(BaseCommand):
    help = "Fix roles for users with approved sellers"

    def handle(self, *args, **kwargs):
        # Ensure seller role exists
        seller_role, created = Role.objects.get_or_create(name="seller")
        if created:
            self.stdout.write(self.style.SUCCESS("Created 'seller' role"))

        # Find all approved sellers
        approved_sellers = Seller.objects.filter(status__in=["approved", "active"])

        fixed_count = 0
        for seller in approved_sellers:
            if seller.user.role != seller_role:
                seller.user.role = seller_role
                seller.user.save(update_fields=["role"])
                fixed_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Fixed role for user: {seller.user.username} (seller: {seller.store_name})"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(f"Fixed roles for {fixed_count} users")
        )