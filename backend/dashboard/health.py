# ✅ API Health Check Endpoints
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """✅ API Health Check - Check if backend is running"""
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return Response({
            'status': 'healthy',
            'message': 'API is running',
            'database': 'connected'
        })
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'message': str(e),
            'database': 'error'
        }, status=503)


@api_view(['GET'])
@permission_classes([AllowAny])
def api_endpoints(request):
    """List all available API endpoints"""
    endpoints = {
        'health': '/api/health/',
        'dashboard': '/api/dashboard/',
        'orders': {
            'list': '/api/orders/',
            'admin_list': '/api/orders/admin-list/',
            'admin_list_alt': '/api/orders/admin_list/',
        },
        'users': {
            'list': '/api/users/list/',
            'roles': '/api/users/roles/list/',
        },
        'products': {
            'list': '/api/products/',
        }
    }
    return Response(endpoints)
