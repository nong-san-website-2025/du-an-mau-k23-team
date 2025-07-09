from chat.models import Message
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from chat.serializers import MessageSerializer  # cần serializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_history(request, room_name):
    messages = Message.objects.filter(room=room_name).order_by('timestamp')
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)
