import API from "../../login_register/services/api.js";

export const getBanners = () => API.get("/marketing/admin/banners/");
export const getFlashSales = () => API.get("/marketing/flash-sales/");
export const getVouchers = () => API.get("/marketing/vouchers/");
