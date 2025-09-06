# backend/app/views.py
from rest_framework import viewsets
from .models import Complaint, ComplaintMedia
from .serializers import ComplaintSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all().order_by('-created_at')
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]  # 👈 đảm bảo chỉ user login mới gửi complaint

    def create(self, request, *args, **kwargs):
        files = request.FILES.getlist('media')
        complaint = Complaint.objects.create(
            user=request.user,
            product_id=request.data['product'],
            reason=request.data['reason'],
            # status mặc định là pending
        )
        for f in files:
            ComplaintMedia.objects.create(complaint=complaint, file=f)
        serializer = self.get_serializer(complaint)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        # Không cần dùng nữa, đã custom create
        pass