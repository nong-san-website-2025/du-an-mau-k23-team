from django.db import models

class Store(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='stores/', blank=True, null=True)

    def __str__(self):
        return self.name
