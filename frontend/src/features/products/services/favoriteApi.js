const API_URL = process.env.REACT_APP_API_URL;

export const favoriteApi = {
  async addFavorite(productId) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Bạn cần đăng nhập để sử dụng chức năng này');
    const response = await fetch(`${API_URL}/products/${productId}/favorite/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Không thể thêm vào mục yêu thích');
    return await response.json();
  },
  async removeFavorite(productId) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Bạn cần đăng nhập để sử dụng chức năng này');
    const response = await fetch(`${API_URL}/products/${productId}/favorite/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Không thể xóa khỏi mục yêu thích');
    return true;
  },
  async isFavorite(productId) {
    const token = localStorage.getItem('token');
    if (!token) return false;
    const response = await fetch(`${API_URL}/products/${productId}/is_favorite/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.is_favorite;
  }
};
