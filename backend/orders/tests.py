from decimal import Decimal

from django.test import TestCase

from orders.models import Order
from payments.models import Payment
from users.models import CustomUser


class OrderPaymentSignalTests(TestCase):
    """Verify that order completion automatically synchronizes payments."""

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="buyer",
            email="buyer@example.com",
            password="testpassword123",
        )

    def test_payment_created_when_order_created_in_completed_status(self):
        """Creating a completed order should generate a success payment."""
        order = Order.objects.create(
            user=self.user,
            total_price=Decimal("500000"),
            status="completed",
        )

        payment = Payment.objects.get(order=order)
        self.assertEqual(payment.amount, Decimal("500000"))
        self.assertEqual(payment.status, "success")

    def test_payment_created_when_status_transitions_to_completed(self):
        """Transitioning an order into a completed status should create payment."""
        order = Order.objects.create(
            user=self.user,
            total_price=Decimal("0"),
            status="pending",
        )
        self.assertFalse(Payment.objects.filter(order=order).exists())

        order.total_price = Decimal("250000")
        order.status = "completed"
        order.save()

        payment = Payment.objects.get(order=order)
        self.assertEqual(payment.amount, Decimal("250000"))
        self.assertEqual(payment.status, "success")

    def test_payment_amount_updates_when_completed_order_total_changes(self):
        """When a completed order changes total, the payment amount should sync."""
        order = Order.objects.create(
            user=self.user,
            total_price=Decimal("100000"),
            status="completed",
        )
        payment = Payment.objects.get(order=order)
        self.assertEqual(payment.amount, Decimal("100000"))

        order.total_price = Decimal("150000")
        order.save()

        payment.refresh_from_db()
        self.assertEqual(payment.amount, Decimal("150000"))
        self.assertEqual(payment.status, "success")
