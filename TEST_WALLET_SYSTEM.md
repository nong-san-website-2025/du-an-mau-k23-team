# 🧪 Hướng dẫn Test Hệ thống Ví Điện Tử

## 🚀 Bước 1: Khởi động hệ thống

### Backend (Django)
```bash
cd backend
python manage.py runserver
```
✅ Backend chạy tại: http://localhost:8000

### Frontend (React)  
```bash
cd frontend
npm start
```
✅ Frontend chạy tại: http://localhost:3000

## 👤 Bước 2: Tài khoản test

### Admin
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: admin
- **Quyền**: Xem tất cả yêu cầu, xác nhận/từ chối

### Users
- **User1**: `user1` / `User123`
- **User2**: `user2` / `User123`  
- **User3**: `user3` / `User123`
- **Role**: user
- **Quyền**: Tạo yêu cầu nạp tiền, xem yêu cầu của mình

## 🧪 Bước 3: Test Cases

### Test Case 1: Đăng nhập Admin
1. Truy cập: http://localhost:3000/login
2. Nhập: `admin` / `admin123`
3. **Kết quả mong đợi**: Chuyển hướng đến `/admin`
4. **Kiểm tra**: URL có chứa `/admin`

### Test Case 2: Truy cập trang Admin Wallet
1. Sau khi đăng nhập admin, truy cập: http://localhost:3000/admin/wallet
2. **Kết quả mong đợi**: 
   - Hiển thị dashboard thống kê
   - Hiển thị danh sách yêu cầu nạp tiền
   - Có 2 yêu cầu pending, 1 yêu cầu approved

### Test Case 3: User không thể truy cập Admin
1. Đăng xuất admin
2. Đăng nhập user: `user1` / `User123`
3. Thử truy cập: http://localhost:3000/admin/wallet
4. **Kết quả mong đợi**: Hiển thị "Truy cập bị từ chối" hoặc redirect về trang chủ

### Test Case 4: User tạo yêu cầu nạp tiền
1. Đăng nhập user: `user1` / `User123`
2. Truy cập: http://localhost:3000/wallet
3. Nhấn "Yêu cầu nạp tiền"
4. Nhập số tiền: 300000
5. Nhập ghi chú: "Test nạp tiền"
6. Nhấn "Gửi yêu cầu"
7. **Kết quả mong đợi**: Thông báo thành công, yêu cầu xuất hiện trong lịch sử

### Test Case 5: Admin xử lý yêu cầu
1. Đăng nhập admin
2. Truy cập: http://localhost:3000/admin/wallet
3. Tìm yêu cầu mới tạo ở Test Case 4
4. Nhấn nút "Xem chi tiết" (👁️)
5. Nhấn "Xác nhận"
6. **Kết quả mong đợi**: 
   - Trạng thái chuyển thành "Đã xác nhận"
   - Số dư ví user tăng lên

## 🔍 Debug và Troubleshooting

### Kiểm tra Console Browser
1. Mở Developer Tools (F12)
2. Vào tab Console
3. Tìm các log:
   - `🔄 Loading wallet data...`
   - `📋 Requests data:`
   - `📊 Stats data:`

### Kiểm tra Network Tab
1. Mở Developer Tools (F12)
2. Vào tab Network
3. Reload trang admin wallet
4. Kiểm tra các API calls:
   - `GET /api/wallet/requests/` - Status 200
   - `GET /api/wallet/admin/stats/` - Status 200

### Kiểm tra Database
```bash
cd backend
python check_wallet_data.py
```

### Test API trực tiếp
```bash
cd backend  
python test_wallet_api.py
```

## ❌ Lỗi thường gặp

### 1. "Truy cập bị từ chối"
- **Nguyên nhân**: User không có quyền admin
- **Giải pháp**: Đăng nhập bằng tài khoản admin

### 2. "Có lỗi xảy ra khi tải dữ liệu"
- **Nguyên nhân**: Backend không chạy hoặc API lỗi
- **Giải pháp**: 
  - Kiểm tra backend có chạy không
  - Kiểm tra console browser
  - Kiểm tra network tab

### 3. Không thấy yêu cầu nạp tiền
- **Nguyên nhân**: 
  - Chưa có dữ liệu test
  - API không trả về đúng format
- **Giải pháp**:
  - Chạy `python create_test_admin.py`
  - Kiểm tra console log

### 4. Token hết hạn
- **Nguyên nhân**: JWT token hết hạn
- **Giải pháp**: Đăng xuất và đăng nhập lại

## ✅ Checklist Test

- [ ] Backend chạy thành công
- [ ] Frontend chạy thành công  
- [ ] Admin đăng nhập được
- [ ] Admin truy cập được `/admin/wallet`
- [ ] Hiển thị thống kê dashboard
- [ ] Hiển thị danh sách yêu cầu
- [ ] User không truy cập được admin page
- [ ] User tạo được yêu cầu nạp tiền
- [ ] Admin xử lý được yêu cầu
- [ ] Số dư ví cập nhật đúng

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console browser
2. Kiểm tra backend logs
3. Chạy script debug
4. Liên hệ team phát triển

---

**Lưu ý**: Đây là môi trường test, dữ liệu có thể bị reset khi restart server.