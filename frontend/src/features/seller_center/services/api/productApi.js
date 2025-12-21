import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export const productApi = {
  // ==================== 1. TÍNH NĂNG IMPORT EXCEL ====================
  importExcel: (formData) => {
    return api.post("/products/import-excel/", formData, {
      headers: {
        ...getAuthHeaders(),
        // XÓA DÒNG Content-Type TẠI ĐÂY
      },
    });
  },

  // ... (các hàm get giữ nguyên) ...
  getImportRequestProducts: () =>
    api.get("/sellers/productseller/with-import-requests/", {
      headers: getAuthHeaders(),
    }),

  getCategories: () =>
    api.get("/products/categories/", { headers: getAuthHeaders() }),

  getSellerProducts: (params) =>
    api.get("/sellers/productseller/", {
      headers: getAuthHeaders(),
      params,
    }),

  // ==================== 3. CRUD SẢN PHẨM (SỬA LẠI CHỖ NÀY) ====================
  
  // 1. Create Product
  createProduct: (data) =>
    api.post("/sellers/products/", data, {
      headers: {
        ...getAuthHeaders(),
        // QUAN TRỌNG: KHÔNG ĐƯỢC SET Content-Type THỦ CÔNG KHI DÙNG FORMDATA
        // Axios sẽ tự động phát hiện data là FormData và set header kèm boundary chuẩn.
      },
    }),

  // 2. Update Product
  updateProduct: (id, data) => {
    return api.patch(`/sellers/products/${id}/`, data, {
      headers: {
        ...getAuthHeaders(),
        // Xóa logic check FormData ở đây luôn, để Axios tự lo
      },
    });
  },

  deleteProduct: (id) =>
    api.delete(`/sellers/products/${id}/`, { headers: getAuthHeaders() }),

  // ... (các hàm action khác giữ nguyên) ...
  toggleHide: (id) =>
    api.post(`/sellers/products/${id}/toggle-hide/`, {}, { headers: getAuthHeaders() }),

  selfReject: (id) =>
    api.post(`/sellers/products/${id}/self-reject/`, {}, { headers: getAuthHeaders() }),

  // ==================== 5. QUẢN LÝ ẢNH (SỬA LẠI CHỖ NÀY) ====================
  setPrimaryImage: (productId, imageId) => {
    return api.post(
      `/sellers/products/${productId}/set-primary-image/`,
      { image_id: imageId },
      { headers: getAuthHeaders() }
    );
  },

  uploadProductImages: (productId, formData) => {
    return api.post(`/sellers/products/${productId}/images/`, formData, {
      headers: {
        ...getAuthHeaders(),
        // XÓA DÒNG Content-Type TẠI ĐÂY
      },
    });
  },

  deleteProductImage: (imageId) => {
    return api.delete(`/images/${imageId}/`, {
      headers: getAuthHeaders(),
    });
  },
};