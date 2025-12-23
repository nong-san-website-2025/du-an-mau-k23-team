from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Preorder
from ..serializers import PreOrderSerializer

class PreorderDeleteView(generics.DestroyAPIView):
    queryset = Preorder.objects.all()
    serializer_class = PreOrderSerializer
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        preorder_id = kwargs.get("pk")
        preorder = Preorder.objects.filter(id=preorder_id, user=request.user).first()
        if not preorder:
            return Response({"error": "Không tìm thấy đơn đặt trước"}, status=404)
        preorder.delete()
        return Response({"message": "Xóa đặt trước thành công"}, status=204)

class PreorderListCreateView(generics.ListCreateAPIView):
    queryset = Preorder.objects.all()
    serializer_class = PreOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Preorder.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        product = self.request.data.get("product")
        quantity = int(self.request.data.get("quantity", 1))
        preorder, created = Preorder.objects.get_or_create(
            user=self.request.user, product_id=product, defaults={"quantity": quantity}
        )
        if not created:
            preorder.quantity += quantity
            preorder.save()
        return preorder

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        preorder = self.perform_create(serializer)
        output_serializer = PreOrderSerializer(preorder, context=self.get_serializer_context())
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context