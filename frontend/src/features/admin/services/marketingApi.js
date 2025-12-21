import axiosClient from "./axiosClient"; 

// 1. API DÙNG CHO ADMIN (Lấy tất cả: Active, Inactive, Quá khứ, Tương lai)
export const getAdminBanners = (slotCode = "") => {
  const url = slotCode 
    ? `/marketing/banners/?slot=${slotCode}` 
    : `/marketing/banners/`;
  return axiosClient.get(url);
};

// 2. API DÙNG CHO TRANG CHỦ (Chỉ lấy banner đang chạy: scope=public)
export const getPublicBanners = (slotCode) => {
  return axiosClient.get(`/marketing/banners/?slot=${slotCode}&scope=public`);
};

// 2.5. Alias cho getPublicBanners - dùng chung cho cả public và admin
export const getBannersBySlot = (slotCode) => {
  return axiosClient.get(`/marketing/banners/?slot=${slotCode}&scope=public`);
};

// 3. Các API CRUD khác
export const getAdSlots = () => axiosClient.get("/marketing/slots/");
export const createBanner = (data) => axiosClient.post("/marketing/banners/", data);
export const updateBanner = (id, data) => axiosClient.put(`/marketing/banners/${id}/`, data);
export const deleteBanner = (id) => axiosClient.delete(`/marketing/banners/${id}/`);