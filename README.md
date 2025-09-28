# 🌾 Dự án Website Sàn Thương Mại Nông Sản

## Cài đặt backend:
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
    
## Cài đặt frontend:

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

### Chay products ví dụ mẫu để code
```
cd backend
- python manage.py seed_all
Nó sẽ tạo ra mẫu customer, selle
- Vd: customer1, customer2, seller1, seller2 với cùng 1 mật khẩu là "123456"
```

## Cài đặt App
    cd app
    npm start(Chạy xong nó sẽ hiển thị 1 cái QR)
    - Mở app Expo trên điện thoại, quét cái mã này, nó sẽ hiển thị giao diện App ra

