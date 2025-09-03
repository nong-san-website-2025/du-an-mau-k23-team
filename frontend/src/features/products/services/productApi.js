const API_URL = process.env.REACT_APP_API_URL;

// Fetch helper với refresh token (chỉ dùng khi token tồn tại)
async function fetchWithAuthRetry(url, options = {}) {
  let token = localStorage.getItem('token');
  
  if (!token) {
    // Chưa đăng nhập
    throw new Error('Vui lòng đăng nhập để thực hiện hành động này');
  }

  options.headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
  let response = await fetch(url, options);

  if (response.status === 401) {
    // Token hết hạn, thử refresh
    try {
      token = await productApi.refreshToken();
      options.headers.Authorization = `Bearer ${token}`;
      response = await fetch(url, options);
    } catch (err) {
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
    }
  }

  return response;
}

export const productApi = {
  // --- Public APIs ---
  
  async getAllProducts() {
    const response = await fetch(`${API_URL}/products/`);
    if (!response.ok) throw new Error('Không thể tải dữ liệu sản phẩm');
    return await response.json();
  },

  async getProduct(id) {
    const response = await fetch(`${API_URL}/products/${id}/`);
    if (!response.ok) throw new Error('Không thể tải thông tin sản phẩm');
    return await response.json();
  },

  async getCategories() {
    const response = await fetch(`${API_URL}/products/categories/`);
    if (!response.ok) throw new Error('Không thể tải danh mục');
    return await response.json();
  },

  async getSubcategories(categoryId) {
    const response = await fetch(`${API_URL}/products/categories/${categoryId}/subcategories/`);
    if (!response.ok) throw new Error('Không thể tải danh mục con');
    return await response.json();
  },

  async getProductsByCategory(categoryId, subcategory = null) {
    let url = `${API_URL}/products/categories/${categoryId}/products/`;
    if (subcategory) url += `?subcategory=${encodeURIComponent(subcategory)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Không thể tải sản phẩm');
    return await response.json();
  },

  async getCategoriesWithProducts() {
    const categories = await this.getCategories();
    const categoriesWithProducts = await Promise.all(
      categories.map(async (category) => {
        try {
          const subcategories = await this.getSubcategories(category.id);
          const allProducts = await this.getProductsByCategory(category.id);

          const subcategoriesWithProducts = subcategories.map(sub => ({
            name: sub.name,
            products: allProducts.filter(p => p.subcategory_name === sub.name)
          }));

          return {
            id: category.id,
            key: category.key,
            name: category.name,
            icon: category.icon || 'Package',
            subcategories: subcategoriesWithProducts
          };
        } catch {
          return {
            id: category.id,
            key: category.key,
            name: category.name,
            icon: category.icon || 'Package',
            subcategories: []
          };
        }
      })
    );
    return categoriesWithProducts;
  },

  async searchProducts(query, filters = {}) {
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (filters.category) params.append('category', filters.category);
    if (filters.subcategory) params.append('subcategory', filters.subcategory);
    if (filters.is_new) params.append('is_new', filters.is_new);
    if (filters.is_organic) params.append('is_organic', filters.is_organic);
    if (filters.is_best_seller) params.append('is_best_seller', filters.is_best_seller);
    if (filters.ordering) params.append('ordering', filters.ordering);

    const response = await fetch(`${API_URL}/products/?${params.toString()}`);
    if (!response.ok) throw new Error('Không thể tìm kiếm sản phẩm');
    return await response.json();
  },

  async getFeaturedProducts() {
    const response = await fetch(`${API_URL}/products/featured/`);
    if (!response.ok) throw new Error('Không thể tải sản phẩm nổi bật');
    return await response.json();
  },

  // --- Private APIs (require token) ---

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  async getSellers() {
    const response = await fetchWithAuthRetry(`${API_URL}/sellers/`);
    if (!response.ok) throw new Error('Không thể tải danh sách người bán');
    return await response.json();
  },

  async createProduct(productData) {
    const options = {
      method: 'POST',
      headers: productData instanceof FormData ? this.getAuthHeaders() : { 
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: productData instanceof FormData ? productData : JSON.stringify(productData)
    };

    const response = await fetchWithAuthRetry(`${API_URL}/products/`, options);
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Không thể tạo sản phẩm');
    }
    return await response.json();
  },

  async updateProduct(id, productData) {
    const options = {
      method: 'PUT',
      headers: productData instanceof FormData ? this.getAuthHeaders() : { 
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: productData instanceof FormData ? productData : JSON.stringify(productData)
    };

    const response = await fetchWithAuthRetry(`${API_URL}/products/${id}/`, options);
    if (!response.ok) throw new Error('Không thể cập nhật sản phẩm');
    return await response.json();
  },

  async deleteProduct(id) {
    const response = await fetchWithAuthRetry(`${API_URL}/products/${id}/`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!response.ok) throw new Error('Không thể xóa sản phẩm');
    return true;
  },

  async refreshToken() {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) throw new Error('No refresh token');
    const response = await fetch(`${API_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh })
    });
    if (!response.ok) throw new Error('Không thể làm mới token');
    const data = await response.json();
    localStorage.setItem('token', data.access);
    return data.access;
  }
};
