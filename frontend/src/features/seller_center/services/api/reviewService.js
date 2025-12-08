import api from "../../../login_register/services/api";

const reviewService = {
  // Lấy danh sách đánh giá của seller
  getSellerReviews: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.product_id) queryParams.append('product_id', params.product_id);
    if (params.seller_id) queryParams.append('seller_id', params.seller_id);
    if (params.store_name) queryParams.append('store_name', params.store_name);

    const queryString = queryParams.toString();
    const url = `/reviews/seller/reviews/${queryString ? '?' + queryString : ''}`;

    const res = await api.get(url);
    return res.data;
  },

  // Lấy thống kê đánh giá
  getSellerReviewsSummary: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.year) queryParams.append('year', params.year);
    if (params.month) queryParams.append('month', params.month);

    const queryString = queryParams.toString();
    const url = `/reviews/seller/reviews/summary/${queryString ? '?' + queryString : ''}`;

    const res = await api.get(url);
    return res.data;
  },

  // Lấy hoạt động gần đây
  getRecentActivities: async (limit = 5) => {
    const res = await api.get(`/reviews/seller/reviews/recent-activities/?limit=${limit}`);
    return res.data;
  },

  // Trả lời đánh giá
  replyToReview: async (reviewId, replyText) => {
    const res = await api.post(`/reviews/review-replies/`, {
      review: reviewId,
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
    const res = await api.get(`/reviews/review-replies/?review=${reviewId}`);
    return res.data;
  }
};

export default reviewService;