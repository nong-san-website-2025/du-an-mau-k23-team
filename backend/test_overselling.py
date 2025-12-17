import requests
import threading
import sys

# === CẤU HÌNH (SỬA LẠI CHO ĐÚNG) ===
BASE_URL = "http://localhost:8000/api"  # URL gốc của backend
LOGIN_URL = f"{BASE_URL}/token/"        # Hoặc /users/login/ tùy project bạn
ORDER_URL = f"{BASE_URL}/orders/"       # API đặt hàng

# Tài khoản dùng để test (Nên dùng user thường, không phải admin nếu được)
USERNAME = "customer6"      
PASSWORD = "123456"

PRODUCT_ID = 1  # ID sản phẩm (nhớ set kho = 1 trước khi chạy)
THREADS = 10     # Số lượng người mua cùng lúc

# ===============================================

def get_access_token():
    """Hàm tự động đăng nhập để lấy Token"""
    print(f"🔄 Đang đăng nhập tài khoản: {USERNAME}...")
    try:
        response = requests.post(LOGIN_URL, data={"username": USERNAME, "password": PASSWORD})
        
        if response.status_code != 200:
            print("❌ Đăng nhập thất bại! Kiểm tra lại username/password/URL login.")
            print("Response:", response.text)
            sys.exit(1) # Dừng chương trình luôn
            
        data = response.json()
        token = data.get("access") or data.get("token") # Lấy token (tùy format trả về)
        if not token:
            print("❌ Không tìm thấy token trong phản hồi login.")
            sys.exit(1)
            
        print("✅ Đăng nhập thành công! Đã lấy được Token.")
        return token
    except Exception as e:
        print(f"❌ Lỗi kết nối Login: {e}")
        sys.exit(1)

# ===============================================

# Lấy token tươi mới
TOKEN = get_access_token()

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

payload = {
    "items": [
        {
            "product": PRODUCT_ID,  # <-- Lưu ý: Nếu API báo lỗi "product is required" thì đổi lại thành "product" nhé (thường DRF dùng tên field là "product")
            "quantity": 1,
            "price": 500000         # <--- QUAN TRỌNG: Thêm dòng này vào! (Số tiền tùy ý)
        }
    ],
    "address": "Test Address",
    "phone": "0987654321"
}

results = {"success": 0, "fail": 0, "errors": []}

def buy_product(thread_name):
    try:
        response = requests.post(ORDER_URL, json=payload, headers=headers)
        
        if response.status_code in [200, 201]:
            print(f"✅ User {thread_name}: Mua THÀNH CÔNG!")
            results["success"] += 1
        elif response.status_code == 400:
             # Lỗi 400 thường là hết hàng -> Tốt
            print(f"🛡️ User {thread_name}: Bị chặn (Hết hàng/Lỗi logic) - {response.text}")
            results["fail"] += 1
        elif response.status_code == 401:
            print(f"❌ User {thread_name}: Lỗi Token (401)")
            results["errors"].append("Auth Error")
        else:
            print(f"⚠️ User {thread_name}: Lỗi khác ({response.status_code}) - {response.text}")
            results["fail"] += 1
            
    except Exception as e:
        print(f"User {thread_name} lỗi connect: {e}")

# === BẮT ĐẦU CHẠY ===
print(f"\n--- BẮT ĐẦU SPAM {THREADS} REQUEST ---")

threads = []
for i in range(THREADS):
    t = threading.Thread(target=buy_product, args=(i,))
    threads.append(t)
    t.start()

for t in threads:
    t.join()

print("\n--- KẾT QUẢ CUỐI CÙNG ---")
print(f"Số đơn thành công: {results['success']}")
print(f"Số đơn bị chặn:    {results['fail']}")

if results['success'] > 1:
    print("🚨 LỖI: BỊ OVERSENLLING! (Bán lố rồi)")
elif results['success'] == 1:
    print("✅ TEST THÀNH CÔNG: Chỉ bán được đúng 1 đơn.")
else:
    print("⚠️ KỲ LẠ: Không bán được đơn nào (Check lại logic code hoặc data).")