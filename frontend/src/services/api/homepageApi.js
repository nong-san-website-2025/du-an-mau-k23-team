import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/advertisements";

export const fetchBanners = () => {
  return axios.get(`${API_BASE_URL}/active/`);
};

export const fetchBannerDetail = (id) => {
  return axios.get(`${API_BASE_URL}/${id}/`);
};

export const fetchFlashSale = () => {
  return axios.get("http://localhost:8000/api/products/flash-sale/");
};

export const fetchUserRecommendations = (token) => {
  return axios.get("http://localhost:8000/api/user/recommendations/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
