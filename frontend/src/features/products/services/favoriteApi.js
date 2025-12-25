import API from "../../login_register/services/api"; // Import instance Axios chung của dự án
import { message } from "antd"; // (Tùy chọn) dùng để hiện thông báo lỗi nếu muốn log tại đây

export const favoriteApi = {
  
  /**
   * Thêm sản phẩm vào danh sách yêu thích
   * Method: POST
   */
  async addFavorite(productId) {
    // 1. Check token ở client trước để tránh gọi API thừa
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này');
    }

    try {
      // Axios tự động gắn Base URL và Token (nếu interceptor đã cấu hình)
      const response = await API.post(`/products/${productId}/favorite/`);
      return response.data;
    } catch (error) {
      // Xử lý lỗi chuẩn từ Backend Django
      const errorMsg = error.response?.data?.detail || error.response?.data?.error || 'Không thể thêm vào yêu thích';
      // Ném lỗi ra để Component bên ngoài (UI) bắt được và hiển thị Toast
      throw new Error(errorMsg);
    }
  },

  /**
   * Xóa sản phẩm khỏi danh sách yêu thích
   * Method: DELETE
   */
  async removeFavorite(productId) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này');
    }

    try {
      await API.delete(`/products/${productId}/favorite/`);
      return true; // Trả về true nếu xóa thành công
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Không thể xóa khỏi yêu thích';
      throw new Error(errorMsg);
    }
  },

  /**
   * Kiểm tra trạng thái yêu thích
   * Method: GET
   * Return: true / false
   */
  async isFavorite(productId) {
    const token = localStorage.getItem('token');
    // Nếu không có token, chắc chắn là chưa thích -> trả về false luôn
    if (!token) return false;

    try {
      const response = await API.get(`/products/${productId}/is_favorite/`);
      // Giả định Backend trả về JSON: { "is_favorite": true }
      return response.data.is_favorite;
    } catch (error) {
      // API này chỉ dùng để check trạng thái hiển thị icon tim
      // Nên nếu lỗi, ta cứ trả về false (tim rỗng) để không làm crash giao diện
      console.warn("Lỗi kiểm tra yêu thích:", error); 
      return false;
    }
  }
};