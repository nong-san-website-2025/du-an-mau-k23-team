# 💰 HƯỚNG DẪN RÚT TIỀN CHO SELLER

## 📋 Tổng quan

Chức năng rút tiền cho phép seller rút số dư khả dụng từ doanh thu bán hàng về tài khoản ngân hàng.

---

## 🔑 Cách sử dụng

### Bước 1: Truy cập trang Tài chính
1. Đăng nhập vào **Seller Center**
2. Vào menu **Tài chính** (Finance)

### Bước 2: Kiểm tra số dư
Trên trang Tài chính, bạn sẽ thấy:
- **Số dư khả dụng**: Số tiền có thể rút ngay
- **Số dư đang chờ**: Số tiền từ đơn hàng đang xử lý
- **Doanh thu tháng này**: Tổng doanh thu trong tháng
- **Đã rút tháng này**: Tổng số tiền đã rút trong tháng

### Bước 3: Yêu cầu rút tiền
1. Tìm phần **"Rút tiền"** ở góc phải trên
2. Nhập số tiền muốn rút (tối thiểu **10,000 VNĐ**)
3. Nhấn nút **"Yêu cầu rút tiền"**
4. Hệ thống sẽ kiểm tra:
   - Số tiền có hợp lệ không
   - Số dư có đủ không
5. Nếu hợp lệ, yêu cầu sẽ được gửi thành công

### Bước 4: Theo dõi trạng thái
Sau khi gửi yêu cầu, bạn có thể xem lịch sử rút tiền với các trạng thái:
- **Pending** (Đang chờ): Yêu cầu đang được xử lý
- **Approved** (Đã duyệt): Admin đã duyệt, đang chuyển tiền
- **Paid** (Đã thanh toán): Tiền đã được chuyển vào tài khoản
- **Rejected** (Từ chối): Yêu cầu bị từ chối

---

## 💡 Lưu ý quan trọng

### Số dư khả dụng được tính như sau:
```
Số dư khả dụng = Tổng doanh thu (payments SUCCESS) - Tổng đã rút (withdraws PAID/APPROVED)
```

### Điều kiện rút tiền:
- ✅ Số tiền tối thiểu: **10,000 VNĐ**
- ✅ Số tiền rút ≤ Số dư khả dụng
- ✅ Phải có tài khoản ngân hàng đã xác thực (nếu có yêu cầu)

### Thời gian xử lý:
- **Pending → Approved**: 1-3 ngày làm việc
- **Approved → Paid**: 1-2 ngày làm việc

---

## 🔧 API Endpoints (Cho Developer)

### 1. Yêu cầu rút tiền
```http
POST /api/payments/withdraw/request/
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 100000
}
```

**Response thành công:**
```json
{
  "message": "Yêu cầu rút tiền đã được gửi!",
  "id": 1
}
```

**Response lỗi:**
```json
{
  "error": "Số dư không đủ"
}
```

### 2. Xem lịch sử rút tiền
```http
GET /api/payments/withdraw/history/
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "amount": "100000.00",
      "status": "pending",
      "created_at": "2025-10-12T10:30:00Z",
      "processed_at": null,
      "note": null
    }
  ]
}
```

### 3. Kiểm tra số dư
```http
GET /api/payments/wallet/balance/
Authorization: Bearer {token}
```

**Response:**
```json
{
  "balance": 728852.0
}
```

---

## 🐛 Xử lý lỗi thường gặp

### Lỗi: "Số dư không đủ"
**Nguyên nhân:** Số tiền yêu cầu rút > Số dư khả dụng

**Giải pháp:**
1. Kiểm tra lại số dư khả dụng
2. Nhập số tiền nhỏ hơn hoặc bằng số dư

### Lỗi: "Số tiền không hợp lệ"
**Nguyên nhân:** Số tiền ≤ 0 hoặc không phải số

**Giải pháp:**
1. Nhập số tiền > 0
2. Đảm bảo nhập đúng định dạng số

### Lỗi: "Seller not found"
**Nguyên nhân:** Tài khoản chưa đăng ký làm seller

**Giải pháp:**
1. Đăng ký tài khoản seller
2. Đăng nhập lại

---

## 📊 Ví dụ thực tế

### Tình huống 1: Rút tiền thành công
```
Số dư khả dụng: 728,852 VNĐ
Số tiền muốn rút: 500,000 VNĐ
Kết quả: ✅ Thành công
Số dư còn lại: 228,852 VNĐ (sau khi admin duyệt)
```

### Tình huống 2: Rút tiền thất bại
```
Số dư khả dụng: 728,852 VNĐ
Số tiền muốn rút: 800,000 VNĐ
Kết quả: ❌ Lỗi "Số dư không đủ"
```

### Tình huống 3: Rút tiền dưới mức tối thiểu
```
Số dư khả dụng: 728,852 VNĐ
Số tiền muốn rút: 5,000 VNĐ
Kết quả: ⚠️ Cảnh báo "Nhập số tiền muốn rút (tối thiểu 10.000 VNĐ)"
```

---

## 🔐 Bảo mật

- Tất cả yêu cầu rút tiền đều yêu cầu xác thực (Bearer Token)
- Chỉ seller mới có quyền rút tiền từ tài khoản của mình
- Admin sẽ xem xét và duyệt từng yêu cầu rút tiền
- Lịch sử rút tiền được lưu trữ đầy đủ để kiểm tra

---

## 📞 Hỗ trợ

Nếu gặp vấn đề khi rút tiền, vui lòng liên hệ:
- Email: support@example.com
- Hotline: 1900-xxxx
- Hoặc tạo ticket hỗ trợ trong hệ thống

---

**Cập nhật lần cuối:** 2025-10-12