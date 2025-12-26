"""
Admin views
Handles admin operations: user management, dashboard, statistics, roles
"""

from datetime import timedelta
from django.apps import apps
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Q
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from ..serializers import (
    UserSerializer,
    EmployeeSerializer,
    RoleSerializer,
)
from ..permissions import IsAdmin
from delivery.services.ghn import GHNClient

# Import models through apps
CustomUser = apps.get_model('users', 'CustomUser')
Role = apps.get_model('users', 'Role')
Address = apps.get_model('users', 'Address')
PointHistory = apps.get_model('users', 'PointHistory')
Seller = apps.get_model('sellers', 'Seller')
Store = apps.get_model('store', 'Store')
Product = apps.get_model('products', 'Product')
Order = apps.get_model('orders', 'Order')

User = get_user_model()


# -------------------- USER MANAGEMENT --------------------

class UserListView(APIView):
    """
    List all users for admin
    GET /api/users/list/
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        users = CustomUser.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


@method_decorator(csrf_exempt, name="dispatch")
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for basic user CRUD operations
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete user only if they have no activity in the system
        """
        instance = self.get_object()

        # Check if user has any activity
        has_activity = (
            Seller.objects.filter(user=instance).exists()
            or Store.objects.filter(owner=instance).exists()
            or Order.all_objects.filter(user=instance).exists()
            or Product.objects.filter(seller__user=instance).exists()
            or PointHistory.objects.filter(user=instance).exists()
            or Address.objects.filter(user=instance).exists()
        )

        if has_activity:
            return Response(
                {"detail": "Không thể xoá user này vì đã có hoạt động trong hệ thống."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    Admin user management ViewSet
    Full CRUD operations on users for admins
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def list(self, request, *args, **kwargs):
        """List all users with debug info"""
        queryset = self.get_queryset()
        print("DEBUG USERS:", list(queryset.values("id", "username", "role__name", "is_active")))
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        """Create new user"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """Update user - prevent admin from changing their own role"""
        user_id = self.kwargs.get('pk')
        user_obj = self.get_object()
        
        # Check if trying to change own role
        if request.user.id == user_id and 'role_id' in request.data:
            # Check if user is admin
            if request.user.is_admin:
                return Response(
                    {"detail": "Admin không thể tự thay đổi vai trò của bản thân"},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Partial update user - prevent admin from changing their own role"""
        user_id = self.kwargs.get('pk')
        user_obj = self.get_object()
        
        # Check if trying to change own role
        if request.user.id == user_id and 'role_id' in request.data:
            # Check if user is admin
            if request.user.is_admin:
                return Response(
                    {"detail": "Admin không thể tự thay đổi vai trò của bản thân"},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        return super().partial_update(request, *args, **kwargs)


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def toggle_user_active(request, pk):
    """
    Toggle user active status
    """
    try:
        user = CustomUser.objects.get(pk=pk)
    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    user.is_active = not user.is_active
    user.save()
    return Response({"id": user.id, "is_active": user.is_active})


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_user(request, pk):
    """
    Delete user if they have no orders or stores
    """
    try:
        user = CustomUser.objects.get(pk=pk)
    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    # Check if user has orders
    if Order.all_objects.filter(user=user).exists():
        return Response(
            {"error": "Người dùng đã phát sinh đơn hàng, không thể xóa."},
            status=400
        )

    # Check if user has stores
    if Store.objects.filter(owner=user).exists():
        return Response(
            {"error": "Người dùng đã đăng ký cửa hàng, không thể xóa."},
            status=400
        )

    user.delete()
    return Response(status=204)


# -------------------- DASHBOARD & STATISTICS --------------------

class DashboardAPIView(APIView):
    """
    Admin dashboard statistics
    Returns overview metrics for the system
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Basic totals
        total_users = CustomUser.objects.count()
        total_products = Product.objects.count()
        total_orders = Order.objects.count()

        # Total revenue from successful orders
        total_revenue = (
            Order.objects.filter(status="success")
            .aggregate(Sum("total_price"))["total_price__sum"] or 0
        )

        # Seller statistics
        active_sellers = CustomUser.objects.filter(
            role__name="seller", 
            is_active=True
        ).count()
        pending_sellers = CustomUser.objects.filter(
            role__name="seller", 
            is_active=False
        ).count()

        # Top selling products
        top_products = (
            Product.objects.annotate(sales=Count("order_items"))
            .order_by("-sales")[:5]
        )
        top_products_data = [
            {"name": product.name, "sales": product.sales} 
            for product in top_products
        ]

        return Response({
            "total_users": total_users,
            "total_products": total_products,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "active_sellers": active_sellers,
            "pending_sellers": pending_sellers,
            "top_products": top_products_data,
        })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def customer_statistics_report(request):
    """
    Customer statistics report for admin
    Returns detailed customer metrics and segmentation
    """
    # Get customers (exclude admin, seller, staff)
    customers = User.objects.filter(
        role__name='customer'
    ).exclude(
        Q(is_staff=True) | Q(is_superuser=True)
    )
    
    total_customers = customers.count()
    
    # New customers in last 30 days
    thirty_days_ago = timezone.now() - timedelta(days=30)
    new_customers = customers.filter(date_joined__gte=thirty_days_ago).count()
    
    # Returning customers (more than 1 order)
    returning_customers_ids = Order.objects.values('user').annotate(
        order_count=Count('id')
    ).filter(order_count__gt=1).values_list('user', flat=True)
    returning_customers = customers.filter(id__in=returning_customers_ids).count()
    
    # Retention rate
    retention_rate = round(
        (returning_customers / total_customers * 100), 1
    ) if total_customers > 0 else 0
    
    # Top customers by spending
    top_customers = customers.annotate(
        order_count=Count('orders')
    ).filter(
        order_count__gt=0
    ).order_by('-total_spent')[:10]
    
    top_customers_data = [
        {
            'name': customer.get_full_name() or customer.username,
            'email': customer.email,
            'orders': customer.order_count,
            'spent': float(customer.total_spent or 0),
        }
        for customer in top_customers
    ]
    
    # Customer segmentation
    vip_count = customers.filter(total_spent__gte=10000000).count()
    
    # Geographic distribution based on successful orders
    successful_orders = Order.objects.filter(
        status__in=['delivered', 'completed']
    ).select_related('user')
    
    # Get province distribution from successful orders
    province_count = {}
    for order in successful_orders:
        try:
            # Lấy province_id từ order (ưu tiên) hoặc từ địa chỉ mặc định của user
            province_id = order.province_id
            
            if not province_id:
                # Fallback: lấy từ địa chỉ mặc định nếu order cũ chưa có province_id
                default_address = Address.objects.filter(
                    user=order.user, 
                    is_default=True
                ).first()
                
                if default_address and default_address.province_id:
                    province_id = default_address.province_id
            
            if province_id:
                province_count[province_id] = province_count.get(province_id, 0) + 1
        except Exception:
            continue
    
    # Get province names from GHN
    geo_distribution = []
    if province_count:
        try:
            provinces_res = GHNClient.get_provinces()
            if provinces_res.get('success') and provinces_res.get('data'):
                province_map = {
                    p['ProvinceID']: p['ProvinceName'] 
                    for p in provinces_res['data']
                }
                
                for province_id, count in province_count.items():
                    province_name = province_map.get(province_id, f'Province {province_id}')
                    geo_distribution.append({
                        'city': province_name,
                        'count': count
                    })
                
                # Sort by count descending
                geo_distribution.sort(key=lambda x: x['count'], reverse=True)
        except Exception:
            pass
    
    return Response({
        'summary': {
            'total': total_customers,
            'newCustomers': new_customers,
            'returningCustomers': returning_customers,
            'retentionRate': retention_rate,
            'avgRepeatDays': 28,
        },
        'topCustomers': top_customers_data,
        'geoDistribution': geo_distribution,
        'segmentationData': [
            {'segment': 'Khách mới', 'value': new_customers},
            {'segment': 'Khách quay lại', 'value': returning_customers},
            {'segment': 'VIP', 'value': vip_count},
            {'segment': 'Không hoạt động', 'value': total_customers - new_customers - returning_customers},
        ],
    })


# -------------------- ROLES --------------------

class RoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for role management
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]


class RoleCreateView(APIView):
    """
    Create new role
    """
    def post(self, request):
        serializer = RoleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class RoleListView(ListAPIView):
    """
    List all roles (public access)
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [AllowAny]


# -------------------- EMPLOYEES --------------------

class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for employee management
    Only accessible by admins
    """
    queryset = CustomUser.objects.filter(role__name="employee")
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


# -------------------- PERMISSION VERIFICATION --------------------

class VerifyAdminView(APIView):
    """
    Verify if current user is admin
    Returns role and admin status
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        is_admin = user.is_superuser or getattr(user, "is_admin", False)
        return Response({
            "is_admin": is_admin,
            "username": user.username,
            "email": user.email,
            "role": "admin" if is_admin else (
                "seller" if getattr(user, "is_seller", False) else "user"
            ),
        })