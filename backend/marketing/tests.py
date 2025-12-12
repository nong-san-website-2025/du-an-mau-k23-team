# apps/marketing/tests.py
from django.test import TestCase
from django.utils import timezone
from .models import Voucher, VoucherUsage
from django.contrib.auth import get_user_model

User = get_user_model()

class VoucherTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="test", password="123")
        self.voucher = Voucher.objects.create(
            code="TEST10",
            name="Test Voucher",
            discount_type="percent",
            value=10,
            min_order_value=50,
            start_at=timezone.now(),
            end_at=timezone.now() + timezone.timedelta(days=1),
            per_user_limit=1
        )

    def test_voucher_valid(self):
        self.assertEqual(self.voucher.code, "TEST10")
        self.assertTrue(self.voucher.is_active)
