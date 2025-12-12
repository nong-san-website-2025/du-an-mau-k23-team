# apps/marketing/permissions.py
from rest_framework.permissions import BasePermission

class IsMarketingAdmin(BasePermission):
    """
    Chỉ cho phép những user có role marketing hoặc superuser
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_superuser or request.user.groups.filter(name="marketing").exists())
        )
