# 🌾 Dự án Website Sàn Thương Mại Nông Sản

## Mục tiêu của tài liệu này
- **Hướng dẫn chạy dự án Backend + Frontend đầy đủ.**
- **Bật tin nhắn realtime dùng Django Channels (WebSocket) qua ASGI server (Daphne).**
- **Khắc phục lỗi thường gặp**: WebSocket không realtime, AppRegistryNotReady/ImproperlyConfigured khi khởi động ASGI.

---

## 0) Yêu cầu môi trường
- Windows 10/11
- Git
- Node.js LTS + npm (Frontend)
- Python đề xuất: 3.11 hoặc 3.12 (khuyến nghị dùng virtualenv có sẵn trong repo: `backend/env`)

Lưu ý: Không nên dùng Python hệ thống 3.13 (một số tổ hợp Django/Channels có thể chưa hỗ trợ tốt). Hãy kích hoạt virtualenv của dự án.

---

## 1) Clone dự án
```powershell
# Clone qua GitHub
git clone https://github.com/nong-san-website-2025/du-an-mau-k23-team.git
Set-Location "d:\du-an-mau-k23-team"
```

Nếu dùng Git Desktop:
- **File → Clone repository** → URL → dán: https://github.com/nong-san-website-2025/du-an-mau-k23-team.git
- Chọn thư mục lưu → Clone → Mở VS Code để làm việc

---

## 2) Backend: cài đặt và chạy bằng ASGI (Daphne)

### 2.1 Kích hoạt virtualenv và cài gói
```powershell
Set-Location "d:\du-an-mau-k23-team\backend"
# Kích hoạt virtualenv có sẵn
& .\env\Scripts\Activate.ps1

# Cài đặt gói backend
pip install -r requirements.txt

# Đảm bảo đã cài Daphne (ASGI server)
pip install daphne==4.1.0
```

### 2.2 Khởi tạo database
```powershell
python manage.py makemigrations
python manage.py migrate

# Tạo superuser (để đăng nhập admin)
python manage.py createsuperuser
```

### 2.3 Cấu hình ASGI đúng thứ tự (tránh AppRegistryNotReady)
- Đặt `DJANGO_SETTINGS_MODULE` trước, khởi tạo Django bằng `get_asgi_application()` trước khi import các module phụ thuộc vào Django (như `chat.routing`).
- Kiểm tra `backend/config/asgi.py` như sau:

```python
# backend/config/asgi.py
import os

# Đặt settings trước khi import bất kỳ module phụ thuộc Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from chat.auth import JWTAuthMiddlewareStack

# Khởi tạo Django trước (load apps)
django_asgi_app = get_asgi_application()

# Import routing SAU khi Django đã sẵn sàng để tránh AppRegistryNotReady
from chat import routing as chat_routing

# Ứng dụng ASGI cho cả HTTP và WebSocket
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            chat_routing.websocket_urlpatterns
        )
    ),
})
```

Ngoài ra, trong `backend/config/settings.py` cần có:
```python
ASGI_APPLICATION = 'config.asgi.application'
```

### 2.4 Chạy backend bằng Daphne (bắt buộc để có WebSocket)
```powershell
# Đang ở: d:\du-an-mau-k23-team\backend (đã kích hoạt env)
python -m daphne -b 0.0.0.0 -p 8000 config.asgi:application
```
- Không dùng `python manage.py runserver` vì đó là WSGI, không hỗ trợ WebSocket của Channels.
- Khi chạy thành công, API ở: http://localhost:8000/
- Trang admin: http://localhost:8000/admin/

### 2.5 Ghi chú về Channels layer (broadcast)
- **Mặc định dev** dùng `InMemoryChannelLayer` (OK nếu chạy 1 process duy nhất).
- **Khi chạy nhiều process/worker** (hoặc hot reload sinh thêm process), broadcast WS có thể không tới. Khi đó hãy dùng Redis:
  1) Cài và chạy Redis local (Docker hoặc Redis for Windows).
  2) Thiết lập biến môi trường trước khi chạy Daphne:
     ```powershell
     $env:REDIS_URL = "redis://127.0.0.1:6379/0"
     ```
  3) Backend sẽ tự chuyển sang `channels_redis` khi phát hiện `REDIS_URL`.

---

## 3) Frontend: cài đặt và chạy
```powershell
Set-Location "d:\du-an-mau-k23-team\frontend"
# Nếu gặp xung đột peer deps, dùng --legacy-peer-deps
npm install --legacy-peer-deps
npm start
```
- Mặc định frontend chạy tại http://localhost:3000

---

## 4) Cấu hình và endpoint realtime chat
- **WebSocket endpoint**: `ws://localhost:8000/ws/chat/conv/<conversation_id>/?token=<JWT>`
- **REST endpoints (ví dụ)**:
  - Tạo/lấy cuộc hội thoại: `POST/GET http://localhost:8000/api/chat/conversations/`
  - Lấy/gửi tin nhắn: `GET/POST http://localhost:8000/api/chat/conversations/<id>/messages/`
- Trên client, token JWT truyền qua query `?token=...` sẽ được middleware xác thực (file `backend/chat/auth.py`).

---

## 5) Kiểm tra realtime hoạt động
1. Mở cùng lúc 2 cửa sổ trình duyệt: 1 bên giao diện người mua (có nút bong bóng chat), 1 bên Seller Center → Messages.
2. Gửi tin nhắn từ một bên, bên còn lại phải nhận ngay (không cần F5).
3. Kiểm tra WebSocket trong DevTools → Network → WS:
   - URL: `ws://localhost:8000/ws/chat/conv/<conversation_id>/?token=<JWT>`
   - Status: `101 Switching Protocols`
   - Có frames dữ liệu khi gửi/nhận tin nhắn.
4. Trong UI ChatBox (buyer), chữ "Đang kết nối..." phải biến mất khi WS mở.

---

## 6) Khắc phục sự cố
- **WS không kết nối (không realtime):**
  - Đảm bảo backend chạy bằng Daphne/ASGI (không phải runserver).
  - Kiểm tra DevTools → WS status phải là 101. Nếu 400/403/Close:
    - Token JWT hết hạn/không hợp lệ → đăng nhập lại.
    - Kiểm tra query `?token=<JWT>` đúng chưa.
  - Nếu có nhiều process backend (hot reload, nhiều terminal) → dùng Redis như mục 2.5.
  - Kiểm tra tường lửa Windows không chặn port 8000.

- **AppRegistryNotReady/ImproperlyConfigured:**
  - Sửa file `backend/config/asgi.py` theo mục 2.3 (đặt `os.environ.setdefault(...)` lên trước và khởi tạo Django trước khi import `chat.routing`).
  - Chạy lại Daphne.

- **CORS/CSRF:**
  - Repo đã mở `CORS_ALLOWED_ORIGINS` cho `http://localhost:3000`. Nếu đổi cổng/domain, cập nhật `backend/config/settings.py`.

- **Không tạo được cuộc hội thoại/tin nhắn:**
  - Đảm bảo bạn đã đăng nhập và có `Bearer <token>` trong request.
  - Tạo `seller` trước khi test chat với buyer.

- **NPM peer dependency conflicts:**
  - Chạy `npm install --legacy-peer-deps` trong thư mục `frontend`.

---

## 7) Lệnh mẫu tổng hợp (PowerShell)
```powershell
# Backend
Set-Location "d:\du-an-mau-k23-team\backend"
& .\env\Scripts\Activate.ps1
pip install -r requirements.txt
pip install daphne==4.1.0
python manage.py migrate
python manage.py createsuperuser
python -m daphne -b 0.0.0.0 -p 8000 config.asgi:application

# Frontend (cửa sổ khác)
Set-Location "d:\du-an-mau-k23-team\frontend"
npm install --legacy-peer-deps
npm start
```

---

ionic cap run android -l --external

