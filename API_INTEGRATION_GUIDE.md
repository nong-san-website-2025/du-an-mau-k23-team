# Hướng dẫn kết nối Frontend với Backend API

## 🎯 Mục tiêu
Kết nối trang UserProductPage với Django backend để lấy dữ liệu sản phẩm thực từ database thay vì sử dụng dữ liệu hardcode.

## 🔧 Các file đã được tạo/cập nhật

### Backend:
- `backend/products/models.py` - Model Product đã có sẵn
- `backend/products/serializers.py` - Serializer cho API
- `backend/products/views.py` - ViewSet cho API endpoints
- `backend/products/urls.py` - URL routing cho API
- `backend/products/management/commands/create_sample_products.py` - Command tạo dữ liệu mẫu

### Frontend:
- `frontend/src/services/productApi.js` - Service để gọi API
- `frontend/src/pages/UserProductPage.jsx` - Đã cập nhật để hỗ trợ cả hardcode và API data

## 🚀 Cách sử dụng

### 1. Chạy Backend (Django)
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py create_sample_products  # Tạo dữ liệu mẫu
python manage.py runserver
```

### 2. Chạy Frontend (React)
```bash
cd frontend
npm start
```

### 3. Test kết nối
1. Mở trang UserProductPage: `http://localhost:3000/productuser`
2. Bật toggle "Đang sử dụng dữ liệu từ API" 
3. Kiểm tra xem có hiển thị sản phẩm từ backend không

## 📋 API Endpoints

- `GET /api/products/` - Lấy tất cả sản phẩm
- `GET /api/products/{id}/` - Lấy sản phẩm theo ID
- `POST /api/products/` - Tạo sản phẩm mới
- `PUT /api/products/{id}/` - Cập nhật sản phẩm
- `DELETE /api/products/{id}/` - Xóa sản phẩm

## 🎨 Tính năng

### Toggle Data Source
- **Dữ liệu mẫu**: Sử dụng dữ liệu hardcode như trước
- **Dữ liệu API**: Lấy dữ liệu thực từ Django backend

### Hiển thị trạng thái
- Loading spinner khi đang tải dữ liệu
- Badge hiển thị số lượng sản phẩm đã tải
- Thông báo lỗi nếu không kết nối được API
- Badge "API" trên sản phẩm từ backend

### Tương thích dữ liệu
- Tự động fallback cho các field không có (image, location, brand, etc.)
- Hiển thị placeholder image nếu không có ảnh
- Hỗ trợ cả snake_case (API) và camelCase (frontend)

## 🔍 Debug

### Kiểm tra API hoạt động:
```bash
curl http://localhost:8000/api/products/
```

### Kiểm tra Console:
- Mở Developer Tools > Console
- Xem log "Đã tải được sản phẩm từ API"
- Kiểm tra lỗi nếu có

## 📝 Lưu ý

1. **CORS**: Đảm bảo Django đã cấu hình CORS cho frontend
2. **Database**: Chạy migrations trước khi test
3. **Sample Data**: Sử dụng command `create_sample_products` để tạo dữ liệu test
4. **Port**: Backend chạy port 8000, frontend chạy port 3000

## 🎯 Kết quả mong đợi

- ✅ Toggle được giữa dữ liệu mẫu và API
- ✅ Hiển thị sản phẩm từ Django backend
- ✅ Loading states và error handling
- ✅ UI responsive và user-friendly
- ✅ Tương thích với cả 2 định dạng dữ liệu