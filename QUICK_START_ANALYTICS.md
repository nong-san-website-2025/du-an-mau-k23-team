# 🚀 HƯỚNG DẪN NHANH: TEST ANALYTICS NGAY

## ⚡ 3 Bước để test Analytics

### Bước 1: Chạy Backend (Terminal 1)
```bash
cd c:\Users\ADMIN\OneDrive\Desktop\tongquan\du-an-mau-k23-team\backend
python manage.py runserver
```

**Kết quả mong đợi:**
```
Starting development server at http://127.0.0.1:8000/
```

### Bước 2: Chạy Frontend (Terminal 2)
```bash
cd c:\Users\ADMIN\OneDrive\Desktop\tongquan\du-an-mau-k23-team\frontend
npm start
```

**Kết quả mong đợi:**
```
Compiled successfully!
Local: http://localhost:3000
```

### Bước 3: Truy cập & Test
1. Mở trình duyệt: **http://localhost:3000**
2. Đăng nhập:
   - Username: `thamvo1`
   - Password: `123`
3. Vào: **Seller Center** → **Thống kê**
4. Kiểm tra 4 tabs:
   - ✅ **Tổng quan** - Xem KPIs và biểu đồ
   - ✅ **Phân tích bán hàng** - Xem doanh thu theo thời gian
   - ✅ **Phân tích sản phẩm** - Xem bảng hiệu suất
   - ✅ **Lưu lượng & Khách hàng** - Xem biểu đồ tròn

---

## 🧪 Test nâng cao (Optional)

### Test 1: Kiểm tra dữ liệu
```bash
cd c:\Users\ADMIN\OneDrive\Desktop\tongquan\du-an-mau-k23-team\backend
python test_analytics.py
```

**Kết quả mong đợi:**
```
✅ Found Seller: thamvo1 (ID: 2)
📦 Products: 2
🛒 Total Orders: 55
💰 Total Revenue: 728,852 VNĐ
```

### Test 2: Kiểm tra APIs (cần backend đang chạy)
```bash
cd c:\Users\ADMIN\OneDrive\Desktop\tongquan\du-an-mau-k23-team\backend
python test_analytics_api.py
```

**Kết quả mong đợi:**
```
✅ Login successful!
✅ Overview API: Success!
✅ Sales API: Success!
✅ Products API: Success!
✅ Traffic API: Success!
```

---

## 📊 Dữ liệu có sẵn

**Seller:** thamvo1 (ID: 2)

| Metric | Value |
|--------|-------|
| Doanh thu (30 ngày) | 728,852 VNĐ |
| Đơn hàng | 12 đơn |
| AOV | 60,738 VNĐ |
| Sản phẩm | 2 sản phẩm |

---

## 🎯 Các tính năng để test

### 1. Bộ lọc thời gian
- [ ] Chọn "Hôm nay" → Xem doanh thu hôm nay
- [ ] Chọn "7 ngày qua" → Xem doanh thu 7 ngày
- [ ] Chọn "30 ngày qua" → Xem doanh thu 30 ngày
- [ ] Chọn "Tùy chỉnh" → Chọn ngày bắt đầu/kết thúc

### 2. Tab Tổng quan
- [ ] Xem 5 KPIs (Doanh thu, Đơn hàng, Lượt truy cập, Tỷ lệ chuyển đổi, AOV)
- [ ] Xem % tăng/giảm (màu xanh/đỏ)
- [ ] Hover vào biểu đồ xu hướng → Xem chi tiết từng ngày
- [ ] Xem Top 5 sản phẩm bán chạy
- [ ] Xem phễu bán hàng

### 3. Tab Phân tích bán hàng
- [ ] Xem biểu đồ doanh thu theo thời gian
- [ ] Xem bảng doanh thu theo khu vực
- [ ] Xem 3 thanh Progress (Success/Cancel/Return rates)

### 4. Tab Phân tích sản phẩm
- [ ] Xem bảng hiệu suất sản phẩm
- [ ] Sắp xếp theo từng cột (Views, Sales, Revenue, CR)
- [ ] Xem màu sắc Conversion Rate (Xanh/Vàng/Đỏ)
- [ ] Xem bảng Basket Analysis (sản phẩm mua cùng)

### 5. Tab Lưu lượng & Khách hàng
- [ ] Xem biểu đồ tròn Nguồn truy cập
- [ ] Xem biểu đồ tròn Khách mới vs Khách quay lại
- [ ] Xem bảng Top từ khóa tìm kiếm

---

## 🐛 Troubleshooting

### Lỗi: Backend không chạy
```bash
# Kiểm tra port 8000 có bị chiếm không
netstat -ano | findstr :8000

# Nếu bị chiếm, kill process hoặc đổi port
python manage.py runserver 8001
```

### Lỗi: Frontend không chạy
```bash
# Kiểm tra port 3000
netstat -ano | findstr :3000

# Xóa node_modules và cài lại
rm -rf node_modules
npm install
npm start
```

### Lỗi: 401 Unauthorized
- Đảm bảo đã đăng nhập
- Kiểm tra token trong localStorage (F12 → Application → Local Storage)
- Thử đăng xuất và đăng nhập lại

### Lỗi: Không có dữ liệu
- Đảm bảo đang dùng user `thamvo1` (Seller ID 2)
- Chạy `python test_analytics.py` để kiểm tra dữ liệu
- Kiểm tra console log (F12) để xem lỗi API

---

## 📸 Screenshots mong đợi

### Tab Tổng quan
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Thống kê & Phân tích          [30 ngày qua ▼]       │
├─────────────────────────────────────────────────────────┤
│ [Tổng quan] [Phân tích bán hàng] [Phân tích sản phẩm]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  💰 Doanh thu        🛒 Đơn hàng       👁️ Lượt truy cập │
│  728,852 ₫ ↑15.5%   12 ↑20.0%        120 ↑10.0%       │
│                                                          │
│  📊 Tỷ lệ chuyển đổi  🛍️ Giá trị đơn TB                │
│  10.0% ↑5.0%         60,738 ₫ ↓2.5%                    │
│                                                          │
│  ┌─ Xu hướng doanh thu ─────────────────────────┐      │
│  │     📈 [Biểu đồ đường]                        │      │
│  └───────────────────────────────────────────────┘      │
│                                                          │
│  ┌─ Top 5 sản phẩm ─┐  ┌─ Phễu bán hàng ─┐           │
│  │ 1. 3333           │  │  Visits: 120     │           │
│  │ 2. solanhon       │  │  Views: 120      │           │
│  └───────────────────┘  │  Orders: 12      │           │
│                         └──────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist hoàn thành

Sau khi test xong, đánh dấu các mục sau:

- [ ] Backend chạy thành công
- [ ] Frontend chạy thành công
- [ ] Đăng nhập thành công với thamvo1
- [ ] Vào được trang Analytics
- [ ] Tab Tổng quan hiển thị đúng
- [ ] Tab Phân tích bán hàng hiển thị đúng
- [ ] Tab Phân tích sản phẩm hiển thị đúng
- [ ] Tab Lưu lượng & Khách hàng hiển thị đúng
- [ ] Bộ lọc thời gian hoạt động
- [ ] Biểu đồ hiển thị đúng
- [ ] Bảng dữ liệu hiển thị đúng
- [ ] Không có lỗi trong console

---

## 🎉 Hoàn thành!

Nếu tất cả checklist đều ✅, chúc mừng bạn đã test thành công tính năng Analytics!

**Next steps:**
1. Đọc [HUONG_DAN_ANALYTICS.md](./HUONG_DAN_ANALYTICS.md) để hiểu cách sử dụng chi tiết
2. Đọc [ANALYTICS_README.md](./ANALYTICS_README.md) để hiểu technical details
3. Thử các use cases trong [ANALYTICS_SUMMARY.md](./ANALYTICS_SUMMARY.md)

---

**Thời gian test:** ~10 phút  
**Độ khó:** ⭐⭐☆☆☆ (Dễ)

🚀 **Chúc bạn test thành công!**