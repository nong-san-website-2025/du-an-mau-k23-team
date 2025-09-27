// services/marketingService.js
import API from "../../login_register/services/api.js";

// Banner
export const getBanners = () => API.get("/marketing/banners/");

// Flash Sale
export const getFlashSales = () => API.get("/marketing/flashsales/");
export const createFlashSale = (data) => API.post("/marketing/flashsales/", data);
export const updateFlashSale = (id, data) => API.patch(`/marketing/flashsales/${id}/`, data);
export const deleteFlashSale = (id) => API.delete(`/marketing/flashsales/${id}/`);

// Voucher
export const getVouchers = () => API.get("/marketing/vouchers/");
