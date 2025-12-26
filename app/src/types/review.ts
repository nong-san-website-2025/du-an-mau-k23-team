// types/review.ts (hoặc định nghĩa ngay trong file service nếu dự án nhỏ)

// Interface cho dữ liệu trả về từ Server
export interface Review {
  id: number;
  user: {
    id: number;
    username: string;
    avatar?: string;
  };
  product: number;
  rating: number;
  comment: string;
  created_at: string;
  // Thêm các trường khác nếu backend trả về (vd: images)
}

// Interface cho dữ liệu gửi lên khi tạo review
export interface CreateReviewData {
  rating: number;
  comment: string;
  images?: File[]; // Nếu có upload ảnh
}