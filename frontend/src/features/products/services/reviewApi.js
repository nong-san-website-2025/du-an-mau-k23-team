// services/reviewApi.js
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL; // lấy từ .env

export const reviewApi = {
  getReviews: async (productId) => {
    const res = await axios.get(`${API_URL}/products/${productId}/reviews/`);
    return res.data;
  },

  addReview: async (productId, data) => {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `${API_URL}/products/${productId}/reviews/`,
      { ...data, product: productId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  getMyReview: async (productId) => {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `${API_URL}/reviews/products/${productId}/my-review/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
};
