from django.urls import path
from .views import ConversationListCreateView, MessageListCreateView

urlpatterns = [
    path('conversations/', ConversationListCreateView.as_view(), name='chat-conversations'),
    path('conversations/<int:conversation_id>/messages/', MessageListCreateView.as_view(), name='chat-messages'),
]