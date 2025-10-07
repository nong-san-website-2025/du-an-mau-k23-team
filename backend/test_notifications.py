"""
Script để test Order & Review notifications
Chạy: python manage.py shell < test_notifications.py
"""

print("=" * 60)
print("🧪 TEST ORDER & REVIEW NOTIFICATIONS")
print("=" * 60)

from orders.models import Order
from reviews.models import Review, ReviewReply
from users.models import CustomUser

# ============================================
# TEST 1: ORDER STATUS CHANGE
# ============================================
print("\n📦 TEST 1: Order Status Change")
print("-" * 60)

try:
    # Lấy đơn hàng đầu tiên
    order = Order.objects.first()
    
    if order:
        print(f"✅ Found Order #{order.id}")
        print(f"   User: {order.user.username if order.user else 'N/A'}")
        print(f"   Current Status: {order.status}")
        
        # Lưu old status
        old_status = order.status
        
        # Thay đổi status
        if order.status == 'pending':
            order.status = 'shipping'
        elif order.status == 'shipping':
            order.status = 'delivered'
        else:
            order.status = 'shipping'
        
        order.save()
        
        print(f"   ✅ Status changed: {old_status} → {order.status}")
        print(f"   📢 Notification sent to user #{order.user.id if order.user else 'N/A'}")
        print(f"   💡 Check frontend - notification should appear instantly!")
    else:
        print("❌ No orders found. Create an order first.")
        
except Exception as e:
    print(f"❌ Error: {e}")

# ============================================
# TEST 2: REVIEW REPLY
# ============================================
print("\n💬 TEST 2: Review Reply Notification")
print("-" * 60)

try:
    # Lấy review đầu tiên
    review = Review.objects.first()
    
    if review:
        print(f"✅ Found Review #{review.id}")
        print(f"   Reviewer: {review.user.username}")
        print(f"   Product: {review.product.name if review.product else 'N/A'}")
        print(f"   Rating: {review.rating}⭐")
        
        # Lấy shop user (admin hoặc staff)
        shop_user = CustomUser.objects.filter(is_staff=True).first()
        
        if shop_user:
            # Tạo reply
            reply = ReviewReply.objects.create(
                review=review,
                user=shop_user,
                reply_text=f"Cảm ơn bạn đã đánh giá {review.rating} sao! Chúng tôi rất vui khi bạn hài lòng với sản phẩm."
            )
            
            print(f"   ✅ Reply created by {shop_user.username}")
            print(f"   📢 Notification sent to reviewer #{review.user.id}")
            print(f"   💡 Check frontend - notification should appear instantly!")
        else:
            print("❌ No shop user found. Create a staff user first.")
    else:
        print("❌ No reviews found. Create a review first.")
        
except Exception as e:
    print(f"❌ Error: {e}")

# ============================================
# TEST 3: MULTIPLE STATUS CHANGES
# ============================================
print("\n🔄 TEST 3: Multiple Status Changes")
print("-" * 60)

try:
    orders = Order.objects.all()[:3]  # Lấy 3 đơn đầu
    
    if orders:
        print(f"✅ Found {len(orders)} orders")
        
        for order in orders:
            old_status = order.status
            
            # Cycle through statuses
            status_cycle = {
                'pending': 'shipping',
                'shipping': 'delivered',
                'delivered': 'success',
                'success': 'pending',
            }
            
            new_status = status_cycle.get(order.status, 'shipping')
            order.status = new_status
            order.save()
            
            print(f"   Order #{order.id}: {old_status} → {new_status} ✅")
        
        print(f"   📢 {len(orders)} notifications sent!")
        print(f"   💡 Check frontend - all notifications should appear!")
    else:
        print("❌ No orders found.")
        
except Exception as e:
    print(f"❌ Error: {e}")

# ============================================
# SUMMARY
# ============================================
print("\n" + "=" * 60)
print("✅ TEST COMPLETED!")
print("=" * 60)
print("\n📋 Next steps:")
print("1. Open frontend in browser")
print("2. Check notification icon (bell)")
print("3. You should see new notifications with badges")
print("4. Click bell to view notifications")
print("5. Badge should disappear after clicking")
print("\n💡 Tips:")
print("- Open browser Console to see SSE events")
print("- Open Network tab → Filter 'EventStream' to see SSE connection")
print("- Notifications should appear in < 100ms")
print("\n🎉 Happy testing!")
print("=" * 60)