from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Set password for customer accounts in a numeric range (default 11-20)."

    def add_arguments(self, parser):
        parser.add_argument('--start', type=int, default=11, help='Start index, inclusive')
        parser.add_argument('--end', type=int, default=20, help='End index, inclusive')
        parser.add_argument('--password', type=str, default='123456', help='New password to set')

    def handle(self, *args, **options):
        User = get_user_model()
        start = options.get('start', 11)
        end = options.get('end', 20)
        password = options.get('password', '123456')

        for i in range(start, end + 1):
            username = f"customer{i}"
            try:
                u = User.objects.get(username=username)
                u.set_password(password)
                u.save()
                self.stdout.write(self.style.SUCCESS(f"{username} -> password updated"))
            except User.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"{username} -> not found"))
