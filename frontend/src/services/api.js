// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Categories
  async getCategories() {
    return this.request('/categories/');
  }

  async getCategoryProducts(categoryId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/categories/${categoryId}/products/?${queryString}`);
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