from django.core.management.base import BaseCommand
from django.db import transaction
from orders.models import Order
from promotions.models import VoucherUsage
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Migrate dữ liệu từ Order.voucher và Order.discount_amount sang bảng VoucherUsage'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Chỉ xem preview, không lưu vào DB'
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        
        self.stdout.write(self.style.SUCCESS('🔍 Đang quét các đơn hàng có voucher...'))
        
        # Tìm tất cả order có voucher và discount_amount
        orders_with_voucher = Order.objects.filter(
            voucher__isnull=False,
            discount_amount__gt=0
        ).select_related('user', 'voucher')
        
        count = orders_with_voucher.count()
        self.stdout.write(f'📊 Tìm thấy {count} đơn hàng có voucher\n')
        
        if count == 0:
            self.stdout.write(self.style.WARNING('✅ Không có đơn hàng nào cần migrate'))
            return
        
        # Đếm xem bao nhiêu đã tồn tại
        existing_count = VoucherUsage.objects.filter(
            order__in=orders_with_voucher
        ).count()
        
        self.stdout.write(f'⚠️ Đã có {existing_count} bản ghi VoucherUsage')
        
        migrated = 0
        skipped = 0
        errors = []
        
        for order in orders_with_voucher:
            try:
                # Kiểm tra xem đã tồn tại chưa
                existing = VoucherUsage.objects.filter(order=order).exists()
                if existing:
                    skipped += 1
                    self.stdout.write(f'⏭️  Order #{order.id}: Đã tồn tại, bỏ qua')
                    continue
                
                if not dry_run:
                    VoucherUsage.objects.create(
                        user=order.user,
                        voucher=order.voucher,
                        order=order,
                        discount_amount=order.discount_amount
                    )
                
                migrated += 1
                discount_str = f"{order.discount_amount:,.0f}đ"
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Order #{order.id}: {order.user.username} - {order.voucher.code} ({discount_str})'
                    )
                )
            except Exception as e:
                errors.append(f"Order #{order.id}: {str(e)}")
                self.stdout.write(self.style.ERROR(f'❌ Order #{order.id}: {str(e)}'))
        
        # Tóm tắt
        self.stdout.write('\n' + '='*60)
        self.stdout.write('📈 KẾT QUẢ MIGRATE')
        self.stdout.write('='*60)
        self.stdout.write(self.style.SUCCESS(f'✅ Đã migrate: {migrated} bản ghi'))
        self.stdout.write(self.style.WARNING(f'⏭️  Đã bỏ qua: {skipped} bản ghi'))
        
        if errors:
            self.stdout.write(self.style.ERROR(f'❌ Lỗi: {len(errors)} bản ghi'))
            for err in errors:
                self.stdout.write(f'   {err}')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    '\n⚠️  DRY-RUN MODE: Không có dữ liệu nào được lưu. '
                    'Chạy lại mà không có --dry-run để thực hiện migrate.'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✨ Hoàn thành! {migrated} bản ghi VoucherUsage đã được tạo.'
                )
            )
