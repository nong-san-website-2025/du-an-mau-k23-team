// services/reviewApi.js
import axios from "axios";

export const reviewApi = {
  getReviews: async (productId) => {
    const res = await axios.get(`http://localhost:8000/api/products/${productId}/reviews/`);
    return res.data;
  },

  // services/reviewApi.js
  addReview: async (productId, data) => {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `http://localhost:8000/api/products/${productId}/reviews/`,
      { ...data, product: productId },   // 👈 tự động thêm
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

    getMyReview: async (productId) => {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `http://localhost:8000/api/products/${productId}/reviews/me/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

};
