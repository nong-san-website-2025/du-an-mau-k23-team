# products/management/commands/sync_products.py
from django.core.management.base import BaseCommand
from products.models import Product
from products.search_service import search_service

class Command(BaseCommand):
    help = 'Đẩy toàn bộ sản phẩm lên Meilisearch Cloud'

    def handle(self, *args, **kwargs):
        self.stdout.write("Bắt đầu đồng bộ...")
        
        # Lấy tất cả sản phẩm Active
        products = Product.objects.filter(status='approved', is_hidden=False)
        total = products.count()
        
        count = 0
        for product in products:
            try:
                # Gọi hàm index đã viết trong service
                # Lưu ý: Cần sửa lại logic lấy ảnh trong service một chút nếu chạy command line
                # (vì command line không có request để build absolute uri)
                # Tạm thời bạn có thể để đường dẫn tương đối
                
                # Mock object image url string cho đơn giản trong ví dụ này
                if product.image:
                     # Đảm bảo logic lấy url string ở đây khớp với frontend
                     pass 

                search_service.index_product(product)
                count += 1
                if count % 10 == 0:
                    self.stdout.write(f"Đã sync {count}/{total}...")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Lỗi SP ID {product.id}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS(f"Xong! Đã đẩy {count} sản phẩm lên Cloud."))