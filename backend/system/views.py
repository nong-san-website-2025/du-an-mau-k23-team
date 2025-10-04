from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import SystemConfig, SystemLog
from .serializers import SystemConfigSerializer, SystemLogSerializer

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
