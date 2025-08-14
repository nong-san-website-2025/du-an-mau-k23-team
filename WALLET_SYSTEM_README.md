# Hệ thống Ví Điện Tử - Wallet System

## Tổng quan
Hệ thống ví điện tử cho phép người dùng yêu cầu nạp tiền và chỉ admin mới có thể xem và xử lý các yêu cầu này.

## Tính năng chính

### 🔐 Phân quyền
- **Admin**: Có thể xem tất cả yêu cầu nạp tiền, xác nhận/từ chối yêu cầu
- **User**: Chỉ có thể tạo yêu cầu nạp tiền và xem yêu cầu của mình
- **Bảo mật**: Trang admin được bảo vệ bằng middleware, user thường không thể truy cập

### 💰 Quản lý Ví
- Tạo yêu cầu nạp tiền với số tiền và ghi chú
- Theo dõi trạng thái yêu cầu (Chờ xác nhận, Đã xác nhận, Đã từ chối)
- Xem số dư ví hiện tại
- Lịch sử các giao dịch

### 📊 Dashboard Admin
- Thống kê tổng quan (số yêu cầu chờ, đã xử lý, tổng tiền)
- Danh sách tất cả yêu cầu nạp tiền
- Xác nhận/từ chối yêu cầu với ghi chú admin

## Cài đặt và Chạy

### Backend (Django)
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python create_test_admin.py  # Tạo dữ liệu test
python manage.py runserver
```

### Frontend (React)
```bash
cd frontend
npm install
npm start
```

## Tài khoản Test

### Admin
- **Username**: admin
- **Password**: Admin123
- **Truy cập**: http://localhost:3000/admin/wallet

### Users
- **User1**: user1 / User123
- **User2**: user2 / User123  
- **User3**: user3 / User123
- **Truy cập**: http://localhost:3000/wallet

## API Endpoints

### User APIs
```
GET /api/wallet/my-wallet/           # Lấy thông tin ví
GET /api/wallet/requests/            # Lấy yêu cầu của user
POST /api/wallet/requests/           # Tạo yêu cầu nạp tiền
```

### Admin APIs (Chỉ admin)
```
GET /api/wallet/requests/            # Lấy tất cả yêu cầu
POST /api/wallet/requests/{id}/approve/  # Xác nhận yêu cầu
POST /api/wallet/requests/{id}/reject/   # Từ chối yêu cầu
GET /api/wallet/admin/stats/         # Thống kê admin
```

### Auth APIs
```
GET /api/users/verify-admin/         # Verify admin role
```

## Cấu trúc Database

### WalletRequest
- `user`: ForeignKey to CustomUser
- `amount`: Decimal (số tiền)
- `status`: pending/approved/rejected
- `message`: Ghi chú của user
- `admin_note`: Ghi chú của admin
- `processed_by`: Admin xử lý
- `created_at`, `updated_at`

### UserWallet
- `user`: OneToOneField to CustomUser
- `balance`: Decimal (số dư)
- `created_at`, `updated_at`

## Luồng hoạt động

### User tạo yêu cầu nạp tiền:
1. User đăng nhập và truy cập `/wallet`
2. Nhấn "Yêu cầu nạp tiền"
3. Nhập số tiền và ghi chú
4. Gửi yêu cầu (status = pending)

### Admin xử lý yêu cầu:
1. Admin đăng nhập và truy cập `/admin/wallet`
2. Xem danh sách yêu cầu chờ xử lý
3. Xem chi tiết và quyết định xác nhận/từ chối
4. Nhập ghi chú admin (tùy chọn)
5. Nếu xác nhận: số dư ví user được cập nhật

## Bảo mật

### Frontend
- `AdminRoute` component bảo vệ trang admin
- Kiểm tra role từ localStorage và token
- Redirect user thường về trang chủ

### Backend  
- `IsAdmin` permission class
- Kiểm tra `is_superuser` hoặc `is_admin` flag
- JWT authentication cho tất cả API

## Tính năng nâng cao

### Thống kê Admin
- Tổng số yêu cầu theo trạng thái
- Tổng số tiền chờ xử lý/đã xử lý
- Số lượng user có ví

### Validation
- Số tiền tối thiểu: 1,000 ₫
- Số tiền tối đa: 10,000,000 ₫
- Kiểm tra input hợp lệ

### UI/UX
- Loading states
- Error handling
- Responsive design
- Real-time updates

## Troubleshooting

### Lỗi thường gặp:
1. **403 Forbidden**: User không có quyền admin
2. **401 Unauthorized**: Token hết hạn hoặc không hợp lệ
3. **400 Bad Request**: Dữ liệu input không hợp lệ

### Debug:
- Kiểm tra console browser cho lỗi frontend
- Kiểm tra Django logs cho lỗi backend
- Verify token và role trong localStorage

## Mở rộng

### Tính năng có thể thêm:
- Notification system
- Email alerts cho admin
- Payment gateway integration
- Transaction history export
- Bulk approve/reject
- Auto-approval rules
- Wallet limits per user

## Liên hệ
Nếu có vấn đề, vui lòng tạo issue hoặc liên hệ team phát triển.