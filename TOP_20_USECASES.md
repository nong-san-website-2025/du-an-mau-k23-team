# 🌟 20 USECASE NỔI BẬT NHẤT CỦA HỆ THỐNG

---

## 1. 👤 ĐĂNG KÝ & ĐĂNG NHẬP
- **Đăng ký tài khoản**: Người dùng đăng ký email + mật khẩu
  - `POST /api/users/register/`
  - Output: Email xác thực được gửi
  
- **Xác thực Email**: Click link trong email để kích hoạt tài khoản
  - `POST /api/users/verify-email/<uidb64>/<token>/`
  
- **Đăng nhập**: Đăng nhập bằng email + mật khẩu
  - `POST /api/users/login/`
  - Output: JWT tokens (access + refresh)

--- 

## 2. 🛍️ BROWSE & TÌM KIẾM SẢN PHẨM
- **Xem danh sách sản phẩm**: Duyệt sản phẩm với phân trang & filters
  - `GET /api/products/`
  - Filters: category, price_min/max, search, page
  
- **Tìm kiếm sản phẩm**: Tìm kiếm sản phẩm theo tên hoặc tag
  - `GET /api/products/search/?q=keyword`
  
- **Xem chi tiết sản phẩm**: Xem tất cả thông tin + review + ratings
  - `GET /api/products/{id}/`

---

## 3. ⭐ ĐÁNH GIÁ & REVIEW
- **Viết review sản phẩm**: Viết đánh giá, rating (1-5), ảnh
  - `POST /api/products/{id}/reviews/`
  - Input: rating, content, images
  
- **Xem review**: Xem tất cả review của sản phẩm
  - `GET /api/products/{id}/reviews/`

---

## 4. 🛒 GIỎ HÀNG & THANH TOÁN
- **Thêm vào giỏ hàng**: Thêm sản phẩm vào giỏ
  - `POST /api/cart/`
  - Input: product_id, quantity
  
- **Xem giỏ hàng**: Xem danh sách sản phẩm trong giỏ
  - `GET /api/cart/`
  
- **Tạo đơn hàng**: Chuyển từ giỏ thành đơn hàng (checkout)
  - `POST /api/orders/`
  - Input: cart_items, shipping_address, payment_method
  
- **Thanh toán VNPay**: Tạo link thanh toán VNPay
  - `POST /api/payments/vnpay/`
  - Output: Redirect URL tới VNPay

---

## 5. 📦 QUẢN LÝ ĐƠN HÀNG
- **Xem danh sách đơn hàng**: Xem tất cả đơn hàng của người dùng
  - `GET /api/orders/`
  
- **Xem chi tiết đơn hàng**: Xem thông tin chi tiết + tracking
  - `GET /api/orders/{id}/`
  
- **Theo dõi đơn hàng**: Xem trạng thái vận chuyển real-time
  - `GET /api/orders/{id}/tracking/`
  
- **Confirm nhận hàng**: Xác nhận đã nhận hàng
  - `PATCH /api/orders/{id}/confirm-delivery/`

---

## 6. 💳 THANH TOÁN & VÍ ĐIỆN TỬ
- **Xem số dư ví**: Lấy số dư ví hiện tại
  - `GET /api/users/wallet/balance/`
  
- **Nạp tiền ví**: Request nạp tiền vào ví
  - `POST /api/users/wallet/deposit/`
  
- **Rút tiền ví**: Request rút tiền từ ví
  - `POST /api/users/wallet/withdraw/`
  
- **Lịch sử giao dịch**: Xem lịch sử giao dịch ví
  - `GET /api/users/wallet/history/`

---

## 7. 🏪 QUẢN LÝ CỬA HÀNG (SELLER)
- **Đăng ký bán hàng**: User bình thường nâng cấp thành seller
  - `POST /api/sellers/register/`
  - Input: shop_name, description, category
  
- **Tạo sản phẩm**: Seller tạo sản phẩm mới
  - `POST /api/products/`
  - Input: name, price, description, category, images
  
- **Xem đơn hàng mới**: Seller xem đơn hàng mới
  - `GET /api/sellers/{id}/orders/?status=pending`
  
- **Confirm ship**: Seller xác nhận gửi hàng
  - `PATCH /api/orders/{id}/confirm-ship/`

---

    ## 8. 🎁 KHUYẾN MÃI & VOUCHER
    - **Flash Sale**: Admin tạo flash sale
    - `POST /api/promotions/flashsale-admin/`
    - Input: name, discount_percent, time_range
    
    - **Tạo voucher**: Seller tạo voucher
    - `POST /api/promotions/seller/vouchers/`
    - Input: code, discount_type, usage_limit
    
    - **Claim voucher**: Khách hàng lấy voucher
    - `POST /api/promotions/vouchers/claim/`
    
    - **Áp dụng voucher**: Áp dụng vào đơn hàng
    - `POST /api/promotions/vouchers/apply/`

    ---

## 9. 📊 DASHBOARD & ANALYTICS (SELLER)
- **Tổng quan dashboard**: Xem doanh số hôm nay, đơn mới, top sản phẩm
  - `GET /api/dashboard/`
  
- **Phân tích doanh số**: Xem biểu đồ doanh thu
  - `GET /api/payments/seller/revenue_chart/`
  
- **Thống kê sản phẩm**: Xem sản phẩm bán chạy nhất
  - `GET /api/sellers/analytics/products/`

---

## 10. 💬 CHAT & HỖ TRỢ KHÁCH HÀNG
- **Tạo cuộc hội thoại**: Mở chat với seller/support
  - `POST /api/chat/conversations/`
  
- **Gửi tin nhắn**: Gửi tin nhắn trong cuộc chat
  - `POST /api/chat/conversations/{id}/messages/`
  - Input: content, images
  
- **Real-time chat**: WebSocket chat real-time
  - `ws://localhost:8000/ws/chat/conv/{conversation_id}/?token={JWT}`

---

## 11. 👥 QUẢN LÝ NGƯỜI BÁN (ADMIN)
- **Danh sách chờ phê duyệt**: Admin xem seller chờ phê duyệt
  - `GET /api/sellers/pending/`
  
- **Phê duyệt seller**: Admin phê duyệt tài khoản seller
  - `PATCH /api/sellers/{id}/approve/`
  
- **Khóa seller**: Admin khóa tài khoản seller vi phạm
  - `POST /api/sellers/{id}/lock/`

---

## 12. 📝 QUẢN LÝ SẢN PHẨM (ADMIN)
- **Sản phẩm chờ phê duyệt**: Admin xem sản phẩm chờ phê duyệt
  - `GET /api/products/?status=pending`
  
- **Phê duyệt sản phẩm**: Admin phê duyệt sản phẩm từ seller
  - `PATCH /api/products/{id}/`
  - Input: status='approved'
  
- **Bulk phê duyệt**: Phê duyệt nhiều sản phẩm cùng lúc
  - `POST /api/products/products/bulk-approve/`

---

## 13. 📈 BÁO CÁO & THỐNG KÊ (ADMIN)
- **Báo cáo doanh số**: Xem doanh số theo thời gian
  - `GET /api/orders/admin/revenue-report/`
  
- **Báo cáo khách hàng**: Xem thống kê khách hàng mới, active, inactive
  - `GET /api/users/statistics/customers/`
  
- **Báo cáo đơn hàng**: Thống kê đơn hàng, tỷ lệ hủy
  - `GET /api/orders/admin/order-statistics/`

---

## 14. 🛡️ KHIẾU Nại & COMPLAINTS
- **Tạo khiếu nại**: Người dùng/seller tạo khiếu nại
  - `POST /api/complaints/`
  - Input: order_id, reason, description, images
  
- **Xem danh sách khiếu nại**: Xem tất cả khiếu nại
  - `GET /api/complaints/`

---

## 15. 📢 THÔNG BÁO & NOTIFICATIONS
- **Danh sách thông báo**: Xem tất cả thông báo
  - `GET /api/users/notifications/`
  
- **Real-time notifications**: Server-Sent Events (SSE)
  - `GET /api/users/notifications/sse/`
  
- **Đánh dấu đã đọc**: Mark notification as read
  - `POST /api/users/notifications/{id}/mark_read/`

---

## 16. 👤 QUẢN LÝ TÀI KHOẢN
- **Xem profile**: Lấy thông tin tài khoản
  - `GET /api/users/me/`
  
- **Cập nhật profile**: Sửa tên, SĐT, avatar, ngày sinh
  - `PUT /api/users/profile/`
  
- **Quản lý địa chỉ**: Thêm, sửa, xóa địa chỉ giao hàng
  - `GET/POST/PUT/DELETE /api/users/addresses/`

---

## 17. 📰 BLOG & CONTENT
- **Xem bài blog**: Xem danh sách bài blog
  - `GET /api/blogs/`
  
- **Chi tiết blog**: Xem bài blog chi tiết
  - `GET /api/blogs/{id}/`
  
- **Like & comment**: Like bài blog, viết comment
  - `POST /api/blogs/likes/`
  - `POST /api/blogs/comments/`

---

## 18. ❤️ WISHLIST
- **Thêm vào yêu thích**: Thêm sản phẩm vào wishlist
  - `POST /api/wishlist/`
  
- **Xem wishlist**: Xem danh sách sản phẩm yêu thích
  - `GET /api/wishlist/`

---

## 19. 🔐 QUẢN LÝ MẬT KHẨU
- **Quên mật khẩu**: Gửi email reset mật khẩu
  - `POST /api/users/password-reset/`
  
- **Reset mật khẩu**: Click link email, đặt mật khẩu mới
  - `POST /api/users/password-reset-confirm/<uidb64>/<token>/`

---

## 20. 🏅 FOLLOW & FOLLOWERS
- **Follow cửa hàng**: Follow một seller
  - `POST /api/sellers/{id}/follow/`
  
- **Danh sách follow**: Xem cửa hàng đang follow
  - `GET /api/sellers/my/following/`

---

## 📊 THỐNG KÊ NHANH

| Số TT | Usecase | Vai Trò | Tần Số |
|---|---|---|---|
| 1-3 | Authentication | Tất cả | Cao |
| 4-6 | Products | Khách hàng | Cao |
| 7-9 | Orders | Khách hàng | Cao |
| 10-11 | Payments | Khách hàng | Trung bình |
| 12-13 | Seller Management | Seller | Cao |
| 14-15 | Admin | Admin | Trung bình |
| 16-17 | Support | Khách hàng | Trung bình |
| 18-20 | Others | Tất cả | Thấp |

---

**🎯 Core Flow:**
1. Đăng ký/Đăng nhập → 2. Tìm sản phẩm → 3. Thêm giỏ → 4. Thanh toán → 5. Confirm hàng

**👨‍💼 Seller Flow:**
1. Đăng ký bán → 2. Tạo sản phẩm → 3. Xem đơn mới → 4. Confirm ship → 5. Xem doanh số

**🛡️ Admin Flow:**
1. Phê duyệt seller → 2. Phê duyệt sản phẩm → 3. Xem báo cáo → 4. Quản lý khiếu nại

