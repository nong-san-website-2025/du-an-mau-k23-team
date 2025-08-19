from django.db import models
from products.models import  Product
from users.models import CustomUser
from django.db.models.signals import post_save, post_delete
from django.db.models import Avg, Count
from django.dispatch import receiver

class Review(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    rating = models.IntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['product', 'user'], name='unique_review_per_user')
        ]

@receiver([post_save, post_delete], sender=Review)
def update_product_rating(sender, instance, **kwargs):
    product = instance.product
    agg = product.reviews.aggregate(avg=Avg("rating"), count=Count("id"))
    product.rating = agg["avg"] or 0
    product.review_count = agg["count"]
    product.save()