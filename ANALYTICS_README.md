# 📊 TÍNH NĂNG THỐNG KÊ & PHÂN TÍCH (ANALYTICS)

## 🎯 Tổng quan

Tính năng **Analytics** cung cấp hệ thống phân tích dữ liệu toàn diện cho người bán, giúp:
- 📈 Theo dõi hiệu suất kinh doanh theo thời gian thực
- 🎯 Đưa ra quyết định dựa trên dữ liệu (Data-driven decisions)
- 💡 Phát hiện cơ hội tăng trưởng và tối ưu hóa
- 🚀 Tăng doanh thu thông qua insights chuyên sâu

---

## 📁 Cấu trúc Files

### Backend
```
backend/
├── sellers/
│   ├── views_analytics.py          # 4 API endpoints cho analytics
│   └── urls.py                      # Routes cho analytics APIs
├── test_analytics.py                # Test dữ liệu analytics
└── test_analytics_api.py            # Test HTTP APIs
```

### Frontend
```
frontend/src/features/seller_center/pages/
└── Analytics.jsx                    # Trang Analytics với 4 tabs
```

### Documentation
```
├── HUONG_DAN_ANALYTICS.md          # Hướng dẫn sử dụng chi tiết
└── ANALYTICS_README.md             # File này
```

---

## 🚀 Cài đặt & Chạy

### 1. Backend Setup

Không cần cài đặt thêm dependencies, tất cả đã có sẵn trong Django.

**Kiểm tra:**
```bash
cd backend
python manage.py check
```

**Test dữ liệu:**
```bash
python test_analytics.py
```

**Test APIs:**
```bash
# Đảm bảo server đang chạy
python manage.py runserver

# Ở terminal khác
python test_analytics_api.py
```

### 2. Frontend Setup

Tất cả dependencies đã có trong `package.json`:
- `antd` - UI components
- `@ant-design/charts` - Biểu đồ
- `@ant-design/icons` - Icons
- `axios` - HTTP client
- `dayjs` - Date handling

**Chạy frontend:**
```bash
cd frontend
npm start
```

**Truy cập:**
```
http://localhost:3000/seller-center/analytics
```

---

## 🗂️ Cấu trúc 4 Tabs

### 1️⃣ Tab "Tổng quan" (Overview)
**Mục đích:** Cái nhìn 360° về sức khỏe cửa hàng

**Nội dung:**
- 5 KPIs chính (Doanh thu, Đơn hàng, Lượt truy cập, Tỷ lệ chuyển đổi, AOV)
- Biểu đồ xu hướng doanh thu
- Top 5 sản phẩm hiệu quả nhất
- Phễu bán hàng (Sales Funnel)

**API:** `GET /api/sellers/analytics/overview/`

### 2️⃣ Tab "Phân tích bán hàng" (Sales)
**Mục đích:** Phân tích chi tiết hiệu suất bán hàng

**Nội dung:**
- Doanh thu theo thời gian (giờ/ngày)
- Doanh thu theo khu vực địa lý
- Chỉ số vận hành (Success/Cancel/Return rates)

**API:** `GET /api/sellers/analytics/sales/`

### 3️⃣ Tab "Phân tích sản phẩm" (Products)
**Mục đích:** Tối ưu danh mục sản phẩm

**Nội dung:**
- Bảng hiệu suất sản phẩm chi tiết (Views, Cart adds, Sales, Revenue, Conversion rate)
- Phân tích giỏ hàng (Basket Analysis) - Sản phẩm thường mua cùng

**API:** `GET /api/sellers/analytics/products/`

### 4️⃣ Tab "Lưu lượng & Khách hàng" (Traffic)
**Mục đích:** Hiểu nguồn khách hàng và hành vi

**Nội dung:**
- Nguồn truy cập (Traffic Sources)
- Từ khóa tìm kiếm hàng đầu
- Phân tích khách hàng (New vs Returning)

**API:** `GET /api/sellers/analytics/traffic/`

---

## 🔧 API Documentation

### Base URL
```
http://localhost:8000/api/sellers/analytics
```

### Authentication
Tất cả APIs yêu cầu JWT token:
```
Authorization: Bearer <access_token>
```

### Query Parameters (Chung cho tất cả APIs)

| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `period` | string | `today`, `7days`, `30days`, `custom` | Khoảng thời gian |
| `start_date` | ISO datetime | `2025-01-01T00:00:00Z` | Ngày bắt đầu (chỉ khi `period=custom`) |
| `end_date` | ISO datetime | `2025-01-31T23:59:59Z` | Ngày kết thúc (chỉ khi `period=custom`) |

### 1. Overview API

**Endpoint:** `GET /analytics/overview/`

**Response:**
```json
{
  "kpis": {
    "revenue": {"value": 728852, "growth": 15.5},
    "orders": {"value": 12, "growth": 20.0},
    "visits": {"value": 120, "growth": 10.0},
    "conversion_rate": {"value": 10.0, "growth": 5.0},
    "aov": {"value": 60738, "growth": -2.5}
  },
  "trend_chart": [
    {"date": "2025-01-01", "revenue": 100000, "orders": 2}
  ],
  "top_products": [
    {
      "id": 1,
      "name": "Product A",
      "image": "http://...",
      "revenue": 200000,
      "units_sold": 10
    }
  ],
  "funnel": {
    "visits": 120,
    "product_views": 120,
    "orders": 12
  },
  "period": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  }
}
```

### 2. Sales API

**Endpoint:** `GET /analytics/sales/`

**Response:**
```json
{
  "revenue_by_time": [
    {"time": "2025-01-01", "revenue": 100000}
  ],
  "revenue_by_location": [
    {"province": "Hà Nội", "orders": 5, "revenue": 200000}
  ],
  "operational_metrics": {
    "success_rate": 95.5,
    "cancel_rate": 3.0,
    "return_rate": 1.5
  }
}
```

### 3. Products API

**Endpoint:** `GET /analytics/products/`

**Response:**
```json
{
  "product_performance": [
    {
      "id": 1,
      "name": "Product A",
      "image": "http://...",
      "views": 200,
      "cart_adds": 50,
      "units_sold": 10,
      "revenue": 500000,
      "conversion_rate": 5.0
    }
  ],
  "basket_analysis": [
    {
      "product1": {"id": 1, "name": "A"},
      "product2": {"id": 2, "name": "B"},
      "count": 15
    }
  ]
}
```

### 4. Traffic API

**Endpoint:** `GET /analytics/traffic/`

**Response:**
```json
{
  "traffic_sources": [
    {"source": "Tìm kiếm trên sàn", "visits": 48, "percentage": 40}
  ],
  "top_keywords": [
    {"keyword": "rau", "count": 10}
  ],
  "customer_analysis": {
    "new_customers": 1,
    "returning_customers": 1,
    "new_percentage": 50.0,
    "returning_percentage": 50.0
  }
}
```

---

## 📊 Dữ liệu mẫu (Seller ID 2)

### Tổng quan
- **Seller:** thamvo1 (ID: 2)
- **Sản phẩm:** 2 sản phẩm
- **Đơn hàng:** 55 đơn (12 success)
- **Doanh thu:** 728,852 VNĐ

### Breakdown theo thời gian
| Kỳ | Doanh thu | Đơn hàng | AOV |
|----|-----------|----------|-----|
| Hôm nay | 299,997 ₫ | 1 | 299,997 ₫ |
| 7 ngày | 299,997 ₫ | 1 | 299,997 ₫ |
| 30 ngày | 728,852 ₫ | 12 | 60,738 ₫ |

### Top sản phẩm
1. **3333** - 399,996 ₫ (12 sản phẩm)
2. **solanhon** - 328,856 ₫ (74 sản phẩm)

### Khách hàng
- **Tổng:** 2 khách hàng
- **Mới:** 1 (50%)
- **Quay lại:** 1 (50%)

---

## 🧪 Testing

### Test 1: Kiểm tra dữ liệu
```bash
python backend/test_analytics.py
```

**Kết quả mong đợi:**
```
✅ Found Seller: thamvo1 (ID: 2)
📦 Products: 2
🛒 Total Orders: 55
💰 Total Revenue: 728,852 VNĐ
```

### Test 2: Kiểm tra APIs
```bash
# Terminal 1: Chạy server
python backend/manage.py runserver

# Terminal 2: Test APIs
python backend/test_analytics_api.py
```

**Kết quả mong đợi:**
```
✅ Login successful!
✅ Overview API: Success!
✅ Sales API: Success!
✅ Products API: Success!
✅ Traffic API: Success!
```

### Test 3: Kiểm tra Frontend
1. Mở trình duyệt: `http://localhost:3000`
2. Đăng nhập với: `thamvo1` / `123`
3. Vào: Seller Center → Thống kê
4. Kiểm tra 4 tabs:
   - ✅ Tab "Tổng quan" hiển thị KPIs và biểu đồ
   - ✅ Tab "Phân tích bán hàng" hiển thị doanh thu theo thời gian
   - ✅ Tab "Phân tích sản phẩm" hiển thị bảng sản phẩm
   - ✅ Tab "Lưu lượng & Khách hàng" hiển thị biểu đồ tròn

---

## 💡 Use Cases

### Use Case 1: Tối ưu sản phẩm kém hiệu quả
**Tình huống:** Sản phẩm có nhiều lượt xem nhưng ít người mua

**Giải pháp:**
1. Vào tab **Phân tích sản phẩm**
2. Sắp xếp theo **Tỷ lệ chuyển đổi** (thấp → cao)
3. Với sản phẩm có CR < 2%:
   - Kiểm tra giá
   - Cải thiện hình ảnh
   - Viết lại mô tả
   - Thêm đánh giá

### Use Case 2: Tăng AOV bằng Combo
**Tình huống:** Muốn tăng giá trị đơn hàng trung bình

**Giải pháp:**
1. Vào tab **Phân tích sản phẩm** → **Phân tích giỏ hàng**
2. Tìm cặp sản phẩm thường mua cùng
3. Tạo combo khuyến mãi: "Mua A + B giảm 10%"

### Use Case 3: Tăng tỷ lệ khách quay lại
**Tình huống:** Nhiều khách mua 1 lần rồi không quay lại

**Giải pháp:**
1. Vào tab **Lưu lượng & Khách hàng**
2. Xem tỷ lệ khách mới vs khách quay lại
3. Triển khai:
   - Chương trình tích điểm
   - Email marketing
   - Chăm sóc sau bán

### Use Case 4: Tối ưu thời gian quảng cáo
**Tình huống:** Không biết giờ nào chạy ads hiệu quả

**Giải pháp:**
1. Chọn khoảng thời gian **Hôm nay**
2. Vào tab **Phân tích bán hàng**
3. Xem **Doanh thu theo giờ**
4. Chạy ads vào giờ có doanh thu cao

---

## 🔍 Công thức tính toán

### KPIs

**1. Doanh thu (Revenue)**
```python
revenue = SUM(Payment.amount WHERE status='success')
```

**2. Số đơn hàng (Orders)**
```python
orders = COUNT(Order WHERE status IN ['success', 'delivered'])
```

**3. Lượt truy cập (Visits)**
```python
# Mock data - trong thực tế cần tracking service
visits = orders * 10  # Giả sử conversion rate 10%
```

**4. Tỷ lệ chuyển đổi (Conversion Rate)**
```python
conversion_rate = (orders / visits) * 100
```

**5. Giá trị đơn trung bình (AOV)**
```python
aov = revenue / orders
```

### Growth Calculation
```python
def calc_growth(current, previous):
    if previous == 0:
        return 100 if current > 0 else 0
    return ((current - previous) / previous) * 100
```

### Product Conversion Rate
```python
product_cr = (units_sold / views) * 100
```

---

## 🎨 UI Components

### Ant Design Components sử dụng
- `Card` - Container cho từng section
- `Statistic` - Hiển thị KPIs
- `Table` - Bảng dữ liệu sản phẩm
- `Tabs` - 4 tabs chính
- `Select` - Chọn khoảng thời gian
- `DatePicker` - Chọn ngày tùy chỉnh
- `Progress` - Thanh tiến trình cho metrics
- `Tag` - Labels cho dữ liệu
- `Row/Col` - Layout grid

### Ant Design Charts sử dụng
- `Line` - Biểu đồ đường (Trend chart)
- `Column` - Biểu đồ cột (Revenue by time)
- `Pie` - Biểu đồ tròn (Traffic sources, Customer analysis)
- `Funnel` - Biểu đồ phễu (Sales funnel)

---

## 🚧 Limitations & Future Improvements

### Hiện tại (Mock Data)
- ❌ Lượt xem sản phẩm: Ước tính từ số lượng bán
- ❌ Thêm giỏ hàng: Ước tính từ số lượng bán
- ❌ Nguồn truy cập: Dữ liệu giả lập
- ❌ Từ khóa tìm kiếm: Trích xuất từ tên sản phẩm

### Cải tiến tương lai
- ✅ Tích hợp Google Analytics cho tracking thực
- ✅ Lưu events (view, add_to_cart, search) vào database
- ✅ Tracking UTM parameters cho traffic sources
- ✅ Real-time analytics với WebSocket
- ✅ Export reports (PDF, Excel)
- ✅ Email reports tự động hàng tuần/tháng
- ✅ Predictive analytics (dự đoán doanh thu)
- ✅ A/B testing cho sản phẩm

---

## 📚 Tài liệu tham khảo

- **Hướng dẫn sử dụng:** [HUONG_DAN_ANALYTICS.md](./HUONG_DAN_ANALYTICS.md)
- **Ant Design Charts:** https://charts.ant.design/
- **Ant Design Components:** https://ant.design/components/overview/

---

## 🤝 Đóng góp

Nếu bạn muốn cải thiện tính năng Analytics:

1. Fork repository
2. Tạo branch mới: `git checkout -b feature/analytics-improvement`
3. Commit changes: `git commit -m "Add new analytics feature"`
4. Push to branch: `git push origin feature/analytics-improvement`
5. Tạo Pull Request

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console log (F12)
2. Kiểm tra backend logs
3. Chạy test scripts
4. Liên hệ team support

---

## ✅ Checklist triển khai

- [x] Backend APIs (4 endpoints)
- [x] Frontend UI (4 tabs)
- [x] Test scripts (data + API)
- [x] Documentation (user guide + README)
- [x] Sample data (Seller ID 2)
- [ ] Production deployment
- [ ] Real tracking integration
- [ ] Performance optimization
- [ ] Mobile responsive testing

---

**Phiên bản:** 1.0.0  
**Ngày cập nhật:** 2025-01-20  
**Tác giả:** Development Team

🎉 **Chúc bạn sử dụng tính năng Analytics hiệu quả!**