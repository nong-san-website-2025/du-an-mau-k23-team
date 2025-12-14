import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // Đảm bảo biến môi trường này đúng (VD: http://127.0.0.1:8000/api)
});

// Hàm lấy token từ localStorage
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export const productApi = {
  // ==================== 1. IMPORT EXCEL (FIX LỖI CỦA BẠN) ====================
  importExcel: (formData) => {
    return api.post('/products/import-excel/', formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data', // Bắt buộc để gửi file
      },
    });
  },

  // ==================== 2. CÁC API CƠ BẢN (CRUD) ====================
  // Lấy danh sách sản phẩm (cho Seller)
  getSellerProducts: (params) =>
    api.get('/products/', { headers: getAuthHeaders(), params }),
    // Lưu ý: Backend cần filter theo user hiện tại nếu gọi endpoint này

  // Lấy chi tiết 1 sản phẩm
  getProduct: (id) =>
    api.get(`/products/${id}/`, { headers: getAuthHeaders() }),

  // Tạo sản phẩm mới
  createProduct: (data) => {
    // Tự động check nếu là FormData để set header
    const isFormData = data instanceof FormData;
    return api.post('/products/', data, {
      headers: {
        ...getAuthHeaders(),
        ...(isFormData && { 'Content-Type': 'multipart/form-data' }),
      },
    });
  },

  // Cập nhật sản phẩm
  updateProduct: (id, data) => {
    const isFormData = data instanceof FormData;
    return api.patch(`/products/${id}/`, data, {
      headers: {
        ...getAuthHeaders(),
        ...(isFormData && { 'Content-Type': 'multipart/form-data' }),
      },
    });
  },

  // Xóa sản phẩm
  deleteProduct: (id) =>
    api.delete(`/products/${id}/`, { headers: getAuthHeaders() }),

  // Tự hủy đăng bán (Seller tự ẩn/xóa)
  selfReject: (id) =>
    api.post(`/products/${id}/self-reject/`, {}, { headers: getAuthHeaders() }),

  // ==================== 3. CATEGORY (DANH MỤC) ====================
  getCategories: () =>
    api.get('/categories/', { headers: getAuthHeaders() }),

  // ==================== 4. XỬ LÝ ẢNH (GALLERY) ====================
  // Upload nhiều ảnh
  uploadProductImages: (productId, formData) =>
    api.post(`/product-images/upload/${productId}/`, formData, { // Cần check lại URL backend của bạn
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    }),
    // LƯU Ý: Nếu backend bạn chưa có URL '/product-images/upload/...', 
    // hãy dùng URL mà bạn đã định nghĩa cho ProductImageUploadView.

  // Đặt ảnh đại diện (Set Primary)
  setPrimaryImage: (productId, imageId) =>
    api.post(`/products/${productId}/set-primary-image/`, { image_id: imageId }, { headers: getAuthHeaders() }),

  // Xóa ảnh phụ
  deleteProductImage: (imageId) =>
    api.delete(`/product-images/${imageId}/`, { headers: getAuthHeaders() }),

  // ==================== 5. QUẢN LÝ DUYỆT CẬP NHẬT (ADMIN) ====================
  getPendingUpdates: () =>
    api.get('/products/pending_updates/', { headers: getAuthHeaders() }),

  getPendingUpdateDetail: (productId) =>
    api.get(`/products/${productId}/pending_update_detail/`, { headers: getAuthHeaders() }),

  approveUpdate: (productId) =>
    api.post(`/products/${productId}/approve_update/`, {}, { headers: getAuthHeaders() }),

  rejectUpdate: (productId) =>
    api.post(`/products/${productId}/reject_update/`, {}, { headers: getAuthHeaders() }),

  requestImport: (productId) =>
    api.post(`/products/${productId}/request-import/`, {}, { headers: getAuthHeaders() }),
};