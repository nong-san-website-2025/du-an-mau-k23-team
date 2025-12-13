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

function normalizeStatus(product) {
  const status = (product.status || "").toLowerCase().trim();
  const stock = Number(product.stock ?? 0);

  // Ưu tiên nhận diện "sắp có"
  if (
    ["comingsoon", "coming_soon", "sắp có", "sap co", "sắpcó", "sapco"].some(
      (s) => status.includes(s)
    )
  ) {
    return "coming_soon";
  }

  // Nếu tồn kho hết → hết hàng
  if (stock <= 0) {
    return "out_of_stock";
  }

  // Còn lại → có sẵn
  return "in_stock";
}

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

  if (!response.ok) {
    const text = await response.text(); // ✅ đọc lỗi chi tiết
    console.error("❌ API Error:", response.status, text); // ✅ in log
    throw new Error("Có lỗi xảy ra");
  }

  return response.json();
}

// ===== productApi =====
export const productApi = {
  // ===== Public APIs =====
  getAllProducts() {
    return request("/products/").then((data) =>
      data.map((p) => ({
        ...p,
        availability_status: normalizeStatus(p),
      }))
    );
  },

  getCategoryIdFromProduct(product) {
    if (!product) return null;
    // Trường hợp category là object (có id, name)
    if (typeof product.category === "object" && product.category !== null) {
      return product.category.id;
    }
    // Trường hợp category chỉ là ID (số hoặc chuỗi)
    return product.category;
  },

  getProduct(id) {
    return request(`/products/${id}/`, {}, { auth: true }).then((p) => ({
      ...p,
      // ✅ Giữ nguyên p.status (là "approved", "pending", v.v.)
      // ✅ Thêm field mới: availability_status hoặc displayStatus
      availability_status: normalizeStatus(p), // hoặc displayStatus
    }));
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

    // 1. Lọc Categories: Chỉ lấy những cái Active
    const activeCategories = categories.filter(
      (cat) => cat.status === "active"
    );

    return Promise.all(
      activeCategories.map(async (category) => {
        try {
          const [subcategories, allProducts] = await Promise.all([
            this.getSubcategories(category.id),
            this.getProductsByCategory(category.id),
          ]);

          // 2. Lọc Subcategories: Chỉ lấy những cái Active
          const activeSubcategories = subcategories.filter(
            (sub) => sub.status === "active"
          );

          const subcategoriesWithProducts = activeSubcategories.map((sub) => ({
            name: sub.name,
            products: allProducts.filter(
              (p) => p.subcategory_name === sub.name
            ),
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

  preorderProduct(productId, quantity) {
    return request(
      `/products/${productId}/preorder/`,
      {
        method: "POST",
        body: JSON.stringify({ quantity }),
      },
      { auth: true }
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
        body:
          productData instanceof FormData
            ? productData
            : JSON.stringify(productData),
      },
      { auth: true }
    );
  },

  updateProduct(id, productData) {
    return request(
      `/products/${id}/`,
      {
        method: "PUT",
        body:
          productData instanceof FormData
            ? productData
            : JSON.stringify(productData),
      },
      { auth: true }
    );
  },

  deleteProduct(id) {
    return request(`/products/${id}/`, { method: "DELETE" }, { auth: true });
  },
  getAll() {
    return this.getAllProducts();
  },
};

export const fetchNewProducts = () =>
  fetch(`${API_URL}/products/new-products/`).then((res) => res.json());

export const fetchBestSellers = () =>
  fetch(`${API_URL}/products/best-sellers/`).then((res) => res.json());
