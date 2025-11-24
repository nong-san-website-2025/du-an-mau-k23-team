# 📋 TẤT CẢ USECASE CỦA HỆ THỐNG

## 🏗️ KIẾN TRÚC HỆ THỐNG
**Backend**: Django REST Framework + WebSocket (Channels) + PostgreSQL/MySQL  
**Frontend**: React + Vite + React Router  
**Mobile**: Ionic + React  
**Payment**: VNPay Integration  
**Real-time**: WebSocket Chat  

---

## 1️⃣ AUTHENTICATION & USER MANAGEMENT

### 1.1 Đăng Ký & Xác Thực
- **Đăng ký tài khoản**: Người dùng (khách hàng, người bán) đăng ký tài khoản mới
  - Input: email, mật khẩu, tên người dùng, số điện thoại
  - Output: Tài khoản được tạo, gửi email xác thực
  
- **Xác thực Email**: Người dùng xác thực email qua link trong email
  - Endpoint: `POST /api/users/verify-email/<uidb64>/<token>/`
  - Output: Tài khoản được kích hoạt
    
- **Đăng nhập**: Đăng nhập bằng email/username + mật khẩu
  - Endpoint: `POST /api/users/login/`
  - Output: JWT tokens (access + refresh)
  
- **Đăng xuất**: Logout khỏi hệ thống
  - Endpoint: `POST /api/users/logout/`
  
- **Refresh Token**: Lấy access token mới bằng refresh token
  - Endpoint: `POST /api/token/refresh/`

### 1.2 Quản Lý Mật Khẩu
- **Yêu cầu đặt lại mật khẩu**: Gửi email reset mật khẩu
  - Endpoint: `POST /api/users/password-reset/`
  - Input: email
  
- **Xác nhận đặt lại mật khẩu**: Xác nhận link từ email, đặt mật khẩu mới
  - Endpoint: `POST /api/users/password-reset-confirm/<uidb64>/<token>/`
  - Input: new_password, new_password_confirm

### 1.3 Social Authentication
- **Đăng nhập Google**: OAuth2 Google login
  - Endpoint: `POST /api/users/auth/google/`
  
- **Đăng nhập Facebook**: OAuth2 Facebook login
  - Endpoint: `POST /api/users/auth/facebook/`

---

## 2️⃣ USER PROFILE & ACCOUNT MANAGEMENT

### 2.1 Thông Tin Cá Nhân
- **Xem profile hiện tại**: Lấy thông tin tài khoản của người dùng
  - Endpoint: `GET /api/users/me/`
  - Output: User info, email, phone, avatar
  
- **Cập nhật profile**: Cập nhật tên, số điện thoại, avatar, đơn vị chỉnh sửa
  - Endpoint: `PUT /api/users/profile/`
  - Input: name, phone, avatar, birth_date, gender, bio
  
- **Tải ảnh đại diện**: Upload avatar mới
  - Endpoint: `POST /api/users/upload-avatar/`
  - Input: avatar file

### 2.2 Thay Đổi Email/Phone
- **Yêu cầu thay đổi email**: Gửi email xác nhận cho email mới
  - Endpoint: `PATCH /api/users/profile/`
  - Input: new_email
  
- **Xác nhận thay đổi email**: Xác nhận link từ email
  - Endpoint: `POST /api/users/confirm-email-change/<uidb64>/<token>/`
  
- **Yêu cầu thay đổi SĐT**: Gửi OTP qua email
  - Input: new_phone
  
- **Xác nhận thay đổi SĐT**: Xác nhận OTP
  - Endpoint: `POST /api/users/confirm-phone-change/`
  - Input: otp

### 2.3 Quản Lý Địa Chỉ
- **Xem danh sách địa chỉ**: Lấy tất cả địa chỉ của người dùng
  - Endpoint: `GET /api/users/addresses/`
  
- **Tạo địa chỉ mới**: Thêm địa chỉ giao hàng
  - Endpoint: `POST /api/users/addresses/`
  - Input: address, city, district, ward, phone, receiver_name, is_default
  
- **Cập nhật địa chỉ**: Sửa địa chỉ
  - Endpoint: `PUT /api/users/addresses/{id}/`
  
- **Xóa địa chỉ**: Xóa địa chỉ
  - Endpoint: `DELETE /api/users/addresses/{id}/`
  
- **Đặt địa chỉ mặc định**: Chọn địa chỉ mặc định
  - Endpoint: `PATCH /api/users/addresses/{id}/set_default/`

---

## 3️⃣ PRODUCTS & CATEGORIES

### 3.1 Xem Sản Phẩm
- **Danh sách sản phẩm**: Lấy danh sách sản phẩm với phân trang
  - Endpoint: `GET /api/products/`
  - Filters: category, price_min, price_max, search, page
  
- **Chi tiết sản phẩm**: Xem thông tin chi tiết sản phẩm
  - Endpoint: `GET /api/products/{id}/`
  - Output: name, description, price, images, reviews, ratings
  
- **Sản phẩm mới**: Lấy sản phẩm mới nhất
  - Endpoint: `GET /api/products/new-products/`
  
- **Best sellers**: Lấy sản phẩm bán chạy nhất
  - Endpoint: `GET /api/products/best-sellers/`
  
- **Sản phẩm nổi bật**: Lấy sản phẩm đặc sắc
  - Endpoint: `GET /api/products/featured-categories/`
  
- **Sản phẩm sắp ra mắt**: Xem sản phẩm coming soon
  - Endpoint: `/products/coming-soon`

### 3.2 Danh Mục & Thể Loại
- **Danh sách danh mục**: Lấy tất cả danh mục
  - Endpoint: `GET /api/products/categories/`
  
- **Danh mục con**: Lấy danh mục con theo danh mục cha
  - Endpoint: `GET /api/products/subcategories/`
  
- **Sản phẩm theo danh mục con**: Lấy sản phẩm của một danh mục con
  - Endpoint: `GET /api/products/subcategories/{id}/products/`

### 3.3 Tìm Kiếm Sản Phẩm
- **Tìm kiếm**: Tìm kiếm sản phẩm theo tên, mô tả, tag
  - Endpoint: `GET /api/products/search/`
  - Input: q (query string)

### 3.4 Quản Lý Sản Phẩm (Người Bán)
- **Danh sách sản phẩm của tôi**: Xem sản phẩm mà người bán tạo
  - Endpoint: `GET /api/products/my-products/simple/`
  
- **Tạo sản phẩm**: Người bán tạo sản phẩm mới
  - Endpoint: `POST /api/products/`
  - Input: name, description, price, category, images
  
- **Cập nhật sản phẩm**: Cập nhật thông tin sản phẩm
  - Endpoint: `PUT /api/products/{id}/`
  
- **Xóa sản phẩm**: Xóa sản phẩm
  - Endpoint: `DELETE /api/products/{id}/`
  
- **Upload ảnh sản phẩm**: Tải ảnh sản phẩm
  - Endpoint: `POST /api/products/{id}/images/`
  
- **Xóa ảnh sản phẩm**: Xóa ảnh sản phẩm
  - Endpoint: `DELETE /api/products/images/{id}/`

### 3.5 Quản Lý Sản Phẩm (Admin)
- **Phê duyệt sản phẩm**: Phê duyệt sản phẩm mới từ người bán
  - Endpoint: `PATCH /api/products/{id}/`
  - Input: status = 'approved'
  
- **Bulk phê duyệt**: Phê duyệt nhiều sản phẩm cùng lúc
  - Endpoint: `POST /api/products/products/bulk-approve/`
  
- **Quản lý danh mục**: Thêm, sửa, xóa danh mục
  - Endpoint: `POST/PUT/DELETE /api/products/categories/`

---

## 4️⃣ REVIEWS & RATINGS

### 4.1 Xem Review
- **Danh sách review sản phẩm**: Xem tất cả review của một sản phẩm
  - Endpoint: `GET /api/products/{id}/reviews/`
  
- **Lọc review**: Lọc theo rating, helpful, most recent

### 4.2 Viết Review
- **Tạo review**: Khách hàng viết đánh giá/comment sản phẩm
  - Endpoint: `POST /api/products/{id}/reviews/`
  - Input: rating (1-5), content, images
  
- **Cập nhật review**: Sửa review đã viết
  - Endpoint: `PUT /api/reviews/{id}/`
  
- **Xóa review**: Xóa review
  - Endpoint: `DELETE /api/reviews/{id}/`

### 4.3 Tương Tác Review
- **Like review**: Đánh dấu review hữu ích
  - Endpoint: `POST /api/blogs/likes/`
  
- **Bookmark review**: Lưu review
  - Endpoint: `POST /api/blogs/bookmarks/`

---

## 5️⃣ CART & CHECKOUT

### 5.1 Giỏ Hàng
- **Xem giỏ hàng**: Lấy danh sách sản phẩm trong giỏ
  - Endpoint: `GET /api/cart/`
  
- **Thêm vào giỏ**: Thêm sản phẩm vào giỏ
  - Endpoint: `POST /api/cart/`
  - Input: product_id, quantity
  
- **Cập nhật giỏ**: Thay đổi số lượng sản phẩm
  - Endpoint: `PUT /api/cart/{id}/`
  - Input: quantity
  
- **Xóa khỏi giỏ**: Xóa sản phẩm khỏi giỏ
  - Endpoint: `DELETE /api/cart/{id}/`
  
- **Xóa toàn bộ giỏ**: Clear tất cả giỏ hàng
  - Endpoint: `DELETE /api/cart/`

### 5.2 Checkout & Thanh Toán
- **Tạo đơn hàng**: Chuyển từ giỏ thành đơn hàng
  - Endpoint: `POST /api/orders/`
  - Input: cart_items, shipping_address, payment_method, notes
  
- **Tính phí vận chuyển**: Tính phí ship động
  - Endpoint: `/api/shipping/estimate/`
  - Input: address, weight, dimensions
  
- **Thanh toán VNPay**: Tạo link thanh toán VNPay
  - Endpoint: `POST /api/payments/vnpay/`
  - Input: order_id, amount
  - Output: redirect URL
  
- **Callback VNPay**: Xử lý callback từ VNPay
  - Endpoint: `POST /api/payments/vnpay/callback/`

---

## 6️⃣ ORDERS & DELIVERY

### 6.1 Quản Lý Đơn Hàng (Khách Hàng)
- **Danh sách đơn hàng**: Xem tất cả đơn hàng của người dùng
  - Endpoint: `GET /api/orders/`
  - Filters: status, date_range
  
- **Chi tiết đơn hàng**: Xem chi tiết đơn hàng
  - Endpoint: `GET /api/orders/{id}/`
  
- **Hủy đơn hàng**: Hủy đơn hàng
  - Endpoint: `PATCH /api/orders/{id}/cancel/`
  - Conditions: Chỉ hủy được khi status = 'pending'
  
- **Confirm nhận hàng**: Xác nhận đã nhận hàng
  - Endpoint: `PATCH /api/orders/{id}/confirm-delivery/`
  
- **Theo dõi đơn hàng**: Xem trạng thái vận chuyển
  - Endpoint: `GET /api/orders/{id}/tracking/`

### 6.2 Quản Lý Đơn Hàng (Người Bán)
- **Đơn hàng mới**: Xem đơn hàng mới
  - Page: `/seller-center/orders/new`
  
- **Đơn hàng đang xử lý**: Xem đơn hàng đang xử lý
  - Page: `/seller-center/orders/processing`
  
- **Đơn hàng đã giao**: Xem đơn hàng đã giao thành công
  - Page: `/seller-center/orders/delivered`
  
- **Đơn hàng bị hủy**: Xem đơn hàng bị hủy
  - Page: `/seller-center/orders/cancelled`
  
- **Confirm ship**: Xác nhận gửi hàng
  - Endpoint: `PATCH /api/orders/{id}/confirm-ship/`
  
- **Tạo GHN order**: Tích hợp tạo đơn vận chuyển GHN
  - Endpoint: `POST /api/delivery/create-ghn-order/`

### 6.3 Vận Chuyển (Delivery)
- **Lấy danh sách địa chỉ giao hàng**: Các điểm giao hàng
  - Endpoint: `GET /api/delivery/provinces/`
  
- **Tính phí giao hàng**: Tính phí ship từ GHN
  - Endpoint: `POST /api/delivery/calculate-fee/`
  - Input: from_district, to_district, weight
  
- **Cập nhật trạng thái giao hàng**: Update status từ GHN
  - Endpoint: `POST /api/delivery/update-status/`

---

## 7️⃣ PAYMENTS & WALLET

### 7.1 Ví Điện Tử (Wallet)
- **Xem số dư ví**: Lấy số dư ví hiện tại
  - Endpoint: `GET /api/users/wallet/balance/`
  
- **Lịch sử giao dịch**: Xem lịch sử giao dịch ví
  - Endpoint: `GET /api/users/wallet/history/`
  - Filters: type, date_range
  
- **Nạp tiền ví**: Request nạp tiền vào ví
  - Endpoint: `POST /api/users/wallet/deposit/`
  - Input: amount
  
- **Rút tiền ví**: Request rút tiền từ ví
  - Endpoint: `POST /api/users/wallet/withdraw/`
  - Input: amount, bank_account
  
- **Hủy yêu cầu rút tiền**: Hủy request rút tiền
  - Endpoint: `PATCH /api/payments/requests/{id}/reject/`

### 7.2 Quản Lý Ví (Admin)
- **Danh sách yêu cầu nạp tiền**: Xem tất cả request nạp
  - Endpoint: `GET /api/wallet/requests/`
  
- **Phê duyệt nạp tiền**: Phê duyệt request nạp
  - Endpoint: `POST /api/wallet/requests/{id}/approve/`
  
- **Từ chối nạp tiền**: Từ chối request nạp
  - Endpoint: `POST /api/wallet/requests/{id}/reject/`
  
- **Thống kê ví**: Xem thống kê ví
  - Endpoint: `GET /api/wallet/admin/stats/`
  
- **Danh sách yêu cầu rút tiền**: Xem tất cả request rút
  - Endpoint: `GET /api/payments/withdraw-requests/`
  
- **Phê duyệt rút tiền**: Phê duyệt rút tiền
  - Endpoint: `POST /api/payments/withdraw-requests/{id}/approve/`
  
- **Từ chối rút tiền**: Từ chối rút tiền
  - Endpoint: `POST /api/payments/withdraw-requests/{id}/reject/`

### 7.3 Giao Dịch Thanh Toán
- **Danh sách giao dịch**: Xem tất cả giao dịch
  - Endpoint: `GET /api/payments/transactions/`
  
- **Chi tiết giao dịch**: Xem chi tiết giao dịch
  - Endpoint: `GET /api/payments/transactions/{id}/`
  
- **Hoàn tiền**: Hoàn lại tiền cho khách hàng
  - Endpoint: `POST /api/payments/refund/`
  - Input: order_id, reason

---

## 8️⃣ PROMOTIONS & VOUCHERS

### 8.1 Flash Sales
- **Danh sách Flash Sale**: Xem các Flash Sale hiện tại
  - Endpoint: `GET /api/promotions/flash-sales/`
  
- **Chi tiết Flash Sale**: Xem chi tiết Flash Sale
  - Endpoint: `GET /api/promotions/flash-sales/{id}/`
  
- **Quản lý Flash Sale (Admin)**: Tạo, sửa, xóa Flash Sale
  - Endpoint: `POST/PUT/DELETE /api/promotions/flashsale-admin/`
  - Input: name, discount_percent, start_time, end_time, max_quantity

### 8.2 Vouchers
- **Danh sách voucher**: Xem tất cả voucher khả dụng
  - Endpoint: `GET /api/promotions/vouchers/`
  
- **Voucher của tôi**: Xem voucher đã lưu
  - Endpoint: `GET /api/promotions/vouchers/my_vouchers/`
  
- **Lấy voucher**: Claim voucher
  - Endpoint: `POST /api/promotions/vouchers/claim/`
  - Input: voucher_id
  
- **Áp dụng voucher**: Áp dụng voucher vào đơn hàng
  - Endpoint: `POST /api/promotions/vouchers/apply/`
  - Input: order_id, voucher_code
  
- **Sử dụng voucher**: Consume voucher sau khi thanh toán
  - Endpoint: `POST /api/promotions/vouchers/consume/`
  
- **Voucher công khai**: Xem voucher công khai của seller
  - Endpoint: `GET /api/promotions/vouchers/public/{seller_id}/`
  
- **Quản lý voucher (Seller)**: Tạo, sửa, xóa voucher
  - Endpoint: `POST/PUT/DELETE /api/promotions/seller/vouchers/`
  - Input: code, discount_type, discount_value, usage_limit

### 8.3 Tổng Quan Khuyến Mãi
- **Overview**: Xem tổng quan khuyến mãi
  - Endpoint: `GET /api/promotions/overview/`

---

## 9️⃣ SELLERS & STORES

### 9.1 Thông Tin Cửa Hàng
- **Danh sách cửa hàng**: Xem danh sách cửa hàng
  - Endpoint: `GET /api/sellers/`
  
- **Chi tiết cửa hàng**: Xem thông tin cửa hàng
  - Endpoint: `GET /api/sellers/{id}/`
  
- **Sản phẩm của cửa hàng**: Xem sản phẩm của cửa hàng
  - Endpoint: `GET /api/sellers/{id}/products/`
  
- **Đơn hàng của cửa hàng**: Xem đơn hàng của cửa hàng (seller only)
  - Endpoint: `GET /api/sellers/{id}/orders/`
  
- **Lịch hoạt động**: Xem lịch hoạt động cửa hàng
  - Endpoint: `GET /api/sellers/activity/{id}/`

### 9.2 Đăng Ký Người Bán
- **Đăng ký bán hàng**: Tài khoản người dùng nâng cấp thành người bán
  - Endpoint: `POST /api/sellers/register/`
  - Input: shop_name, description, category
  
- **Xác nhận người bán**: Admin phê duyệt đơn xin bán hàng
  - Endpoint: `PATCH /api/sellers/{id}/approve/`
  
- **Từ chối người bán**: Admin từ chối đơn xin bán hàng
  - Endpoint: `PATCH /api/sellers/{id}/reject/`

### 9.3 Quản Lý Cửa Hàng (Seller)
- **Thông tin cửa hàng của tôi**: Xem thông tin cửa hàng
  - Endpoint: `GET /api/sellers/me/`
  
- **Cập nhật cửa hàng**: Cập nhật thông tin cửa hàng
  - Endpoint: `PUT /api/sellers/shops/{id}/`
  - Input: name, description, logo, banner, phone, email, address
  
- **Kích hoạt cửa hàng**: Kích hoạt cửa hàng
  - Endpoint: `POST /api/sellers/activate/`

### 9.4 Follow/Followers
- **Các cửa hàng theo dõi**: Xem cửa hàng mà người dùng follow
  - Endpoint: `GET /api/sellers/my/following/`
  
- **Followers**: Xem những người follow cửa hàng
  - Endpoint: `GET /api/sellers/my/followers/`
  
- **Follow cửa hàng**: Follow một cửa hàng
  - Endpoint: `POST /api/sellers/{id}/follow/`

### 9.5 Quản Lý Seller (Admin)
- **Danh sách người bán pending**: Xem danh sách người bán chờ phê duyệt
  - Endpoint: `GET /api/sellers/pending/`
  
- **Danh sách người bán phê duyệt**: Xem danh sách người bán đã phê duyệt
  - Endpoint: `GET /api/sellers/group/approved/`
  
- **Danh sách người bán bị khóa**: Xem danh sách người bán bị khóa
  - Endpoint: `GET /api/sellers/group/locked/`
  
- **Khóa người bán**: Khóa tài khoản người bán
  - Endpoint: `POST /api/sellers/{id}/lock/`

---

## 🔟 SELLER DASHBOARD & ANALYTICS

### 10.1 Dashboard Seller
- **Tổng quan**: Xem tổng quan hoạt động
  - Page: `/seller-center/dashboard`
  - Hiển thị: Doanh số hôm nay, tổng doanh số, số đơn mới, top sản phẩm
  
- **Tài chính**: Xem thông tin tài chính
  - Endpoint: `GET /api/payments/seller/finance/`
  - Output: Revenue, pending balance, withdrawn, available balance
  
- **Biểu đồ doanh thu**: Xem biểu đồ doanh thu
  - Endpoint: `GET /api/payments/seller/revenue_chart/`

### 10.2 Analytics
- **Overview analytics**: Xem tổng quan thống kê
  - Endpoint: `GET /api/sellers/analytics/overview/`
  
- **Sales analytics**: Phân tích doanh số
  - Endpoint: `GET /api/sellers/analytics/sales/`
  
- **Products analytics**: Phân tích sản phẩm
  - Endpoint: `GET /api/sellers/analytics/products/`
  
- **Traffic analytics**: Phân tích lưu lượng
  - Endpoint: `GET /api/sellers/analytics/traffic/`

### 10.3 Finance Seller
- **Số dư ví**: Xem số dư ví
  - Endpoint: `GET /api/payments/wallet/balance/`
  
- **Yêu cầu rút tiền**: Request rút tiền
  - Endpoint: `POST /api/payments/withdraw/request/`
  - Input: amount, bank_account
  
- **Lịch sử rút tiền**: Xem lịch sử rút tiền
  - Endpoint: `GET /api/payments/withdraw/history/`
  
- **Danh sách yêu cầu rút**: Xem danh sách request rút
  - Endpoint: `GET /api/payments/withdraw/requests/`

---

## 1️⃣1️⃣ COMPLAINTS & SUPPORT

### 11.1 Khiếu Nại
- **Tạo khiếu nại**: Người dùng/seller tạo khiếu nại
  - Endpoint: `POST /api/complaints/`
  - Input: order_id, reason, description, images
  
- **Danh sách khiếu nại**: Xem danh sách khiếu nại
  - Endpoint: `GET /api/complaints/`
  
- **Chi tiết khiếu nại**: Xem chi tiết khiếu nại
  - Endpoint: `GET /api/complaints/{id}/`
  
- **Cập nhật khiếu nại**: Cập nhật khiếu nại
  - Endpoint: `PUT /api/complaints/{id}/`
  
- **Xóa khiếu nại**: Xóa khiếu nại
  - Endpoint: `DELETE /api/complaints/{id}/`

### 11.2 Quản Lý Khiếu Nại (Admin)
- **Khiếu nại từ người dùng**: Xem khiếu nại từ người dùng
  - Page: `/admin/complaints/user-reports`
  
- **Phê duyệt khiếu nại**: Phê duyệt/từ chối khiếu nại
  - Endpoint: `PATCH /api/complaints/{id}/approve/`
  
- **Từ chối khiếu nại**: Từ chối khiếu nại
  - Endpoint: `PATCH /api/complaints/{id}/reject/`

### 11.3 Chat Support
- **Danh sách cuộc hội thoại**: Xem danh sách cuộc chat
  - Endpoint: `GET /api/chat/conversations/`
  
- **Tạo cuộc hội thoại**: Tạo cuộc chat mới
  - Endpoint: `POST /api/chat/conversations/`
  - Input: other_user_id
  
- **Chi tiết cuộc hội thoại**: Xem chi tiết cuộc chat
  - Endpoint: `GET /api/chat/conversations/{id}/`
  
- **Gửi tin nhắn**: Gửi tin nhắn
  - Endpoint: `POST /api/chat/conversations/{id}/messages/`
  - Input: content, images
  
- **Lịch sử tin nhắn**: Xem lịch sử tin nhắn
  - Endpoint: `GET /api/chat/conversations/{id}/messages/`
  
- **WebSocket Chat**: Real-time chat qua WebSocket
  - WebSocket URL: `ws://localhost:8000/ws/chat/conv/{conversation_id}/?token={JWT}`

---

## 1️⃣2️⃣ BLOGS & CONTENT

### 12.1 Blog
- **Danh sách blog**: Xem danh sách bài blog
  - Endpoint: `GET /api/blogs/`
  - Page: `/blog`
  
- **Chi tiết blog**: Xem chi tiết bài blog
  - Endpoint: `GET /api/blogs/{id}/`
  - Page: `/blog/{slug}`
  
- **Danh mục blog**: Xem danh mục blog
  - Endpoint: `GET /api/blogs/categories/`
  
- **Bài blog nổi bật**: Xem bài blog nổi bật
  - Page: `/` (Featured Blogs section)

### 12.2 Quản Lý Blog (Admin)
- **Tạo blog**: Tạo bài blog mới
  - Endpoint: `POST /api/admin/blogs/`
  - Input: title, slug, content, category, images, tags
  
- **Sửa blog**: Cập nhật bài blog
  - Endpoint: `PUT /api/admin/blogs/{id}/`
  
- **Xóa blog**: Xóa bài blog
  - Endpoint: `DELETE /api/admin/blogs/{id}/`
  
- **Publish blog**: Công bố bài blog
  - Endpoint: `PATCH /api/admin/blogs/{id}/publish/`

### 12.3 Tương Tác Blog
- **Like bài blog**: Like bài blog
  - Endpoint: `POST /api/blogs/likes/`
  - Input: blog_id
  
- **Bỏ like bài blog**: Bỏ like bài blog
  - Endpoint: `DELETE /api/blogs/likes/{id}/`
  
- **Bookmark bài blog**: Lưu bài blog
  - Endpoint: `POST /api/blogs/bookmarks/`
  - Input: blog_id
  
- **Comment bài blog**: Viết comment bài blog
  - Endpoint: `POST /api/blogs/comments/`
  - Input: blog_id, content
  
- **Reply comment**: Trả lời comment
  - Endpoint: `POST /api/blogs/comments/{id}/reply/`

---

## 1️⃣3️⃣ NOTIFICATIONS

### 13.1 Thông Báo
- **Danh sách thông báo**: Xem danh sách thông báo
  - Endpoint: `GET /api/users/notifications/`
  - Filters: read, type, date_range
  
- **Chi tiết thông báo**: Xem chi tiết thông báo
  - Endpoint: `GET /api/users/notifications/{id}/`
  
- **Đánh dấu đã đọc**: Đánh dấu thông báo đã đọc
  - Endpoint: `POST /api/users/notifications/{id}/mark_read/`
  
- **Đánh dấu tất cả đã đọc**: Đánh dấu tất cả thông báo đã đọc
  - Endpoint: `POST /api/users/notifications/mark_all_read/`
  
- **Số lượng chưa đọc**: Lấy số lượng thông báo chưa đọc
  - Endpoint: `GET /api/users/notifications/unread_count/`

### 13.2 Server-Sent Events (SSE)
- **Nhận thông báo real-time**: Kết nối SSE để nhận thông báo real-time
  - Endpoint: `GET /api/users/notifications/sse/`

### 13.3 Quản Lý Thông Báo (Admin)
- **Gửi thông báo**: Gửi thông báo cho người dùng
  - Endpoint: `POST /api/users/notifications/trigger/`
  - Input: user_id/group_id, message, title, type
  
- **Danh sách thông báo**: Xem tất cả thông báo được gửi
  - Endpoint: `GET /api/marketing/notifications/`
  
- **Tạo thông báo**: Tạo thông báo mới để gửi
  - Endpoint: `POST /api/marketing/notifications/`

---

## 1️⃣4️⃣ ADMIN DASHBOARD

### 14.1 Dashboard Admin
- **Tổng quan**: Xem tổng quan hệ thống
  - Endpoint: `GET /api/dashboard/`
  - Hiển thị: Total users, total orders, total revenue, new users
  
- **Thống kê khách hàng**: Thống kê khách hàng
  - Endpoint: `GET /api/users/statistics/customers/`

### 14.2 Quản Lý Users
- **Danh sách người dùng**: Xem tất cả người dùng
  - Endpoint: `GET /api/users/users/`
  - Page: `/admin/users`
  
- **Chi tiết người dùng**: Xem chi tiết người dùng
  - Endpoint: `GET /api/users/users/{id}/`
  
- **Tạo người dùng**: Tạo tài khoản người dùng
  - Endpoint: `POST /api/users/users/`
  
- **Sửa người dùng**: Cập nhật thông tin người dùng
  - Endpoint: `PUT /api/users/users/{id}/`
  
- **Xóa người dùng**: Xóa tài khoản người dùng
  - Endpoint: `DELETE /api/users/users/{id}/`
  
- **Bật/tắt người dùng**: Kích hoạt/vô hiệu hóa tài khoản
  - Endpoint: `POST /api/users/toggle-active/{id}/`

### 14.3 Quản Lý Người Bán
- **Danh sách người bán**: Xem tất cả người bán
  - Endpoint: `GET /api/sellers/`
  - Page: `/admin/sellers/pending`
  
- **Người bán chờ phê duyệt**: Xem người bán chờ
  - Page: `/admin/sellers/approval`
  
- **Người bán đã phê duyệt**: Xem người bán đã phê duyệt
  - Page: `/admin/sellers/business`
  
- **Phê duyệt người bán**: Phê duyệt tài khoản seller
  - Endpoint: `POST /api/sellers/{id}/approve/`
  
- **Từ chối người bán**: Từ chối tài khoản seller
  - Endpoint: `POST /api/sellers/{id}/reject/`

### 14.4 Quản Lý Sản Phẩm
- **Danh sách sản phẩm**: Xem tất cả sản phẩm
  - Endpoint: `GET /api/products/`
  - Page: `/admin/products`
  
- **Sản phẩm chờ phê duyệt**: Xem sản phẩm chờ phê duyệt
  - Page: `/admin/products/approval`
  
- **Phê duyệt sản phẩm**: Phê duyệt sản phẩm
  - Endpoint: `PATCH /api/products/{id}/approve/`
  
- **Quản lý danh mục**: Quản lý danh mục sản phẩm
  - Page: `/admin/products/categories`
  - Endpoint: `GET/POST/PUT/DELETE /api/products/categories/`

### 14.5 Quản Lý Đơn Hàng
- **Danh sách đơn hàng**: Xem tất cả đơn hàng
  - Endpoint: `GET /api/orders/`
  - Page: `/admin/orders`
  
- **Báo cáo doanh số**: Xem báo cáo doanh số
  - Endpoint: `GET /api/orders/admin/revenue-report/`
  - Page: `/admin/reports/revenue`
  
- **Thống kê đơn hàng**: Xem thống kê đơn hàng
  - Endpoint: `GET /api/orders/admin/order-statistics/`

### 14.6 Marketing & Promotions
- **Quản lý Banner**: Tạo, sửa, xóa banner
  - Page: `/admin/marketing/banners`
  - Endpoint: `GET/POST/PUT/DELETE /api/marketing/banners/`
  
- **Flash Sales**: Quản lý flash sale
  - Page: `/admin/promotions/flashsale`
  - Endpoint: `GET/POST/PUT/DELETE /api/promotions/flashsale-admin/`
  
- **Vouchers**: Quản lý voucher
  - Page: `/admin/vouchers`
  - Endpoint: `GET/POST/PUT/DELETE /api/promotions/vouchers/`
  
- **Coupons**: Quản lý coupon
  - Page: `/admin/promotions/coupons`

### 14.7 Báo Cáo & Thống Kê
- **Báo cáo tổng quát**: Xem báo cáo tổng quát
  - Page: `/admin/reports`
  
- **Báo cáo doanh số**: Xem doanh số theo thời gian
  - Page: `/admin/reports/revenue`
  - Endpoint: `GET /api/orders/admin/revenue-report/`
  
- **Báo cáo sản phẩm**: Xem thống kê sản phẩm
  - Page: `/admin/reports/products`
  
- **Báo cáo tỷ lệ hủy**: Xem tỷ lệ hủy đơn
  - Page: `/admin/reports/cancel-rate`
  
- **Báo cáo khách hàng**: Xem thống kê khách hàng
  - Page: `/admin/reports/customers`
  - Endpoint: `GET /api/users/statistics/customers/`
  
- **Báo cáo nông sản**: Xem báo cáo nông sản
  - Page: `/admin/reports/agriculture`
  - Endpoint: `GET /api/sellers/report/agriculture/`

### 14.8 Cài Đặt Admin
- **Cài đặt vận chuyển**: Quản lý cài đặt vận chuyển
  - Page: `/admin/settings/shipping`
  
- **Cài đặt chính sách trả hàng**: Quản lý chính sách trả hàng
  - Page: `/admin/settings/return-policy`
  
- **Cài đặt marketing**: Cài đặt tự động hóa marketing
  - Page: `/admin/settings/marketing`
  
- **Cài đặt loyalty**: Cài đặt chương trình loyalty
  - Page: `/admin/settings/loyalty`
  
- **Cài đặt theme**: Cài đặt giao diện
  - Page: `/admin/settings/theme`

---

## 1️⃣5️⃣ SYSTEM & SETTINGS

### 15.1 Quản Lý Hệ Thống
- **Cài đặt hệ thống**: Quản lý cài đặt hệ thống
  - Endpoint: `GET/PUT /api/system-settings/`
  
- **Nhật ký hoạt động**: Xem nhật ký hoạt động hệ thống
  - Endpoint: `GET /api/system/logs/`
  
- **Quản lý vai trò**: Tạo, sửa, xóa vai trò
  - Endpoint: `GET/POST/PUT/DELETE /api/users/roles/`
  
- **Quản lý nhân viên**: Quản lý nhân viên admin
  - Endpoint: `GET/POST/PUT/DELETE /api/users/employees/`

### 15.2 Cấu Hình Hệ Thống
- **Cài đặt email**: Cài đặt email SMTP
  - Endpoint: `GET/PUT /api/system-settings/email/`
  
- **Cài đặt thanh toán**: Cài đặt cổng thanh toán
  - Endpoint: `GET/PUT /api/system-settings/payment/`
  
- **Cài đặt vận chuyển**: Cài đặt dịch vụ vận chuyển
  - Endpoint: `GET/PUT /api/system-settings/shipping/`

---

## 1️⃣6️⃣ SEARCH & DISCOVERY

### 16.1 Tìm Kiếm
- **Tìm kiếm sản phẩm**: Tìm kiếm toàn cầu
  - Endpoint: `GET /api/search/`
  - Page: `/search/?q=keyword`
  - Filters: category, price, rating, seller

### 16.2 Khám Phá
- **Sản phẩm nổi bật**: Xem sản phẩm nổi bật
  - Page: `/featured`
  
- **Sản phẩm mới**: Xem sản phẩm mới nhất
  - Page: `/products/new`
  
- **Best sellers**: Xem sản phẩm bán chạy
  - Endpoint: `GET /api/products/best-sellers/`
  
- **Top products**: Xem top sản phẩm
  - Endpoint: `GET /api/products/top-products/`

---

## 1️⃣7️⃣ USER PREFERENCES & WISHLISTS

### 17.1 Wishlist
- **Danh sách yêu thích**: Xem sản phẩm yêu thích
  - Endpoint: `GET /api/wishlist/`
  - Page: `/wishlist`
  
- **Thêm vào yêu thích**: Thêm sản phẩm vào wishlist
  - Endpoint: `POST /api/wishlist/`
  - Input: product_id
  
- **Xóa khỏi yêu thích**: Xóa sản phẩm khỏi wishlist
  - Endpoint: `DELETE /api/wishlist/{id}/`

### 17.2 Điểm Loyalty
- **Xem điểm**: Xem số điểm loyalty
  - Endpoint: `GET /api/users/points/`
  
- **Cập nhật điểm**: Admin cập nhật điểm người dùng
  - Endpoint: `PATCH /api/users/points/`
  - Input: user_id, points, reason

---

## 1️⃣8️⃣ CONTENT PAGES

### 18.1 Static Pages
- **Trang chủ**: Trang chủ chính
  - Page: `/`
  
- **Hướng dẫn mua hàng**: Hướng dẫn mua hàng
  - Page: `/buying-guide`
  
- **Chính sách bảo hành**: Chính sách bảo hành
  - Page: `/warrantypolicy`
  
- **Chính sách trả hàng**: Chính sách trả hàng
  - Page: `/returnpolicy`
  
- **Liên hệ hỗ trợ**: Trang liên hệ hỗ trợ
  - Page: `/contactsupport`
  
- **An toàn chính thức**: Thông tin an toàn
  - Page: `/primarysecurity`
  
- **Tuyển dụng**: Trang tuyển dụng
  - Page: `/recruitment`
  
- **Điều khoản dịch vụ**: Điều khoản dịch vụ
  - Page: `/terms-of-service`
  
- **Giới thiệu**: Giới thiệu trang web
  - Page: `/about`
  
- **Hướng dẫn bán hàng**: Hướng dẫn bán hàng
  - Page: `/selling-guide`

---

## 1️⃣9️⃣ PRE-ORDERS & SPECIAL FEATURES

### 19.1 Pre-Orders
- **Danh sách pre-order**: Xem sản phẩm pre-order
  - Endpoint: `GET /api/products/preorders/`
  - Page: `/preorders`
  
- **Đặt pre-order**: Đặt hàng trước
  - Endpoint: `POST /api/orders/preorders/`
  - Input: product_id, quantity, estimated_delivery_date
  
- **Hủy pre-order**: Hủy đơn đặt trước
  - Endpoint: `DELETE /api/orders/preorders/{id}/`

### 19.2 Các Tính Năng Khác
- **Ước tính vận chuyển**: Tính toán phí vận chuyển
  - Page: `/shipping-estimator`
  
- **Điểm Green Farm**: Xem điểm Green Farm
  - Page: `/GreenFarmwallet`
  
- **Hoàn tiền**: Quản lý hoàn tiền
  - Page: `/rturnmoney`
  
- **FAQ**: Câu hỏi thường gặp
  - Page: `/faq`

---

## 2️⃣0️⃣ PAYMENT & VNPAY INTEGRATION

### 20.1 VNPay Payment
- **Tạo đơn VNPay**: Tạo đơn thanh toán VNPay
  - Endpoint: `POST /api/payments/vnpay/`
  - Input: order_id, amount
  - Output: redirect_url (redirect tới VNPay)
  
- **Callback VNPay**: Xử lý callback từ VNPay
  - Endpoint: `POST /api/payments/vnpay/callback/`
  - Handler: Update order status after payment
  
- **Return VNPay**: Xử lý return từ VNPay
  - Endpoint: `POST /api/payments/vnpay/return-api/`
  - Page: `/vnpay-return`

---

## 2️⃣1️⃣ PRE-REQUEST & ANALYTICS

### 21.1 Analytics & Reports
- **Báo cáo doanh số**: Doanh số theo thời gian
  - Endpoint: `GET /api/orders/admin/revenue-report/`
  
- **Phân tích khách hàng**: Phân tích hành vi khách hàng
  - Endpoint: `GET /api/orders/users/{id}/behavior-stats/`
  
- **Top sản phẩm**: Top sản phẩm bán chạy
  - Endpoint: `GET /api/products/top-products/`

---

## TỔNG KẾT THỐNG KÊ

| Thành Phần | Số Lượng Usecase |
|---|---|
| Authentication & Users | 15 |
| Products & Categories | 12 |
| Reviews & Ratings | 6 |
| Cart & Checkout | 7 |
| Orders & Delivery | 11 |
| Payments & Wallet | 13 |
| Promotions & Vouchers | 9 |
| Sellers & Stores | 10 |
| Seller Dashboard | 10 |
| Complaints & Support | 8 |
| Blogs & Content | 7 |
| Notifications | 7 |
| Admin Dashboard | 18 |
| System & Settings | 8 |
| Search & Discovery | 4 |
| User Preferences | 3 |
| Content Pages | 10 |
| Pre-orders | 3 |
| VNPay Integration | 3 |
| Analytics | 3 |
| **TỔNG CỘNG** | **~190+ USECASE** |

---

## 📱 MOBILE APP (IONIC)

Các trang chính trên mobile:
- Home (Tab 1)
- Category (Tab 2)
- Favorite/Wishlist (Tab 3)
- Notification (Tab 4)
- Profile (Tab 5)
- Product Detail
- Product List
- Product by Subcategory
- Cart Page
- Login Page

---

## 🔌 REAL-TIME FEATURES

- **WebSocket Chat**: Real-time messaging giữa users
- **Server-Sent Events (SSE)**: Real-time notifications
- **Live Order Status**: Cập nhật status đơn hàng real-time

---

## 📊 KEY METRICS & STATISTICS

Hệ thống theo dõi:
- Revenue by time period
- Order statistics
- Customer behavior
- Product performance
- Seller activity
- System logs
- Transaction history
- User activity logs

---

**Ghi chú**: Danh sách usecase trên bao gồm tất cả các chức năng chính của hệ thống. Có thể có các usecase phụ hoặc chức năng ẩn khác không được liệt kê đầy đủ.
