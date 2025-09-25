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

    # Xoá sqlite3 trong backend/sqlite3(Nếu có)
    
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
    npm install --legacy-peer-deps

    # Chạy frontend
    npm start


### Hướng dẫn dùng tạm sqlite3
```bash
 - Vao settings.py của backend/config/settings.py đổi đoạn:
  else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': 'ecom_db',
            'USER': 'postgres',
            'PASSWORD': '12345',
            'HOST': 'localhost',
            'PORT': '5432',
        }
    } thành đoạn:
  else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
```

## Chay products ví dụ mẫu để code(Trước đó hãy tạo seller)
```
cd backend
- Chạy mẫu user
python manage.py seed_users
- Chạy mẫu seller
python manage.py seed_sellers
- Chạy mẫu products
python manage.py generate_sample_products
```


