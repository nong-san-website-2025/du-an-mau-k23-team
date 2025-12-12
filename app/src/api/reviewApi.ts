// src/api/reviewApi.ts
import {API} from "./api";

// 1. Định nghĩa kiểu dữ liệu cho Review (Fix lỗi 'any')
export interface ReviewPayload {
  rating: number;
  comment: string;
}

export const reviewApi = {
  // Lấy danh sách review
  getReviews: (productId: number) => {
    const url = `/reviews/product/${productId}/`; // Đảm bảo đúng endpoint backend
    return API.get(url);
  },

  // Lấy review của chính mình
  getMyReview: (productId: number) => {
    const url = `/reviews/my-review/${productId}/`;
    return API.get(url);
  },

  // Thêm review mới (Sử dụng ReviewPayload thay vì any)
  addReview: (productId: number, data: ReviewPayload) => {
    const url = `/reviews/product/${productId}/add/`; // Endpoint ví dụ
    return API.post(url, data);
  },
};