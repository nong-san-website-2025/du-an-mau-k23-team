"""
Django Signals for Review Reply notifications
Automatically send SSE notifications when shop replies to reviews
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ReviewReply
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=ReviewReply)
def send_review_reply_notification(sender, instance, created, **kwargs):
    """
    Send SSE notification when shop replies to a review
    Notification is sent to the original reviewer
    """
    if not created:
        return  # Only notify on new replies
    
    # Import here to avoid circular import
    from users.views import send_notification_to_user
    
    # Get the original review and reviewer
    review = instance.review
    if not review or not review.user:
        return
    
    reviewer_id = review.user.id
    replier_username = instance.user.username if instance.user else "Shop"
    product_name = review.product.name if review.product else "sản phẩm"
    
    # Don't send notification if user replies to their own review
    if instance.user and instance.user.id == reviewer_id:
        return
    
    title = '💬 Phản hồi đánh giá'
    message = f'{replier_username} đã trả lời đánh giá của bạn'
    detail = f'Về sản phẩm: {product_name}'
    reply_preview = instance.reply_text[:100] + '...' if len(instance.reply_text) > 100 else instance.reply_text
    
    notification_data = {
        'type': 'review_reply',
        'title': title,
        'message': message,
        'detail': detail,
        'review_id': review.id,
        'reply_id': instance.id,
        'product_id': review.product.id if review.product else None,
        'product_name': product_name,
        'replier': replier_username,
        'reply_text': reply_preview,
        'timestamp': instance.created_at.isoformat() if instance.created_at else None,
    }
    
    try:
        # Save to database
        from django.apps import apps
        Notification = apps.get_model('users', 'Notification')
        CustomUser = apps.get_model('users', 'CustomUser')
        
        reviewer_user = CustomUser.objects.get(id=reviewer_id)
        Notification.objects.create(
            user=reviewer_user,
            type='review_reply',
            title=title,
            message=message,
            detail=f'{detail}\nPhản hồi: {reply_preview}',
            metadata={
                'review_id': review.id,
                'reply_id': instance.id,
                'product_id': review.product.id if review.product else None,
                'product_name': product_name,
                'replier': replier_username,
            }
        )
        
        # Send via SSE
        send_notification_to_user(reviewer_id, notification_data)
        logger.info(f"Sent review reply notification to user {reviewer_id} for review {review.id}")
    except Exception as e:
        logger.error(f"Failed to send review reply notification: {e}")


@receiver(post_save, sender=ReviewReply)
def send_review_reply_to_seller(sender, instance, created, **kwargs):
    """
    Send notification to seller when someone replies to reviews on their products
    (e.g., when customer replies back to seller's response)
    """
    if not created:
        return
    
    from users.views import send_notification_to_user
    
    review = instance.review
    if not review or not review.product:
        return
    
    product = review.product
    seller = getattr(product, 'seller', None)
    
    if not seller or not seller.user:
        return
    
    seller_user_id = seller.user.id
    replier_username = instance.user.username if instance.user else "Khách hàng"
    
    # Don't send notification if seller replies to their own product's review
    if instance.user and instance.user.id == seller_user_id:
        return
    
    title = '💬 Phản hồi mới'
    message = f'{replier_username} đã phản hồi đánh giá'
    detail = f'Sản phẩm: {product.name}'
    reply_preview = instance.reply_text[:100] + '...' if len(instance.reply_text) > 100 else instance.reply_text
    
    notification_data = {
        'type': 'review_reply_seller',
        'title': title,
        'message': message,
        'detail': detail,
        'review_id': review.id,
        'reply_id': instance.id,
        'product_id': product.id,
        'product_name': product.name,
        'replier': replier_username,
        'reply_text': reply_preview,
        'timestamp': instance.created_at.isoformat() if instance.created_at else None,
    }
    
    try:
        # Save to database
        from django.apps import apps
        Notification = apps.get_model('users', 'Notification')
        
        Notification.objects.create(
            user=seller.user,
            type='review_reply',
            title=title,
            message=message,
            detail=f'{detail}\nPhản hồi: {reply_preview}',
            metadata={
                'review_id': review.id,
                'reply_id': instance.id,
                'product_id': product.id,
                'product_name': product.name,
                'replier': replier_username,
            }
        )
        
        # Send via SSE
        send_notification_to_user(seller_user_id, notification_data)
        logger.info(f"Sent review reply notification to seller {seller_user_id} for review {review.id}")
    except Exception as e:
        logger.error(f"Failed to send seller review reply notification: {e}")