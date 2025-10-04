const API_URL = process.env.REACT_APP_API_URL;

// ===== Helper: Lấy Token =====
const getToken = () => localStorage.getItem("token");
const getRefreshToken = () => localStorage.getItem("refresh_token");

// ===== Helper: Headers =====
const buildHeaders = (isAuth = false, isFormData = false) => {
  const headers = {};
  if (isAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (!isFormData) headers["Content-Type"] = "application/json";
  return headers;
};

// ===== Helper: Refresh Token =====
async function refreshToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("Không tìm thấy refresh token");

  const response = await fetch(`${API_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) throw new Error("Không thể làm mới token");

  const data = await response.json();
  localStorage.setItem("token", data.access);
  return data.access;
}

// ===== Core Fetch Wrapper =====
async function request(endpoint, options = {}, { auth = false } = {}) {
  const url = `${API_URL}${endpoint}`;
  let headers = buildHeaders(auth, options.body instanceof FormData);

  const config = {
    method: options.method || "GET",
    headers: { ...headers, ...(options.headers || {}) },
    body: options.body || null,
  };

  let response = await fetch(url, config);

  // Nếu token hết hạn, thử refresh
  if (response.status === 401 && auth) {
    try {
      const newToken = await refreshToken();
      config.headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, config);
    } catch {
      throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Có lỗi xảy ra");
  }

  return response.json();
}

// ===== productApi =====
export const productApi = {
  // ===== Public APIs =====
  getAllProducts() {
    return request("/products/");
  },

  getProduct(id) {
    return request(`/products/${id}/`, {}, { auth: true });
  },

  getCategories() {
    return request("/products/categories/");
  },

  getSubcategories(categoryId) {
    return request(`/products/categories/${categoryId}/subcategories/`);
  },

  getProductsByCategory(categoryId, subcategory = null) {
    let url = `/products/categories/${categoryId}/products/`;
    if (subcategory) {
      url += `?subcategory=${encodeURIComponent(subcategory)}`;
    }
    return request(url);
  },

  async getCategoriesWithProducts() {
    const categories = await this.getCategories();

    return Promise.all(
      categories.map(async (category) => {
        try {
          const [subcategories, allProducts] = await Promise.all([
            this.getSubcategories(category.id),
            this.getProductsByCategory(category.id),
          ]);

          const subcategoriesWithProducts = subcategories.map((sub) => ({
            name: sub.name,
            products: allProducts.filter((p) => p.subcategory_name === sub.name),
          }));

          return {
            ...category,
            icon: category.icon || "Package",
            subcategories: subcategoriesWithProducts,
          };
        } catch {
          return {
            ...category,
            icon: category.icon || "Package",
            subcategories: [],
          };
        }
      })
    );
  },

  searchProducts(query, filters = {}) {
    const params = new URLSearchParams();

    if (query) params.append("search", query);

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    return request(`/products/?${params.toString()}`);
  },

  getFeaturedProducts() {
    return request("/products/featured/");
  },

  // ===== Private APIs (require token) =====
  getSellers() {
    return request("/sellers/", {}, { auth: true });
  },

  createProduct(productData) {
    return request(
      "/products/",
      {
        method: "POST",
        body: productData instanceof FormData ? productData : JSON.stringify(productData),
      },
      { auth: true }
    );
  },

  updateProduct(id, productData) {
    return request(
      `/products/${id}/`,
      {
        method: "PUT",
        body: productData instanceof FormData ? productData : JSON.stringify(productData),
      },
      { auth: true }
    );
  },

  deleteProduct(id) {
    return request(`/products/${id}/`, { method: "DELETE" }, { auth: true });
  },
};
