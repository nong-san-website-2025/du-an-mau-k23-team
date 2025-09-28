// services/marketingService.js
import API from "../../login_register/services/api.js";

// Banner
export const getBanners = () => API.get("/marketing/banners/");

// Flash Sale

export const getBannersByPosition = (position) => 
  API.get(`/marketing/banners/?position=${position}`);