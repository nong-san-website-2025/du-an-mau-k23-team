import axios from "axios";
import { Review, CreateReviewData } from "../types/review"; // Import các interface ở trên

// Đảm bảo biến môi trường được nhận diện là string
const API_URL = process.env.REACT_APP_API_URL as string; 

export const reviewApi = {
  // 1. Lấy danh sách review
  getReviews: async (productId: number | string): Promise<Review[]> => {
    // Lưu ý: Nếu backend trả về phân trang (pagination), kiểu trả về có thể là { results: Review[], count: number }
    const res = await axios.get<Review[]>(`${API_URL}/products/${productId}/reviews/`);
    return res.data;
  },

  // 2. Thêm review mới
  addReview: async (productId: number | string, data: CreateReviewData): Promise<Review> => {
    const token = localStorage.getItem("token");
    
    // Gộp productId vào payload nếu backend yêu cầu field 'product' trong body
    const payload = { ...data, product: productId };

    const res = await axios.post<Review>(
      `${API_URL}/products/${productId}/reviews/`,
      payload,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          // Nếu có upload ảnh, bạn có thể cần 'Content-Type': 'multipart/form-data'
        }, 
      }
    );
    return res.data;
  },

  // 3. Lấy review của chính mình
  getMyReview: async (productId: number | string): Promise<Review | null> => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get<Review>(
        `${API_URL}/reviews/products/${productId}/my-review/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (error) {
      // Xử lý trường hợp chưa có review (thường backend trả 404)
      return null;
    }
  },
};