import api from "./api";

const reviewService = {
  // Lấy danh sách đánh giá của seller
  getSellerReviews: async (params = {}) => {
    // 1. Lọc bỏ các giá trị null, undefined, rỗng hoặc "all" để URL sạch đẹp
    // Ví dụ: { rating: "all", search: "" } -> {}
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null && v !== "" && v !== "all")
    );

    // 2. Truyền thẳng vào axios, nó sẽ tự biến thành ?page=1&rating=5...
    const res = await api.get("/reviews/seller/reviews/", { 
      params: cleanParams 
    });
    
    return res.data;
  },

  // Lấy thống kê đánh giá
  getSellerReviewsSummary: async (params = {}) => {
    // Tương tự, làm sạch params trước khi gửi
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null && v !== "")
    );

    const res = await api.get("/reviews/seller/reviews/summary/", { 
      params: cleanParams 
    });
    return res.data;
  },

  // Lấy hoạt động gần đây
  getRecentActivities: async (limit = 5) => {
    const res = await api.get("/reviews/seller/reviews/recent-activities/", {
      params: { limit }
    });
    return res.data;
  },

  // Trả lời đánh giá
  replyToReview: async (reviewId, replyText) => {
    const res = await api.post("/reviews/review-replies/", {
      review: reviewId, // ID review
      reply_text: replyText
    });
    return res.data;
  },

  // Lấy chi tiết đánh giá
  getReviewDetail: async (reviewId) => {
    const res = await api.get(`/reviews/reviews/${reviewId}/`);
    return res.data;
  },

  // Lấy danh sách reply của một review
  getReviewReplies: async (reviewId) => {
    const res = await api.get("/reviews/review-replies/", {
      params: { review: reviewId }
    });
    return res.data;
  }
};

export default reviewService;