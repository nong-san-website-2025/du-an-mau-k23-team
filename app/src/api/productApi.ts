import { API } from "./api";
import { Product, Category, Subcategory } from "../types/models";

export const productApi = {
  // ===== PRODUCT =====
  getAllProducts(): Promise<Product[]> {
    return API.get<Product[]>("/products/");
  },

  getFeaturedProducts(): Promise<Product[]> {
    return API.get<Product[]>("/products/top-products/");
  },

  getProduct(id: number): Promise<Product> {
    return API.get<Product>(`/products/${id}/`);
  },

  getProducts(params: { subcategory?: string; search?: string } = {}): Promise<Product[]> {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/products/?${query}` : "/products/";
    return API.get<Product[]>(url);
  },

  getProductsBySubcategory(subcategoryId: number): Promise<Product[]> {
    return API.get<Product[]>(`/products/subcategories/${subcategoryId}/products/`);
  },

  // ===== CATEGORY =====
  getCategories(): Promise<Category[]> {
    return API.get<Category[]>("/products/categories/");
  },

  getSubcategories(categoryId: number): Promise<Subcategory[]> {
    return API.get<Subcategory[]>(`/products/categories/${categoryId}/subcategories/`);
  },
};
