import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export const productApi = {
  // ==================== 1. TÍNH NĂNG IMPORT EXCEL (MỚI) ====================
  // Lưu ý: Đường dẫn này phải khớp với file urls.py bên Django
  // Nếu bạn để view ImportProductExcelView ở app 'products', thì thường url là /products/import-excel/
  importExcel: (formData) => {
    return api.post("/products/import-excel/", formData, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data", // Bắt buộc để gửi file
      },
    });
  },

<<<<<<< Updated upstream
=======
  // ==================== 1.5. LẤY DANH SÁCH SẢN PHẨM CÓ YÊU CẦU NHẬP ====================
  getImportRequestProducts: () =>
    api.get("/sellers/productseller/with-import-requests/", {
      headers: getAuthHeaders(),
    }),

  

>>>>>>> Stashed changes
  // ==================== 2. DANH MỤC & HIỂN THỊ ====================
  getCategories: () =>
    api.get("/products/categories/", { headers: getAuthHeaders() }),

  // Endpoint lấy danh sách sản phẩm của Seller
  getSellerProducts: (params) =>
    api.get("/sellers/productseller/", {
      headers: getAuthHeaders(),
      params,
    }),

  // ==================== 3. CRUD SẢN PHẨM (Seller) ====================
  createProduct: (data) =>
    api.post("/sellers/products/", data, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    }),

  updateProduct: (id, data) => {
    const isFormData = data instanceof FormData;
    return api.patch(`/sellers/products/${id}/`, data, {
      headers: {
        ...getAuthHeaders(),
        ...(isFormData && { "Content-Type": "multipart/form-data" }),
      },
    });
  },

  deleteProduct: (id) =>
    api.delete(`/sellers/products/${id}/`, { headers: getAuthHeaders() }),

  // ==================== 4. CÁC ACTIONS KHÁC ====================
  toggleHide: (id) =>
    api.post(`/sellers/products/${id}/toggle-hide/`, {}, { headers: getAuthHeaders() }),

  selfReject: (id) =>
    api.post(`/sellers/products/${id}/self-reject/`, {}, { headers: getAuthHeaders() }),

  // ==================== 5. QUẢN LÝ ẢNH ====================
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
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteProductImage: (imageId) => {
    // Lưu ý: Kiểm tra lại URL backend xem là /images/ hay /product-images/
    return api.delete(`/images/${imageId}/`, {
      headers: getAuthHeaders(),
    });
  },
};