from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from .models import SystemConfig, SystemLog, StaticPage, StaticPageBlock
from .serializers import SystemConfigSerializer, SystemLogSerializer, StaticPageSerializer, StaticPageBlockSerializer

class SystemConfigView(APIView):
    def get(self, request):
        config, _ = SystemConfig.objects.get_or_create(id=1)
        serializer = SystemConfigSerializer(config)
        return Response(serializer.data)

    def put(self, request):
        config, _ = SystemConfig.objects.get_or_create(id=1)
        serializer = SystemConfigSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Ghi log
            SystemLog.objects.create(action="Update config", user=str(request.user))
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SystemLogsView(APIView):
    def get(self, request):
        logs = SystemLog.objects.order_by("-created_at")[:50]  # lấy 50 log gần nhất
        serializer = SystemLogSerializer(logs, many=True)
        return Response(serializer.data)


class StaticPagesView(APIView):
    """List or create static pages (admin only for write)."""
    def get(self, request):
        section = request.GET.get("section")
        qs = StaticPage.objects.all()
        if section:
            qs = qs.filter(section=section)
        serializer = StaticPageSerializer(qs, many=True)
        return Response(serializer.data)
    # Admin only for POST
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        serializer = StaticPageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaticPageDetailView(APIView):
    """Retrieve/update a static page by slug."""
    def get_permissions(self):
        # Allow public read; restrict writes to admin
        if self.request.method in ["GET"]:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get(self, request, slug):
        page = get_object_or_404(StaticPage, slug=slug)
        serializer = StaticPageSerializer(page)
        return Response(serializer.data)

    def put(self, request, slug):
        page = get_object_or_404(StaticPage, slug=slug)
        serializer = StaticPageSerializer(page, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, slug):
        page = get_object_or_404(StaticPage, slug=slug)
        serializer = StaticPageSerializer(page, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaticPageBlocksPublicView(APIView):
    """Public: list blocks for a given page slug."""
    def get(self, request, slug):
        page = get_object_or_404(StaticPage, slug=slug)
        blocks = StaticPageBlock.objects.filter(page=page).order_by("order", "id")
        serializer = StaticPageBlockSerializer(blocks, many=True)
        return Response(serializer.data)


class StaticPageBlocksAdminCreateView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, slug):
        page = get_object_or_404(StaticPage, slug=slug)
        # Limit: max 6 blocks
        current_count = StaticPageBlock.objects.filter(page=page).count()
        if current_count >= 6:
            return Response({"detail": "Tối đa 6 mục nội dung"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data["page"] = page.id
        serializer = StaticPageBlockSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaticPageBlockDetailAdminView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, id):
        block = get_object_or_404(StaticPageBlock, id=id)
        serializer = StaticPageBlockSerializer(block, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        block = get_object_or_404(StaticPageBlock, id=id)
        block.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
