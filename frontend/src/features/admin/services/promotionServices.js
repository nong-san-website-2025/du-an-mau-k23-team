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
// API CHO ADMIN PANEL (Giữ nguyên)
// ===============================================

// Lấy danh sách TẤT CẢ voucher (dùng cho Admin)
export const getVouchers = async (params = {}) => {
  const res = await axiosClient.get(`${API_URL}/vouchers/`, { params });
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

// Xóa voucher (dùng cho Admin)
export const deleteVoucher = async (id) => {
  const res = await axiosClient.delete(`${API_URL}/vouchers/${id}/`);
  return res.data;
};

// ===============================================
// FLASH SALE API CHO ADMIN (Giữ nguyên)
// ===============================================

// Lấy danh sách flash sale
export const getFlashSales = async () => {
  const res = await axiosClient.get(`${API_URL}/flash-sales/`);
  return res.data;
};

// ... các hàm flash sale khác giữ nguyên ...

// ===============================================
// OVERVIEW API (Giữ nguyên)
// ===============================================

// Tổng quan khuyến mãi (voucher + flash sale)
export const getPromotionsOverview = async (params = {}) => {
  const res = await axiosClient.get(`${API_URL}/overview/`, { params });
  return res.data;
};


// =========================================================
// == API DÀNH RIÊNG CHO SELLER CENTER (PHẦN THÊM MỚI) ==
// =========================================================

/**
 * Lấy danh sách voucher CỦA RIÊNG SELLER đang đăng nhập
 * @param {object} params - Các tham số filter (nếu có)
 * @returns {Promise<Array>} - Danh sách voucher của seller
 */
export const getSellerVouchers = async (params = {}) => {
  const res = await axiosClient.get(`${API_URL}/seller/vouchers/`, { params });
  return res.data;
};

/**
 * SELLER tạo voucher mới cho cửa hàng của mình
 * @param {object} voucherData - Dữ liệu của voucher cần tạo
 * @returns {Promise<object>} - Dữ liệu voucher vừa được tạo
 */
export const createSellerVoucher = async (voucherData) => {
  const res = await axiosClient.post(`${API_URL}/seller/vouchers/`, voucherData);
  return res.data;
};

/**
 * SELLER cập nhật voucher của mình
 * @param {number} id - ID của voucher cần cập nhật
 * @param {object} voucherData - Dữ liệu mới của voucher
 * @returns {Promise<object>} - Dữ liệu voucher sau khi cập nhật
 */
export const updateSellerVoucher = async (id, voucherData) => {
  const res = await axiosClient.put(`${API_URL}/seller/vouchers/${id}/`, voucherData);
  return res.data;
};

/**
 * SELLER xóa voucher của mình
 * @param {number} id - ID của voucher cần xóa
 * @returns {Promise} - Thường trả về response rỗng với status 204
 */
export const deleteSellerVoucher = async (id) => {
  const res = await axiosClient.delete(`${API_URL}/seller/vouchers/${id}/`);
  return res.data;
};

/**
 * Lấy danh sách sản phẩm (rút gọn) của seller để hiển thị trong form tạo voucher
 * @returns {Promise<Array>} - Danh sách sản phẩm { id, name }
 */
export const getMyProductsForVoucher = async () => {
  // LƯU Ý: Không có /api/ ở đầu nữa vì axiosClient đã tự thêm vào
  const res = await axiosClient.get('/products/my-products/simple/');
  return res.data;
}