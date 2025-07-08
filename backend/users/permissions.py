# permissions.py
from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Chỉ Admin mới truy cập được
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsSeller(permissions.BasePermission):
    """
    Chỉ người bán mới truy cập được
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_seller)


class IsNormalUser(permissions.BasePermission):
    """
    Chỉ người dùng thường (không phải admin, không phải seller) mới truy cập được
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and not request.user.is_superuser and not request.user.is_seller)
