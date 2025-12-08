"""
User points management views
Handles adding and redeeming user loyalty points
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..serializers import UserSerializer


class UserPointsView(APIView):
    """
    Manage user loyalty points
    - POST: Add points
    - PATCH: Redeem/deduct points
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Add points to user account
        Request body: {"points": <amount>}
        """
        try:
            change = int(request.data.get("points", 0))
        except (ValueError, TypeError):
            return Response({"error": "Điểm không hợp lệ"}, status=400)

        request.user.points += change
        request.user.save()
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        """
        Redeem/deduct points from user account
        Request body: {"points": <amount>}
        Amount must be positive and user must have sufficient points
        """
        try:
            change = int(request.data.get("points", 0))
        except (ValueError, TypeError):
            return Response({"error": "Điểm không hợp lệ"}, status=400)

        if change < 0:
            return Response({"error": "Điểm cần giảm phải dương"}, status=400)

        if request.user.points >= change:
            request.user.points -= change
            request.user.save()
            return Response(UserSerializer(request.user).data)
        
        return Response({"error": "Không đủ điểm"}, status=400)