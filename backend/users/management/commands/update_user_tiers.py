from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.utils import update_user_tier

User = get_user_model()


class Command(BaseCommand):
    help = 'Update tier for all users based on their total spending'

    def add_arguments(self, parser):
        parser.add_argument(
            '--customer-only',
            action='store_true',
            help='Update only customer role users'
        )

    def handle(self, *args, **options):
        if options['customer_only']:
            users = User.objects.filter(role__name='customer')
            self.stdout.write(f"Updating {users.count()} customers...")
        else:
            users = User.objects.all()
            self.stdout.write(f"Updating {users.count()} users...")

        updated_count = 0
        for user in users:
            old_tier = user.tier
            update_user_tier(user)
            user.refresh_from_db()
            
            if old_tier != user.tier:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  {user.username}: {old_tier} -> {user.tier} "
                        f"(spent: {user.total_spent})"
                    )
                )
                updated_count += 1
            else:
                self.stdout.write(f"  {user.username}: {user.tier} (no change)")

        self.stdout.write(
            self.style.SUCCESS(f'\nSuccessfully updated {updated_count} users')
        )
