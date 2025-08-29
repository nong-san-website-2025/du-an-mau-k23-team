# 🌾 Dự án Website Sàn Thương Mại Nông Sản

## Nếu dùng Git Desktop
    - Nhấn vào File/Clone repository từ GitHub
    - Qua URL
    - Nhập link: https://github.com/nong-san-website-2025/du-an-mau-k23-team.git
    - Chọn folder muốn lưu trữ project(Lâu dài)
    - Click Clone
    - Chọn nhánh của mình
    - Mở viusual rồi code thôi ae
    - Chuyển qua bước 2 luôn

## 📥 Bước 1: Clone source về

```bash
git https://github.com/nong-san-website-2025/du-an-mau-k23-team.git
cd du-an-mau-k23-team

```
## 📦 Bước 2: Cài đặt các gói phụ thuộc cho cả frontend và backend

### Cài đặt backend:
    cd backend
    python -m venv env
    # Windows: 
    env\Scripts\activate
    pip install -r requirements.txt

    # Migrate database (tự tạo file SQLite)

    python manage.py makemigrations
    
    python manage.py migrate

    #Tao superuser

    python manage.py createsuperuser
    
    Vd: - username: admin
        - email: admin@gmail.com
        - password: 123
        - xac thuc pass: 123
        - Nhan Y roi Enter
    

    # Chạy server backend
    python manage.py runserver
    
### Cài đặt frontend:

    cd ../frontend
    npm install

    # Chạy frontend
    npm start

### Chay sample_products.py de tao san pham demo
from generate_sample_products import generate_sample_products
generate_sample_products()

#


