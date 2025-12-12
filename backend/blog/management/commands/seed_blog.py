from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from blog.models import BlogCategory, BlogPost, Comment, Like
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class Command(BaseCommand):
    help = "Seed dữ liệu mẫu cho Blog (6 bài viết)"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("🚀 Bắt đầu seed Blog data...\n"))

        # Tạo categories
        self.stdout.write("▶️ Tạo Blog Categories...")
        categories = {
            'technology': BlogCategory.objects.get_or_create(name='Công Nghệ')[0],
            'business': BlogCategory.objects.get_or_create(name='Kinh Doanh')[0],
            'tips': BlogCategory.objects.get_or_create(name='Mẹo & Thủ Thuật')[0],
            'news': BlogCategory.objects.get_or_create(name='Tin Tức')[0],
        }
        self.stdout.write(self.style.SUCCESS("✅ Categories tạo thành công\n"))

        # Lấy hoặc tạo admin user
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.create_superuser(
                email='admin@example.com',
                password='admin123'
            )
            self.stdout.write(f"✅ Tạo admin user: {admin_user.email}\n")

        # Sample blog posts data
        blog_posts_data = [
            {
                'title': 'Hướng Dẫn Bán Hàng Online Hiệu Quả Trên Nền Tảng E-Commerce',
                'content': '''Bán hàng online đã trở thành một phần không thể thiếu trong kinh doanh hiện đại. 
Nếu bạn muốn thành công trong lĩnh vực này, cần phải hiểu rõ các chiến lược và kỹ năng cơ bản.

1. **Chuẩn Bị Sản Phẩm**
- Chọn sản phẩm đúng thị trường
- Tối ưu hóa hình ảnh và mô tả
- Đặt giá cạnh tranh

2. **Xây Dựng Thương Hiệu**
- Tạo logo chuyên nghiệp
- Viết mô tả shop hấp dẫn
- Tương tác với khách hàng thường xuyên

3. **Marketing và Quảng Cáo**
- Sử dụng social media
- Chạy quảng cáo đúng đắn
- Xây dựng cộng đồng khách hàng

Để thành công, bạn cần kiên nhẫn, học hỏi liên tục và luôn lắng nghe feedback từ khách hàng.''',
                'category': categories['business'],
                'views': 1250,
            },
            {
                'title': 'Top 5 Công Nghệ Nông Nghiệp Hiện Đại Thay Đổi Ngành',
                'content': '''Công nghệ ngày càng phát triển và đang cách mạng hóa ngành nông nghiệp. 
Dưới đây là 5 công nghệ hàng đầu mà mọi nông dân hiện đại nên biết:

1. **IoT (Internet of Things) trong nông nghiệp**
   - Cảm biến thông minh giám sát đất, nước
   - Tự động hóa tưới tiêu

2. **Drone và Máy Bay Không Người Lái**
   - Theo dõi sức khỏe cây trồng
   - Phun thuốc bảo vệ cây chính xác

3. **Trí Tuệ Nhân Tạo (AI)**
   - Dự báo thời tiết chính xác
   - Phát hiện sâu bệnh sớm

4. **Blockchain**
   - Truy xuất nguồn gốc sản phẩm
   - Nâng cao giá trị sản phẩm

5. **Big Data Analytics**
   - Phân tích dữ liệu để tối ưu hóa sản xuất
   - Dự báo nhu cầu thị trường

Những công nghệ này giúp tăng năng suất, giảm chi phí và bảo vệ môi trường.''',
                'category': categories['technology'],
                'views': 2840,
            },
            {
                'title': '10 Mẹo Tăng Doanh Số Bán Hàng Cho Shop Seller',
                'content': '''Muốn tăng doanh số bán hàng? Dưới đây là 10 mẹo thực tế mà các shop bán hàng thành công sử dụng:

**Mẹo Thực Tế:**

1. **Tối ưu hóa tiêu đề sản phẩm** - Dùng từ khóa người dùng hay tìm kiếm
2. **Chất lượng hình ảnh** - Ảnh sắc nét, nhiều góc nhìn
3. **Giá cạnh tranh** - Nghiên cứu giá đối thủ
4. **Chương trình khuyến mãi** - Flash sale, discount thông minh
5. **Giao hàng nhanh** - Đăng ký giao hàng hỏa tốc
6. **Dịch vụ khách hàng** - Trả lời nhanh, chuyên nghiệp
7. **Đánh giá và review** - Khuyến khích khách hàng để đánh giá
8. **Video sản phẩm** - Quay video demo sản phẩm
9. **Bundle deals** - Gộp sản phẩm giảm giá
10. **Email marketing** - Gửi email về sản phẩm mới, khuyến mãi

Áp dụng những mẹo này sẽ giúp shop của bạn nổi bật và bán chạy hơn!''',
                'category': categories['tips'],
                'views': 3120,
            },
            {
                'title': 'Xu Hướng E-Commerce Việt Nam Năm 2024',
                'content': '''Thị trường e-commerce Việt Nam tiếp tục phát triển mạnh mẽ với những xu hướng mới đáng chú ý:

**Các Xu Hướng Chính:**

📱 **Mobile-First Shopping**
- Ngày càng nhiều người mua sắm qua điện thoại
- Ứng dụng mobile trở thành ưu tiên của các sàn

🎥 **Live Streaming Commerce**
- Bán hàng trực tiếp qua video sống
- Tương tác trực tiếp với khách hàng

🔄 **Sustainable & Eco-Friendly**
- Các sản phẩm thân thiện môi trường được ưa chuộng
- Packaging tái chế tăng lên

💳 **Omnichannel Experience**
- Kết nối giữa online và offline
- Mua online, lấy tại cửa hàng

🤖 **AI & Personalization**
- Gợi ý sản phẩm cá nhân hóa
- Chatbot hỗ trợ khách hàng 24/7

💰 **Fintech Integration**
- Nhiều hình thức thanh toán linh hoạt
- Ứng dụng tài chính tích hợp trên sàn

Để cạnh tranh, các seller cần nắm bắt những xu hướng này và thích ứng nhanh chóng.''',
                'category': categories['news'],
                'views': 4560,
            },
            {
                'title': 'Cách Quản Lý Kho Hàng Hiệu Quả Cho Tiểu Thương',
                'content': '''Quản lý kho hàng là yếu tố quan trọng quyết định hiệu quả kinh doanh của tiểu thương.

**Quy Trình Quản Lý Kho Hiệu Quả:**

1. **Lập Kế Hoạch Hàng Hóa**
   - Dự báo nhu cầu khách
   - Đặt hàng đúng lượng, đúng thời điểm
   - Tránh hàng tồn kho

2. **Phân Loại Hàng Hóa**
   - Sử dụng phương pháp ABC (phân loại theo giá trị)
   - Sắp xếp kho hợp lý

3. **Kiểm Kê Thường Xuyên**
   - Kiểm kê hàng hóa định kỳ
   - Phát hiện sớm hàng hỏng, mất mát
   - Cập nhật số liệu chính xác

4. **Lưu Trữ Khoa Học**
   - Bảo quản theo đặc tính hàng hóa
   - Kiểm soát nhiệt độ, độ ẩm
   - Phòng chữa cháy, an toàn

5. **Sử Dụng Công Nghệ**
   - Phần mềm quản lý kho
   - Barcode, QR code
   - Hệ thống theo dõi tự động

6. **Quản Lý Nhân Sự**
   - Đào tạo nhân viên kho
   - Phân công công việc rõ ràng
   - Kiểm tra chất lượng công việc

Với các biện pháp trên, bạn sẽ giảm chi phí, tăng hiệu quả và nâng cao dịch vụ khách hàng.''',
                'category': categories['tips'],
                'views': 2150,
            },
            {
                'title': 'Blockchain và Công Nghệ Web3 - Tương Lai của E-Commerce',
                'content': '''Blockchain và Web3 đang dần thay đổi cách người ta kinh doanh trực tuyến. 
Hãy tìm hiểu về công nghệ tương lai này:

**Blockchain Là Gì?**
Blockchain là một công nghệ lưu trữ dữ liệu phân tán, an toàn và trong suốt. 
Mỗi giao dịch được mã hóa và liên kết với nhau tạo thành một chuỗi không thể thay đổi.

**Ứng Dụng Trong E-Commerce:**

✅ **Truy Xuất Sản Phẩm**
- Theo dõi sản phẩm từ nhà máy đến tay khách
- Chứng minh sản phẩm là hàng chính hãng

✅ **Thanh Toán An Toàn**
- Giao dịch nhanh chóng, bảo mật
- Giảm chi phí trung gian

✅ **Smart Contracts**
- Hợp đồng tự động thực hiện
- Tiết kiệm thời gian, chi phí pháp lý

✅ **NFTs và Sản Phẩm Kỹ Thuật Số**
- Bán các sản phẩm kỹ thuật số độc quyền
- Xác thực quyền sở hữu

**Tương Lai:**
Web3 sẽ cho phép những tương tác P2P (peer-to-peer) trực tiếp, 
giảm sự phụ thuộc vào các nền tảng trung tâm.

Mặc dù còn trong giai đoạn phát triển, 
blockchain chắc chắn sẽ là một phần quan trọng của e-commerce tương lai.''',
                'category': categories['technology'],
                'views': 1890,
            },
        ]

        # Tạo blog posts
        self.stdout.write("▶️ Tạo 6 bài viết Blog...")
        created_count = 0
        for post_data in blog_posts_data:
            post, created = BlogPost.objects.get_or_create(
                title=post_data['title'],
                defaults={
                    'author': admin_user,
                    'category': post_data['category'],
                    'content': post_data['content'],
                    'is_published': True,
                    'views': post_data['views'],
                    'created_at': timezone.now() - timedelta(days=created_count),
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f"  ✅ {post.title}")

        self.stdout.write(self.style.SUCCESS(f"\n✅ Tạo thành công {created_count} bài viết\n"))

        # Tạo comments mẫu
        self.stdout.write("▶️ Tạo Comments mẫu...")
        test_user = User.objects.filter(email__contains='user').first() or admin_user
        
        posts = BlogPost.objects.all()[:3]  # Thêm comment cho 3 bài đầu
        comments_created = 0
        
        for post in posts:
            Comment.objects.get_or_create(
                post=post,
                author=test_user,
                defaults={
                    'content': 'Bài viết rất hữu ích! Cảm ơn tác giả đã chia sẻ kiến thức quý báu này.',
                    'is_approved': True,
                }
            )
            comments_created += 1

        self.stdout.write(self.style.SUCCESS(f"✅ Tạo {comments_created} comment\n"))

        # Tạo likes mẫu
        self.stdout.write("▶️ Tạo Likes mẫu...")
        likes_created = 0
        
        for post in posts:
            Like.objects.get_or_create(
                post=post,
                user=test_user,
            )
            likes_created += 1

        self.stdout.write(self.style.SUCCESS(f"✅ Tạo {likes_created} like\n"))

        self.stdout.write(self.style.SUCCESS("🎉 Hoàn tất seed Blog data!"))
