from django.db import models

class Message(models.Model):
    room = models.CharField(max_length=255)
    sender = models.CharField(max_length=255)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)