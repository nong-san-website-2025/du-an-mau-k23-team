from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from .models import SearchLog
from .serializers import SearchLogSerializer
from products.models import Product, Category


@api_view(['POST'])
@permission_classes([AllowAny])
def log_search(request):
    keyword = request.data.get('keyword', '').strip()
    
    
    if request.user.is_authenticated:
        print(f"✅ User ID: {request.user.id}")
        print(f"✅ User email: {request.user.email}")
    else:
        print("❌ User is AnonymousUser")
    
    user = request.user if request.user.is_authenticated else None

    if not keyword:
        return Response({"error": "Keyword is required."}, status=400)

    log = SearchLog.objects.create(keyword=keyword, user=user)
    
    print(f"💾 Saved log - User: {log.user}, User ID: {log.user.id if log.user else None}, Keyword: {log.keyword}")
    
    return Response({
        "status": "logged", 
        "user_saved": user is not None,
        "user_id": user.id if user else None,
        "keyword": keyword
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def popular_keywords(request):
    """Trả về top 10 từ khóa phổ biến trong 7 ngày gần đây"""
    last_week = timezone.now() - timedelta(days=7)

    top_keywords = (
        SearchLog.objects.filter(created_at__gte=last_week)
        .values("keyword")
        .annotate(count=Count("keyword"))
        .order_by("-count")[:10]
    )

    return Response({
        "keywords": [item["keyword"] for item in top_keywords]
    })

# views.py
@api_view(['GET'])
@permission_classes([AllowAny])
def popular_search_items(request):
    """Trả về top 8 mục (sản phẩm + danh mục) được tìm kiếm nhiều nhất trong 7 ngày"""
    last_week = timezone.now() - timedelta(days=7)

    # Bước 1: Lấy top 20 từ khóa phổ biến
    top_keywords = (
        SearchLog.objects.filter(created_at__gte=last_week)
        .values("keyword")
        .annotate(count=Count("keyword"))
        .order_by("-count")[:20]
    )

    keyword_list = [item["keyword"] for item in top_keywords]

    results = []

    # Bước 2: Tìm sản phẩm khớp với từ khóa (ưu tiên sản phẩm)
    products = Product.objects.filter(name__in=keyword_list).only("id", "name")
    product_names = set(p.name for p in products)
    
    for product in products[:5]:  # Giới hạn 5 sản phẩm
        results.append({
            "type": "product",
            "id": product.id,
            "name": product.name,
        })

    # Bước 3: Tìm danh mục khớp với từ khóa (những từ khóa chưa dùng cho sản phẩm)
    remaining_keywords = [k for k in keyword_list if k not in product_names]
    categories = Category.objects.filter(name__in=remaining_keywords).only("id", "name")
    
    for category in categories[:3]:  # Giới hạn 3 danh mục
        results.append({
            "type": "category",
            "id": category.id,
            "name": category.name,
        })

    # Giới hạn tổng số mục trả về (tối đa 8)
    results = results[:8]

    return Response({"items": results})