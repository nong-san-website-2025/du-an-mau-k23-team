# Hướng dẫn Tối ưu hóa Thông báo với SSE (Server-Sent Events)

## Tổng quan

Hệ thống thông báo đã được tối ưu hóa bằng cách sử dụng **SSE (Server-Sent Events)** thay vì polling liên tục. Điều này giúp:

- ✅ **Giảm tải server**: Không còn request liên tục mỗi 2 giây
- ✅ **Tiết kiệm băng thông**: Chỉ gửi dữ liệu khi có thông báo mới
- ✅ **Real-time**: Thông báo được đẩy ngay lập tức từ server → client
- ✅ **Hiệu quả hơn**: Chỉ duy trì 1 kết nối HTTP duy nhất

## Cách hoạt động

### Trước đây (Polling):
```
Client → Server: "Có thông báo mới không?" (mỗi 2 giây)
Server → Client: "Không" / "Có, đây là dữ liệu"
```
❌ Tốn tài nguyên, nhiều request không cần thiết

### Bây giờ (SSE):
```
Client → Server: Mở kết nối SSE (1 lần duy nhất)
Server → Client: Đẩy thông báo khi có dữ liệu mới
```
✅ Nhẹ hơn, hiệu quả hơn, real-time

## Cấu trúc Code

### Backend (Django)

#### 1. SSE View (`backend/users/views.py`)
```python
class NotificationSSEView(APIView):
    # Endpoint: /api/notifications/sse/
    # Mở kết nối SSE và giữ liên tục
    # Gửi ping mỗi 30s để giữ kết nối
```

#### 2. Trigger Notification (`backend/users/views.py`)
```python
class TriggerNotificationView(APIView):
    # Endpoint: /api/notifications/trigger/
    # Trigger thông báo mới cho user qua SSE
```

#### 3. Helper Function
```python
def send_notification_to_user(user_id, data):
    # Gửi thông báo đến tất cả kết nối SSE của user
```

### Frontend (React)

#### 1. SSE Manager (`frontend/src/services/sseService.js`)
```javascript
class SSEManager {
  connect(userId)      // Mở kết nối SSE
  disconnect()         // Đóng kết nối
  addListener()        // Đăng ký callback khi có thông báo
  removeListener()     // Hủy đăng ký callback
}
```

#### 2. UserActions Component (`frontend/src/Layout/Header/UserActions.jsx`)
```javascript
// Sử dụng SSE thay vì polling
useEffect(() => {
  sseManager.connect(userId);
  sseManager.addListener(handleSSEUpdate);
  
  return () => {
    sseManager.disconnect();
  };
}, [userId]);
```

#### 3. Notification Helper (`frontend/src/utils/notificationHelper.js`)
```javascript
// Helper để trigger thông báo mới
export const addNotification = (notification) => {
  // Lưu vào localStorage
  // Trigger SSE update
}
```

## Cách sử dụng

### 1. Khi tạo thông báo mới

**Cách cũ:**
```javascript
const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
notifications.push(newNotification);
localStorage.setItem('notifications', JSON.stringify(notifications));
```

**Cách mới (khuyến nghị):**
```javascript
import { addNotification } from '../utils/notificationHelper';

addNotification({
  id: Date.now(),
  title: "Thông báo mới",
  message: "Nội dung thông báo",
  time: new Date().toISOString(),
  read: false
});
```

### 2. Component tự động nhận thông báo

Không cần làm gì thêm! Component `UserActions` đã tự động:
- Kết nối SSE khi user đăng nhập
- Nhận thông báo real-time
- Cập nhật UI ngay lập tức
- Ngắt kết nối khi user đăng xuất

## API Endpoints

### 1. SSE Connection
```
GET /api/notifications/sse/?token=<JWT_TOKEN>
Content-Type: text/event-stream
```

**Response Stream:**
```
data: {"type": "notification", "data": {...}}

data: {"type": "ping"}
```

### 2. Trigger Notification
```
POST /api/notifications/trigger/
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "user_id": 123,
  "notification": {
    "title": "Thông báo mới",
    "message": "Nội dung"
  }
}
```

## Tính năng

### ✅ Auto-reconnect
- Tự động kết nối lại sau 5 giây nếu mất kết nối
- Không làm gián đoạn trải nghiệm người dùng

### ✅ Multi-tab Support
- Mỗi tab có kết nối SSE riêng
- Đồng bộ trạng thái "đã đọc" qua localStorage events

### ✅ Fallback
- Vẫn refresh khi window focus (phòng trường hợp SSE lỗi)
- Đảm bảo luôn có dữ liệu mới nhất

### ✅ Ping/Pong
- Server gửi ping mỗi 30s để giữ kết nối
- Client bỏ qua ping messages

## So sánh hiệu suất

### Polling (cũ):
- **Request/phút**: 30 requests (mỗi 2 giây)
- **Request/giờ**: 1,800 requests
- **Request/ngày**: 43,200 requests
- **Băng thông**: Cao (nhiều request không cần thiết)

### SSE (mới):
- **Request/phút**: 0 (chỉ 1 kết nối duy nhất)
- **Request/giờ**: 0 (kết nối liên tục)
- **Request/ngày**: 1 (chỉ kết nối ban đầu)
- **Băng thông**: Thấp (chỉ gửi khi có dữ liệu)

**Tiết kiệm**: ~99.99% số lượng requests!

## Lưu ý

1. **CORS**: Đảm bảo backend cho phép SSE từ frontend domain
2. **Timeout**: Kết nối SSE có thể bị timeout sau 30-60 phút (tùy server)
3. **Browser Support**: SSE được hỗ trợ trên tất cả trình duyệt hiện đại
4. **Proxy/Load Balancer**: Cần cấu hình để không buffer SSE responses

## Troubleshooting

### Kết nối SSE không hoạt động?
1. Kiểm tra console log: `✅ SSE connected for notifications`
2. Kiểm tra Network tab: Request `/api/notifications/sse/` có status `200` và `pending`
3. Kiểm tra token JWT còn hạn

### Không nhận được thông báo?
1. Kiểm tra `send_notification_to_user()` có được gọi khi tạo thông báo
2. Kiểm tra `user_id` đúng
3. Kiểm tra console log: `📬 Received notification via SSE`

### Kết nối bị ngắt liên tục?
1. Kiểm tra server timeout settings
2. Kiểm tra proxy/load balancer configuration
3. Auto-reconnect sẽ tự động kết nối lại sau 5 giây

## Tương lai

Có thể mở rộng SSE cho:
- 💬 Chat real-time
- 📦 Cập nhật trạng thái đơn hàng
- 🔔 Thông báo hệ thống
- 📊 Dashboard real-time updates

---

**Tác giả**: Team K23  
**Ngày cập nhật**: 2024