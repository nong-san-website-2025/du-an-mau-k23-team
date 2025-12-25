import { API } from "./api";
import { Product, Category, Subcategory } from "../types/models";

// Định nghĩa params input rõ ràng thay vì object lỏng lẻo
interface ProductQueryParams {
  subcategory?: string | number;
  search?: string;
  category?: string | number;
  page?: number;
}

export const productApi = {
  // ===== PRODUCT =====
  getAllProducts(): Promise<Product[]> {
    return API.get<Product[]>("/products/");
  },

  getFeaturedProducts(): Promise<Product[]> {
    return API.get<Product[]>("/products/top-products/");
  },

    getProduct(id: number | string): Promise<Product> {
    return API.get<Product>(`/products/${id}/`);
  },

  getProducts(params: ProductQueryParams = {}): Promise<Product[]> {
    // Chuyển đổi params thành URLSearchParams để an toàn
    const searchParams = new URLSearchParams();
    
    if (params.subcategory) searchParams.append("subcategory", String(params.subcategory));
    if (params.search) searchParams.append("search", params.search);
    if (params.category) searchParams.append("category", String(params.category));
    if (params.page) searchParams.append("page", String(params.page));

    const queryString = searchParams.toString();
    const url = queryString ? `/products/?${queryString}` : "/products/";
    
    return API.get<Product[]>(url);
  },

  getProductsBySubcategory(subcategoryId: number | string): Promise<Product[]> {
    return API.get<Product[]>(
      `/products/subcategories/${subcategoryId}/products/`
    );
  },

  // ===== CATEGORY =====
  getCategories(): Promise<Category[]> {
    return API.get<Category[]>("/products/categories/");
  },

  getSubcategories(categoryId: number | string): Promise<Subcategory[]> {
    return API.get<Subcategory[]>(
      `/products/categories/${categoryId}/subcategories/`
    );
  },

  // ===== HELPER (Quan trọng cho CartContext) =====
  // Helper này xử lý việc Backend có thể trả về ID hoặc Object Category
  async getCategoryIdFromProduct(product: Product): Promise<number | null> {
    if (!product) return null;

    // Trường hợp category là object
    if (typeof product.category === 'object' && product.category !== null) {
        return product.category.id;
    }
    
    // Trường hợp category là ID (number)
    if (typeof product.category === 'number') {
        return product.category;
    }

    // Nếu không có trong field category, thử fetch chi tiết sản phẩm
    try {
       const detail = await this.getProduct(product.id);
       if (typeof detail.category === 'object' && detail.category !== null) {
           return detail.category.id;
       }
       if (typeof detail.category === 'number') {
           return detail.category;
       }
    } catch (e) {
        console.error("Failed to fetch product detail for category", e);
    }

    return null;
  }
};