import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

export const fetchPopularAdvertisements = () => {
  return axios.get(`${API_BASE_URL}/advertisements/active/`);
};

export const fetchBanners = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/advertisements/banner/`);
    return res.data.banners; // chỉ lấy banners
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
};
export const fetchCategories = () => axios.get(`${API_BASE_URL}/products/categories/`);
// Flash sale: backend đang mount dưới /api/promotions/flashsales/
export const fetchFlashSale = () => axios.get(`${API_BASE_URL}/promotions/flashsales/`);

// Recommendations: chưa thấy endpoint backend -> tạm thời trả về mảng rỗng để tránh 404
export const fetchUserRecommendations = async (token) => {
  try {
    // Nếu sau này có endpoint, đổi URL tại đây
    const res = await axios.get(`${API_BASE_URL}/recommendations/`, {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });
    return res;
  } catch (e) {
    return { data: [] };
  }
};