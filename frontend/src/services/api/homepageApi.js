import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

export const fetchPopularAdvertisements = () => {
  return axios.get(`${API_BASE_URL}/advertisements/active/`);
};

export const fetchBanners = () => axios.get(`${API_BASE_URL}/banners/`);
export const fetchCategories = () => axios.get(`${API_BASE_URL}/products/categories/`);
export const fetchFlashSale = () => axios.get(`${API_BASE_URL}/flash-sale/`);
export const fetchUserRecommendations = (token) =>
  axios.get(`${API_BASE_URL}/recommendations/`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });