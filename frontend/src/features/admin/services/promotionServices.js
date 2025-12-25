import axiosClient from "./axiosClient";
const API_URL = "/promotions"; // axiosClient đã có baseURL

// ===============================================
// CÁC HÀM API CHUNG & CHO USER (Giữ nguyên)
// ===============================================

// User nhận voucher từ kho (claim)
export const claimVoucher = async (code) => {
  try {
    const res = await axiosClient.post(
      `${API_URL}/vouchers/claim/`,
      { code }
    );
    return res.data;
  } catch (error) {
    console.error("Claim voucher error:", error.response?.data || error.message);
    throw error;
  }
};

// Lấy danh sách voucher đã sở hữu (túi voucher)
export const getMyVouchers = async () => {
  const res = await axiosClient.get(`${API_URL}/vouchers/my_vouchers/`);
  return res.data;
};

// Áp dụng voucher (cập nhật để gửi kèm product_ids)
export const applyVoucher = async (code, orderTotal, product_ids) => {
  const res = await axiosClient.post(`/promotions/vouchers/apply/`, {
    code: code,
    order_total: orderTotal,
    product_ids: product_ids, // Gửi kèm danh sách ID sản phẩm trong giỏ hàng
  });
  return res.data;
};

// Consume voucher (đánh dấu đã dùng khi order thành công)
export const consumeVoucher = async (code, orderTotal) => {
  const res = await axiosClient.post(`/promotions/vouchers/consume/`, {
    code: code,
    order_total: orderTotal,
  });
  return res.data;
};

// ===============================================
// API CHO ADMIN PANEL
// ===============================================

// Lấy danh sách TẤT CẢ voucher (dùng cho Admin)
export const getVouchers = async (params = {}) => {
  const res = await axiosClient.get(`${API_URL}/vouchers/`, { params });
  return res.data;
};

// [MỚI] Lấy lịch sử sử dụng voucher (Dùng cho trang Quản lý sử dụng voucher)
export const getVoucherUsageHistory = async (params = {}) => {
  const queryParams = {};
  
  if (params.search && params.search.trim()) {
    queryParams.search = params.search.trim();
  }
  
  if (params.startDate) {
    queryParams.startDate = params.startDate;
  }
  
  if (params.endDate) {
    queryParams.endDate = params.endDate;
  }
  
  const res = await axiosClient.get(`${API_URL}/usage-history/`, { params: queryParams });
  return res.data;
};

// Lấy chi tiết 1 voucher (dùng cho Admin)
export const getVoucher = async (id) => {
  const res = await axiosClient.get(`${API_URL}/vouchers/${id}/`);
  return res.data;
};

// Tạo voucher (dùng cho Admin tạo voucher hệ thống)
export const createVoucher = async (data) => {
  const res = await axiosClient.post(`${API_URL}/vouchers/`, data);
  return res.data;
};

// Cập nhật voucher (dùng cho Admin)
export const updateVoucher = async (id, data) => {
  const res = await axiosClient.put(`${API_URL}/vouchers/${id}/`, data);
  return res.data;
};


export const deleteVoucher = async (id) => {
  const res = await axiosClient.delete(`${API_URL}/vouchers/${id}/`);
  return res.data;
};


export const importVouchers = async (formData) => {
  const res = await axiosClient.post(`${API_URL}/vouchers/import/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

// Lấy danh sách flash sale
export const getFlashSales = async () => {
  const res = await axiosClient.get(`${API_URL}/flash-sales/`);
  return res.data;
};


export const getPromotionsOverview = async (params = {}) => {
  const res = await axiosClient.get(`${API_URL}/overview/`, { params });
  return res.data;
};



export const getSellerVouchers = async (params = {}) => {
  const res = await axiosClient.get(`${API_URL}/seller/vouchers/`, { params });
  return res.data;
};

/**
 * SELLER tạo voucher mới cho cửa hàng của mình
 */
export const createSellerVoucher = async (voucherData) => {
  const res = await axiosClient.post(`${API_URL}/seller/vouchers/`, voucherData);
  return res.data;
};

/**
 * SELLER cập nhật voucher của mình
 */
export const updateSellerVoucher = async (id, voucherData) => {
  const res = await axiosClient.put(`${API_URL}/seller/vouchers/${id}/`, voucherData);
  return res.data;
};

/**
 * SELLER xóa voucher của mình
 */
export const deleteSellerVoucher = async (id) => {
  const res = await axiosClient.delete(`${API_URL}/seller/vouchers/${id}/`);
  return res.data;
};

/**
 * Lấy danh sách sản phẩm (rút gọn) của seller
 */
export const getMyProductsForVoucher = async () => {
  const res = await axiosClient.get('/products/my-products/simple/');
  return res.data;
}

/**
 * Lấy danh sách voucher CÔNG KHAI của một shop cụ thể
 */
export const getPublicVouchersForSeller = async (sellerId) => {
  const res = await axiosClient.get(`/promotions/vouchers/public/${sellerId}/`);
  return res.data;
};

/**
 * Lấy danh sách TẤT CẢ voucher (system/shop) MÀ USER ĐÃ LƯU và hợp lệ
 */
export const getEligibleVouchers = async (items) => {
  const res = await axiosClient.post('/promotions/vouchers/eligible-for-cart/', { items });
  return res.data;
};

/**
 * Tính toán giá cuối cùng (Checkout)
 */
export const calculateCheckout = async (payload) => {
  const res = await axiosClient.post('/orders/calculate-checkout/', payload); 
  return res.data;
};

/**
 * Lấy chi tiết lịch sử sử dụng của một voucher cụ thể (Admin)
 */
export const getVoucherUsageDetail = async (voucherId) => {
  const res = await axiosClient.get(`${API_URL}/vouchers/${voucherId}/usage/`);
  return res.data;
};