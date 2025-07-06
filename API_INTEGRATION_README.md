# API Integration cho UserProductPage

## Tổng quan
UserProductPage đã được cập nhật để hỗ trợ cả dữ liệu hardcoded và dữ liệu từ API backend.

## Tính năng đã thêm

### 1. Toggle Switch
- Cho phép chuyển đổi giữa "Dữ liệu mẫu" và "Dữ liệu từ API"
- Mặc định sử dụng dữ liệu mẫu (hardcoded)

### 2. API Integration
- Method `getCategoriesWithProducts()` trong `productApi.js`
- Tạm thời trả về dữ liệu mẫu để test
- Có thể dễ dàng thay thế bằng API calls thực tế

### 3. Error Handling
- Loading states với spinner
- Error messages với nút thử lại
- Fallback mechanism về dữ liệu hardcoded

### 4. Responsive Design
- Giữ nguyên giao diện và UX
- Hỗ trợ cả field names từ API và hardcoded

## Cách sử dụng

### Frontend
1. Mở trang UserProductPage
2. Sử dụng toggle switch để chuyển đổi giữa hai chế độ:
   - OFF: Sử dụng dữ liệu mẫu (hardcoded)
   - ON: Sử dụng dữ liệu từ API

### Backend (Tùy chọn)
Nếu muốn test với dữ liệu thực từ backend:

```bash
# Tạo dữ liệu mẫu trong database
python manage.py create_sample_data

# Chạy server
python manage.py runserver
```

## Cấu trúc dữ liệu API

API trả về dữ liệu với cấu trúc:
```javascript
[
  {
    id: 1,
    key: 'rau-cu-qua',
    name: 'Rau Củ Quả',
    icon: 'Carrot',
    subcategories: [
      {
        name: 'Rau lá xanh',
        products: [
          {
            id: 1,
            name: 'Tên sản phẩm',
            description: 'Mô tả',
            price: 20000,
            unit: 'kg',
            image: 'URL ảnh',
            rating: 4.2,
            review_count: 30,
            is_new: true,
            is_organic: true,
            discount: 15,
            location: 'Địa điểm',
            brand: 'Thương hiệu',
            is_best_seller: false
          }
        ]
      }
    ]
  }
]
```

## Field Mapping

| Hardcoded | API | Mô tả |
|-----------|-----|-------|
| `reviewCount` | `review_count` | Số lượng đánh giá |
| `isNew` | `is_new` | Sản phẩm mới |
| `isOrganic` | `is_organic` | Sản phẩm hữu cơ |
| `isBestSeller` | `is_best_seller` | Sản phẩm bán chạy |

## Các file đã thay đổi

1. **frontend/src/services/productApi.js**
   - Thêm method `getCategoriesWithProducts()`

2. **frontend/src/pages/UserProductPage.jsx**
   - Thêm state management cho API data
   - Thêm toggle switch
   - Cập nhật logic hiển thị
   - Thêm error handling

3. **backend/products/management/commands/create_sample_data.py**
   - Command tạo dữ liệu mẫu để test

## Tiếp theo

Khi backend API sẵn sàng:
1. Thay thế dữ liệu mẫu trong `getCategoriesWithProducts()` bằng API calls thực tế
2. Cập nhật URL endpoints trong `productApi.js`
3. Test và debug các edge cases

## Lưu ý

- Hiện tại API method chỉ trả về dữ liệu mẫu
- Cần implement các API endpoints thực tế trong backend
- Toggle switch giúp dễ dàng so sánh giữa hai chế độ