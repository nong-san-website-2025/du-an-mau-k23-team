# 📊 HƯỚNG DẪN SỬ DỤNG TÍNH NĂNG THỐNG KÊ & PHÂN TÍCH

## 🎯 Tổng quan

Trang **Thống kê & Phân tích** (Analytics) cung cấp cái nhìn toàn diện về hiệu suất kinh doanh của cửa hàng, giúp người bán đưa ra quyết định dựa trên dữ liệu thực tế.

---

## 📍 Truy cập

**Đường dẫn:** Seller Center → Thống kê

**URL:** `http://localhost:3000/seller-center/analytics`

---

## 🗂️ Cấu trúc 4 Tab chính

### 1️⃣ Tab "Tổng quan" (Overview Dashboard)

Cung cấp cái nhìn 360 độ về sức khỏe cửa hàng.

#### 📈 Chỉ số KPI (Key Performance Indicators)

| Chỉ số | Ý nghĩa | Cách tính |
|--------|---------|-----------|
| **Doanh thu** | Tổng tiền từ đơn hàng thành công | Tổng `Payment.amount` với `status='success'` |
| **Số đơn hàng** | Tổng số đơn đã bán | Đếm `Order` với `status in ['success', 'delivered']` |
| **Lượt truy cập** | Số lượt ghé thăm cửa hàng | Ước tính: `orders * 10` (tỷ lệ chuyển đổi 10%) |
| **Tỷ lệ chuyển đổi** | % khách truy cập thành đơn hàng | `(Số đơn / Lượt truy cập) * 100%` |
| **Giá trị đơn TB (AOV)** | Giá trị trung bình mỗi đơn | `Tổng doanh thu / Số đơn hàng` |

**Mỗi KPI hiển thị:**
- ✅ Giá trị hiện tại
- 📊 % tăng/giảm so với kỳ trước (màu xanh = tăng, đỏ = giảm)

#### 📉 Biểu đồ xu hướng doanh thu

- **Dạng:** Biểu đồ đường (Line Chart)
- **Dữ liệu:** Doanh thu theo ngày trong khoảng thời gian đã chọn
- **Tính năng:** Hover để xem chi tiết từng ngày

#### 🏆 Top 5 sản phẩm hiệu quả nhất

Bảng hiển thị 5 sản phẩm có **doanh thu cao nhất**, bao gồm:
- Hình ảnh sản phẩm
- Tên sản phẩm
- Số lượng đã bán
- Doanh thu

**💡 Ứng dụng:** Tập trung quảng bá các sản phẩm này để tối đa hóa lợi nhuận.

#### 🔻 Phễu bán hàng (Sales Funnel)

Biểu đồ phễu hiển thị hành trình khách hàng:

```
Lượt truy cập (100%)
    ↓
Lượt xem sản phẩm (50%)
    ↓
Đơn hàng (10%)
```

**💡 Ứng dụng:** Xác định "điểm nghẽn" - nếu nhiều người xem nhưng ít đơn hàng → cần cải thiện giá/mô tả sản phẩm.

---

### 2️⃣ Tab "Phân tích bán hàng" (Sales Analysis)

Đi sâu vào chi tiết hiệu suất bán hàng.

#### ⏰ Doanh thu theo thời gian

**Khi chọn "Hôm nay":**
- Biểu đồ cột hiển thị doanh thu **theo giờ** (0h-23h)
- **💡 Ứng dụng:** Biết giờ vàng để chạy flash sale hoặc đẩy quảng cáo

**Khi chọn "7 ngày" hoặc "30 ngày":**
- Biểu đồ cột hiển thị doanh thu **theo ngày**
- **💡 Ứng dụng:** Phát hiện xu hướng cuối tuần/đầu tháng

#### 🗺️ Doanh thu theo khu vực

Bảng hiển thị top 10 tỉnh/thành có doanh thu cao nhất:
- Tên tỉnh/thành
- Số đơn hàng
- Tổng doanh thu

**💡 Ứng dụng:**
- Tập trung marketing vào các thị trường trọng điểm
- Tối ưu chi phí vận chuyển cho khu vực có nhiều đơn

#### 📊 Chỉ số vận hành

3 thanh Progress Bar hiển thị:

| Chỉ số | Màu sắc | Ý nghĩa |
|--------|---------|---------|
| **Tỷ lệ thành công** | 🟢 Xanh lá | % đơn hàng giao thành công |
| **Tỷ lệ hủy đơn** | 🔴 Đỏ | % đơn bị hủy |
| **Tỷ lệ trả hàng** | 🟡 Vàng | % đơn bị trả lại |

**💡 Ứng dụng:**
- Nếu tỷ lệ hủy/trả hàng cao → kiểm tra chất lượng sản phẩm, mô tả, đóng gói

---

### 3️⃣ Tab "Phân tích sản phẩm" (Product Analysis)

Phần quan trọng nhất để tối ưu danh mục sản phẩm.

#### 📋 Bảng hiệu suất sản phẩm chi tiết

Bảng có thể **sắp xếp** theo từng cột:

| Cột | Ý nghĩa | Cách tính |
|-----|---------|-----------|
| **Lượt xem** | Số lần sản phẩm được xem | Ước tính: `units_sold * 20` |
| **Thêm giỏ hàng** | Số lần thêm vào giỏ | Ước tính: `units_sold * 5` |
| **Đã bán** | Số lượng đã bán | Tổng `OrderItem.quantity` |
| **Doanh thu** | Tổng tiền thu được | `SUM(price * quantity)` |
| **Tỷ lệ chuyển đổi** | % xem → mua | `(Đã bán / Lượt xem) * 100%` |

**Màu sắc tỷ lệ chuyển đổi:**
- 🟢 Xanh: > 5% (Tốt)
- 🟡 Vàng: 2-5% (Trung bình)
- 🔴 Đỏ: < 2% (Cần cải thiện)

**💡 Ứng dụng:**
- Sản phẩm có **lượt xem cao nhưng tỷ lệ chuyển đổi thấp** → Cần tối ưu:
  - Giá cả (có thể quá cao)
  - Hình ảnh (không hấp dẫn)
  - Mô tả (không rõ ràng)
  - Đánh giá (quá ít hoặc xấu)

#### 🛒 Phân tích giỏ hàng (Basket Analysis)

Bảng hiển thị các **cặp sản phẩm thường được mua cùng nhau**:

| Sản phẩm 1 | Sản phẩm 2 | Số lần mua cùng | Gợi ý |
|------------|------------|-----------------|-------|
| Dầu gội A | Dầu xả B | 15 lần | Tạo combo khuyến mãi |

**💡 Ứng dụng:**
- Tạo **combo/bundle** để tăng giá trị đơn hàng trung bình (AOV)
- Ví dụ: "Mua Dầu gội A + Dầu xả B giảm 10%"

---

### 4️⃣ Tab "Lưu lượng & Khách hàng" (Traffic & Customer Analysis)

Hiểu khách hàng đến từ đâu và họ là ai.

#### 🌐 Nguồn truy cập (Traffic Sources)

Biểu đồ tròn (Pie Chart) phân tách lưu lượng:

| Nguồn | % | Ý nghĩa |
|-------|---|---------|
| **Tìm kiếm trên sàn** | 40% | Khách chủ động tìm sản phẩm |
| **Khám phá (trang chủ)** | 30% | Sàn đề xuất sản phẩm |
| **Quảng cáo nội sàn** | 20% | Từ chiến dịch quảng cáo |
| **Nguồn bên ngoài** | 10% | Từ mạng xã hội, Google... |

**💡 Ứng dụng:**
- Kênh nào hiệu quả → tập trung đầu tư
- Ví dụ: Nếu "Tìm kiếm" cao → tối ưu SEO tên sản phẩm

#### 🔍 Từ khóa tìm kiếm hàng đầu

Bảng liệt kê top 10 từ khóa khách hàng dùng để tìm sản phẩm của bạn:

| Từ khóa | Số lượt tìm | Gợi ý |
|---------|-------------|-------|
| "rau sạch" | 50 | Tối ưu SEO cho từ khóa này |

**💡 Ứng dụng:**
- **Mỏ vàng SEO:** Thêm từ khóa này vào:
  - Tên sản phẩm
  - Mô tả chi tiết
  - Tags
- Chạy quảng cáo tìm kiếm với từ khóa này

#### 👥 Phân tích khách hàng

Biểu đồ tròn so sánh:
- **Khách hàng mới:** Mua lần đầu
- **Khách hàng quay lại:** Đã mua ≥ 2 lần

**💡 Ứng dụng:**
- Nếu **tỷ lệ khách quay lại thấp** → Cần:
  - Cải thiện chất lượng sản phẩm/dịch vụ
  - Chương trình khách hàng thân thiết
  - Email marketing chăm sóc sau bán

---

## ⏱️ Bộ lọc thời gian

Ở góc trên bên phải, chọn khoảng thời gian:

| Tùy chọn | Mô tả |
|----------|-------|
| **Hôm nay** | Từ 0h đến hiện tại |
| **7 ngày qua** | 7 ngày gần nhất |
| **30 ngày qua** | 30 ngày gần nhất (mặc định) |
| **Tùy chỉnh** | Chọn ngày bắt đầu và kết thúc |

**Lưu ý:** Khi đổi khoảng thời gian, tất cả dữ liệu sẽ tự động cập nhật.

---

## 🔧 API Endpoints (Dành cho Developer)

### 1. Overview API
```
GET /api/sellers/analytics/overview/
Query params: period (today|7days|30days|custom), start_date, end_date
```

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
  "top_products": [...],
  "funnel": {"visits": 120, "product_views": 120, "orders": 12}
}
```

### 2. Sales API
```
GET /api/sellers/analytics/sales/
Query params: period
```

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
```
GET /api/sellers/analytics/products/
Query params: period
```

**Response:**
```json
{
  "product_performance": [
    {
      "id": 1,
      "name": "Sản phẩm A",
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
```
GET /api/sellers/analytics/traffic/
Query params: period
```

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

## 📊 Dữ liệu thực tế (Seller ID 2)

### Tổng quan hiện tại:
- **Tổng doanh thu:** 728,852 VNĐ
- **Số đơn hàng:** 12 đơn (success)
- **Số sản phẩm:** 2 sản phẩm
- **Khách hàng:** 2 người (1 mới, 1 quay lại)

### Doanh thu theo thời gian:
| Kỳ | Doanh thu | Đơn hàng | AOV |
|----|-----------|----------|-----|
| Hôm nay | 299,997 ₫ | 1 | 299,997 ₫ |
| 7 ngày | 299,997 ₫ | 1 | 299,997 ₫ |
| 30 ngày | 728,852 ₫ | 12 | 60,738 ₫ |

### Top sản phẩm:
1. **3333** - 399,996 ₫ (12 sản phẩm)
2. **solanhon** - 328,856 ₫ (74 sản phẩm)

---

## 💡 Các kịch bản sử dụng thực tế

### Kịch bản 1: Tối ưu sản phẩm kém hiệu quả
**Vấn đề:** Sản phẩm có 1000 lượt xem nhưng chỉ bán được 5 cái (tỷ lệ chuyển đổi 0.5%)

**Giải pháp:**
1. Vào tab **Phân tích sản phẩm**
2. Sắp xếp theo **Tỷ lệ chuyển đổi** (thấp → cao)
3. Với sản phẩm có tỷ lệ thấp:
   - Kiểm tra giá so với đối thủ
   - Cải thiện hình ảnh (chụp rõ hơn, nhiều góc)
   - Viết lại mô tả chi tiết hơn
   - Thêm video demo nếu có thể

### Kịch bản 2: Tăng giá trị đơn hàng trung bình (AOV)
**Vấn đề:** AOV hiện tại là 60,000 ₫, muốn tăng lên 80,000 ₫

**Giải pháp:**
1. Vào tab **Phân tích sản phẩm** → **Phân tích giỏ hàng**
2. Tìm các cặp sản phẩm thường mua cùng
3. Tạo combo khuyến mãi:
   - "Mua A + B giảm 10%"
   - "Mua 2 tặng 1"
4. Đặt banner combo ở trang chủ shop

### Kịch bản 3: Tăng tỷ lệ khách quay lại
**Vấn đề:** 80% khách hàng chỉ mua 1 lần rồi không quay lại

**Giải pháp:**
1. Vào tab **Lưu lượng & Khách hàng**
2. Xem tỷ lệ khách mới vs khách quay lại
3. Triển khai:
   - Chương trình tích điểm
   - Email cảm ơn + mã giảm giá cho lần mua tiếp
   - Chăm sóc sau bán (hỏi thăm, hướng dẫn sử dụng)

### Kịch bản 4: Tối ưu thời gian chạy quảng cáo
**Vấn đề:** Không biết giờ nào khách hàng mua nhiều nhất

**Giải pháp:**
1. Chọn khoảng thời gian **Hôm nay**
2. Vào tab **Phân tích bán hàng**
3. Xem biểu đồ **Doanh thu theo giờ**
4. Chạy quảng cáo/flash sale vào giờ có doanh thu cao nhất

---

## 🚀 Lợi ích của tính năng Analytics

✅ **Ra quyết định dựa trên dữ liệu** thay vì cảm tính

✅ **Phát hiện cơ hội tăng trưởng** (sản phẩm tiềm năng, thị trường mới)

✅ **Tối ưu chi phí marketing** (tập trung vào kênh hiệu quả)

✅ **Cải thiện trải nghiệm khách hàng** (giảm tỷ lệ hủy/trả hàng)

✅ **Tăng doanh thu** thông qua tối ưu sản phẩm và combo

---

## 📞 Hỗ trợ

Nếu gặp vấn đề hoặc cần hỗ trợ thêm, vui lòng liên hệ:
- **Email:** support@example.com
- **Hotline:** 1900-xxxx

---

**Chúc bạn kinh doanh thành công! 🎉**