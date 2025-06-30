# 🌾 Dự án Website Sàn Thương Mại Nông Sản

## 🚀 Giới thiệu
Dự án xây dựng một sàn thương mại điện tử chuyên về nông sản, bao gồm:
- Frontend: ReactJS
- Backend: Django REST Framework
- Database: SQLite3 (mặc định của Django)

---

## Nếu dùng Git Desktop
    - Nhấn vào File/Clone repository từ GitHub
    - Qua URL
    - Nhập link: https://github.com/nong-san-website-2025/du-an-mau-k23-team.git
    - Chọn folder muốn lưu trữ project(Lâu dài)
    - Click Clone
    - Chọn nhánh của mình
    - Mở viusual rồi code thôi ae


## 📁 Cấu trúc thư mục
```bash
├── frontend/
│   ├── src/
│   │   └── ...
│   ├── package.json
│   └── README.md
└── backend/
    ├── api/
    │   └── ...
    ├── manage.py
    └── README.md
```

## Nếu dùng Terminal

 Bước cơ bản: 
    Tạo thư mục với hẳn làm nhe, đẻ clone về thư mục đó chứ ko để lung tung rồi mở terminal làm như bên dưới


## 📥 Bước 1: Clone source về

```bash
git https://github.com/nong-san-website-2025/du-an-mau-k23-team.git
cd du-an-mau-k23-team

```
## 📦 Bước 2: Cài đặt các gói phụ thuộc cho cả frontend và backend

### Cài đặt backend:
    cd backend
    python -m venv env
    # Windows: env\Scripts\activate
    pip install -r requirements.txt

    # Migrate database (tự tạo file SQLite)
    
    python manage.py migrate

    # Chạy server backend
    python manage.py runserver
    
### Cài đặt frontend:

    cd ../frontend
    npm install

    # Chạy frontend
    npm start


<!-- ## Bước 3: Lấy branch để làm(tô có thể mỗi branch riêng cho từng người)

    git checkout -b feature/<ten-chuc-nang>(của người đảm nhiệm chức năng đó)
    # sau khi code
    git add .
    git commit -m "feat: mô tả chức năng"
    git push origin feature/<ten-chuc-nang> -->