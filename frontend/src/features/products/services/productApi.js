// Hàm tự động refresh token khi hết hạn và retry request
export async function fetchWithAuthRetry(url, options = {}) {
  let token = localStorage.getItem('token');
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

  // Helper lấy token
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  // Tạo sản phẩm mới
  async createProduct(productData) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/`, {
      method: 'POST',
      headers: {
        ...productApi.getAuthHeaders(), // Không set Content-Type ở đây
      },
      body: productData, // productData phải là FormData()
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
      let options = {
        method: 'PUT',
        headers: {
          ...productApi.getAuthHeaders(),
        },
        body: productData,
      };
      // Nếu không phải FormData thì gửi JSON
      if (!(productData instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(productData);
      }
      const response = await fetch(`${API_BASE_URL}/products/${id}/`, options);
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
        headers: {
          ...productApi.getAuthHeaders(),
        },
      });
      if (!response.ok) {
        throw new Error('Không thể xóa sản phẩm');
      }
      return true;
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
      throw error;
    }
  },

  // Lấy tất cả categories
// Lấy tất cả categories
async getCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/products/categories/`);
    if (!response.ok) {
      throw new Error('Không thể tải danh mục');
    }
    return await response.json();
  } catch (error) {
    console.error('Lỗi khi tải categories:', error);
    throw error;
  }
},


  // Lấy subcategories của một category
  async getSubcategories(categoryId) {
    try {
       const response = await fetch(`${API_BASE_URL}/products/categories/${categoryId}/subcategories/`);
      if (!response.ok) {
        throw new Error('Không thể tải danh mục con');
      }
      return await response.json();
    } catch (error) {
      console.error('Lỗi khi tải subcategories:', error);
      throw error;
    }
  },

  // Lấy products của một category
  async getProductsByCategory(categoryId, subcategory = null) {
    try {
      let url = `${API_BASE_URL}/products/categories/${categoryId}/products/`;
      if (subcategory) {
        url += `?subcategory=${encodeURIComponent(subcategory)}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Không thể tải sản phẩm');
      }
      return await response.json();
    } catch (error) {
      console.error('Lỗi khi tải products:', error);
      throw error;
    }
  },

  // Lấy categories với structure phù hợp cho frontend
  async getCategoriesWithProducts() {
    try {
      const categories = await this.getCategories();
      
      // Tạo structure phù hợp với frontend
      const categoriesWithProducts = await Promise.all(
        categories.map(async (category) => {
          try {
            // Lấy subcategories
            const subcategories = await this.getSubcategories(category.id);
            
            // Lấy tất cả products của category này
            const allProducts = await this.getProductsByCategory(category.id);
            
            // Nhóm products theo subcategory
            const subcategoriesWithProducts = subcategories.map(subcategory => {
              const subcategoryProducts = allProducts.filter(
                product => product.subcategory_name === subcategory.name
              );
              
              return {
                name: subcategory.name,
                products: subcategoryProducts
              };
            });

            return {
              id: category.id,
              key: category.key,
              name: category.name,
              icon: category.icon || 'Package',
              subcategories: subcategoriesWithProducts
            };
          } catch (error) {
            console.error(`Lỗi khi tải dữ liệu cho category ${category.name}:`, error);
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
    } catch (error) {
      console.error('Lỗi khi tải categories với products:', error);
      throw error;
    }
  },

  // Tìm kiếm sản phẩm
  async searchProducts(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (filters.category) params.append('category', filters.category);
      if (filters.subcategory) params.append('subcategory', filters.subcategory);
      if (filters.is_new) params.append('is_new', filters.is_new);
      if (filters.is_organic) params.append('is_organic', filters.is_organic);
      if (filters.is_best_seller) params.append('is_best_seller', filters.is_best_seller);
      if (filters.ordering) params.append('ordering', filters.ordering);

      const response = await fetch(`${API_BASE_URL}/products/?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Không thể tìm kiếm sản phẩm');
      }
      return await response.json();
    } catch (error) {
      console.error('Lỗi khi tìm kiếm sản phẩm:', error);
      throw error;
    }
  },

  // Lấy sản phẩm nổi bật
  async getFeaturedProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/products/featured/`);
      if (!response.ok) {
        throw new Error('Không thể tải sản phẩm nổi bật');
      }
      return await response.json();
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm nổi bật:', error);
      throw error;
    }
  },

  // Lấy danh sách người bán
  async getSellers() {
    try {
      const response = await fetchWithAuthRetry(`${API_BASE_URL}/sellers/`);
      if (!response.ok) {
        throw new Error('Không thể tải danh sách người bán');
      }
      return await response.json();
    } catch (error) {
      console.error('Lỗi khi tải người bán:', error);
      throw error;
    }
  },

  // Hàm refresh token
  async refreshToken() {
    const refresh = localStorage.getItem('refresh');
    if (!refresh) throw new Error('No refresh token');
    const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) throw new Error('Không thể làm mới token');
    const data = await response.json();
    localStorage.setItem('token', data.access);
    return data.access;
  },
};