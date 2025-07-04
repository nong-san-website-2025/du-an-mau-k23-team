// API Service để kết nối với Django backend
const API_BASE_URL = 'http://localhost:8000/api';

export const productApi = {
  // Lấy tất cả sản phẩm
  async getAllProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/products/`);
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu sản phẩm');
      }
      return await response.json();
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
      throw error;
    }
  },

  // Lấy sản phẩm theo ID
  async getProduct(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}/`);
      if (!response.ok) {
        throw new Error('Không thể tải thông tin sản phẩm');
      }
      return await response.json();
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
      throw error;
    }
  },

  // Tạo sản phẩm mới
  async createProduct(productData) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        throw new Error('Không thể tạo sản phẩm');
      }
      return await response.json();
    } catch (error) {
      console.error('Lỗi khi tạo sản phẩm:', error);
      throw error;
    }
  },

  // Cập nhật sản phẩm
  async updateProduct(id, productData) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        throw new Error('Không thể cập nhật sản phẩm');
      }
      return await response.json();
    } catch (error) {
      console.error('Lỗi khi cập nhật sản phẩm:', error);
      throw error;
    }
  },

  // Xóa sản phẩm
  async deleteProduct(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Không thể xóa sản phẩm');
      }
      return true;
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
      throw error;
    }
  }
};