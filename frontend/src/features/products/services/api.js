const API_URL = process.env.REACT_APP_API_URL;
class ApiService {
  constructor() {
    this.baseURL = API_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Lấy access token trong localStorage
    const token = localStorage.getItem("token");

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // gắn token
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Nếu token hết hạn -> thử refresh
      if (response.status === 401) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.request(endpoint, options); // gọi lại API với token mới
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Hàm refresh token
  async refreshToken() {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) return false;

    try {
      const res = await fetch(`${this.baseURL}/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.access);
        return true;
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login"; // bắt login lại
        return false;
      }
    } catch (err) {
      console.error("Refresh token failed:", err);
      return false;
    }
  }

  // Categories
  async getCategories() {
    return this.request('/products/categories/');
  }

  async getCategoryProducts(categoryId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products/categories/${categoryId}/products/?${queryString}`);
  }

  // Products
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products/?${queryString}`);
  }

  async getProduct(id) {
    return this.request(`/products/${id}/`);
  }

  async getFeaturedProducts() {
    return this.request('/products/featured/');
  }

  // Search
  async searchProducts(query, filters = {}) {
    const params = { search: query, ...filters };
    return this.getProducts(params);
  }
}

export default new ApiService();
