# products/search_service.py
from django.conf import settings

# 1. Tạo Class Mock trước (để dùng khi lỗi)
class MockSearchService:
    def search(self, *args, **kwargs):
        return {} 
    def index_product(self, *args, **kwargs):
        pass
    def delete_product(self, *args, **kwargs):
        pass

# 2. Khởi tạo Service thật
try:
    # Di chuyển import vào trong để tránh lỗi ModuleNotFoundError làm sập server
    import meilisearch 
    
    class ProductSearchService:
        def __init__(self):
            # Kiểm tra xem settings đã có cấu hình chưa
            if not hasattr(settings, 'MEILI_HOST') or not hasattr(settings, 'MEILI_API_KEY'):
                raise ValueError("Chưa cấu hình MEILI_HOST hoặc MEILI_API_KEY trong settings.py")
                
            self.client = meilisearch.Client(settings.MEILI_HOST, settings.MEILI_API_KEY)
            self.index = self.client.index('products')
            self._configure_index()

        def _configure_index(self):
            self.index.update_settings({
                'searchableAttributes': ['name', 'category_name', 'brand', 'description', 'store_name'],
                'filterableAttributes': ['price', 'status', 'is_hidden', 'category_slug'],
                'rankingRules': [
                    'words', 'typo', 'proximity', 'attribute', 'sort', 'exactness', 'sold:desc', 'created_at:desc' 
                ]
            })

        def index_product(self, product):
            if product.status != 'approved' or product.is_hidden:
                self.delete_product(product.id)
                return

            document = {
                'id': product.id,
                'name': product.name,
                'slug': getattr(product, 'slug', ''),
                'price': float(product.discounted_price or product.original_price),
                'image': product.image.url if product.image else '', 
                'category_name': product.subcategory.category.name if product.subcategory else '',
                'category_slug': product.subcategory.category.key if product.subcategory and hasattr(product.subcategory.category, 'key') else '',
                'store_name': product.seller.store_name if product.seller else '',
                'sold': product.sold if hasattr(product, 'sold') else 0,
                'created_at': product.created_at.timestamp(),
                'status': product.status,
                'is_hidden': product.is_hidden
            }
            self.index.add_documents([document], primary_key='id')

        def delete_product(self, product_id):
            self.index.delete_document(product_id)

        def search(self, query, limit=6):
            return self.index.search(query, {
                'limit': limit,
                'filter': "status = 'approved' AND is_hidden = false",
                'attributesToHighlight': ['name'],
            })

    # Cố gắng khởi tạo
    search_service = ProductSearchService()
    print("✅ [Meilisearch] Kết nối thành công!")

except Exception as e:
    print(f"⚠️ [Meilisearch] KHÔNG HOẠT ĐỘNG. Server vẫn chạy bình thường.")
    print(f"👉 Lý do: {e}")
    # Dùng Mock để thay thế
    search_service = MockSearchService()