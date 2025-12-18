from django.conf import settings
import logging
import time

logger = logging.getLogger(__name__)

# ---------------------------------------------------------
# 1. Mock Service (Dùng khi không có Meilisearch hoặc lỗi lib)
# ---------------------------------------------------------
class MockSearchService:
    def search(self, *args, **kwargs):
        # Trả về cấu trúc rỗng chuẩn để Frontend không bị crash
        return {'hits': [], 'estimatedTotalHits': 0, 'processingTimeMs': 0}
    
    def index_product(self, *args, **kwargs):
        pass
    
    def delete_product(self, *args, **kwargs):
        pass

    def initialize_settings(self):
        logger.warning("⚠️ Đang dùng Mock Service, không thể cấu hình Index.")
        pass

# ---------------------------------------------------------
# 2. Real Service (Meilisearch Implementation)
# ---------------------------------------------------------
try:
    import meilisearch
    
    class ProductSearchService:
        def __init__(self):
            if not hasattr(settings, 'MEILI_HOST') or not hasattr(settings, 'MEILI_API_KEY'):
                raise ValueError("Thiếu cấu hình MEILI_HOST hoặc MEILI_API_KEY trong settings.py")
            
            # Init Client với Timeout để tránh treo App
            self.client = meilisearch.Client(
                settings.MEILI_HOST, 
                settings.MEILI_API_KEY,
                timeout=5 # Timeout 5 giây
            )
            self.index = self.client.index('products')

        def initialize_settings(self):
            """
            🚀 QUAN TRỌNG: Cấu hình Index để Search nhanh & Fix lỗi Filter.
            Chạy hàm này thông qua lệnh sync_products.
            """
            try:
                logger.info("⚙️ Đang cập nhật Settings cho Meilisearch...")

                # 1. Filterable (Cho phép lọc - Fix lỗi 'invalid_search_filter')
                self.index.update_filterable_attributes([
                    'status',
                    'is_hidden',
                    'price',
                    'category_slug',
                    'rating',
                    'store_name',
                    'brand'
                ])

                # 2. Sortable (Cho phép sắp xếp)
                self.index.update_sortable_attributes([
                    'price',
                    'created_at',
                    'sold'
                ])

                # 3. Searchable (Chỉ tìm trong các trường này - Tối ưu tốc độ)
                self.index.update_searchable_attributes([
                    'name',          # Quan trọng nhất
                    'category_name', 
                    'store_name',
                    'brand'
                ])

                # 4. Ranking Rules (Tùy chọn nâng cao - để mặc định cũng tốt)
                # self.index.update_ranking_rules([...])

                logger.info("✅ [Meilisearch] Settings Updated Successfully!")
            except Exception as e:
                logger.error(f"⚠️ [Meilisearch] Settings Update Failed: {e}")

        def index_product(self, product):
            """
            Đẩy 1 sản phẩm lên Meilisearch
            """
            # Nếu sản phẩm bị ẩn hoặc chưa duyệt, xóa khỏi index
            if product.status != 'approved' or product.is_hidden:
                self.delete_product(product.id)
                return

            try:
                # Logic tính giá
                price = float(product.discounted_price or product.original_price)
                original_price = float(product.original_price)
                has_discount = price < original_price
                discount_rate = int(((original_price - price) / original_price) * 100) if has_discount else 0

                document = {
                    'id': product.id,
                    'name': product.name,
                    'category_name': product.subcategory.category.name if product.subcategory else '',
                    'store_name': product.seller.store_name if product.seller else '',
                    'brand': getattr(product, 'brand', ''),
                    
                    # Fields for Filter/Sort
                    'price': price,
                    'sold': product.sold if hasattr(product, 'sold') else 0,
                    'created_at': product.created_at.timestamp(),
                    'rating': getattr(product, 'rating_avg', 0),
                    'category_slug': product.subcategory.category.key if product.subcategory else '',
                    
                    # Fields for Display (Payload)
                    'slug': getattr(product, 'slug', ''),
                    'image': product.image.url if product.image else '',
                    'original_price': original_price if has_discount else 0,
                    'discount_rate': discount_rate,
                    'status': product.status,
                    'is_hidden': product.is_hidden
                }
                
                # Update document
                self.index.add_documents([document], primary_key='id')
            except Exception as e:
                logger.error(f"⚠️ Lỗi khi index product {product.id}: {e}")

        def delete_product(self, product_id):
            try:
                self.index.delete_document(product_id)
            except Exception as e:
                # Lỗi xóa không quan trọng lắm, log warning thôi
                logger.warning(f"⚠️ Không thể xóa document {product_id}: {e}")

        def search(self, query, limit=20, offset=0, filter_query=None, sort=None):
            search_params = {
                'limit': limit,
                'offset': offset,
                'filter': ["status = 'approved'", "is_hidden = false"],
                
                # Chỉ lấy các trường cần thiết để hiển thị Card Product
                'attributesToRetrieve': [
                    'id', 'name', 'slug', 'image', 
                    'price', 'original_price', 'discount_rate',
                    'store_name', 'rating', 'sold', 'category_name'
                ],
                # 'attributesToHighlight': ['name'] # Bật nếu muốn highlight chữ
            }
            
            # Xử lý dynamic filter
            if filter_query:
                if isinstance(filter_query, list):
                    search_params['filter'].extend(filter_query)
                else:
                    search_params['filter'].append(filter_query)

            if sort:
                search_params['sort'] = sort

            # Đo hiệu năng
            start_time = time.time() 
            try:
                result = self.index.search(query, search_params)
            except Exception as e:
                logger.error(f"⚠️ Search Error: {e}")
                return {'hits': [], 'estimatedTotalHits': 0}
            
            duration = (time.time() - start_time) * 1000
            
            # Log nếu quá chậm (>100ms)
            if duration > 100:
                logger.warning(f"⏱️ Slow Query '{query}': {duration:.2f} ms")
            
            return result

    # Singleton Instance
    search_service = ProductSearchService()

except ImportError:
    logger.error("⚠️ Thư viện 'meilisearch' chưa được cài đặt. Đang dùng Mock Service.")
    search_service = MockSearchService()
except Exception as e:
    logger.error(f"⚠️ [Meilisearch] Init Error: {e}")
    search_service = MockSearchService()