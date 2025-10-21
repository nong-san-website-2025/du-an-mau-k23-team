// src/api/productApi.ts
import { API } from "./api"; // ✅ Dùng API wrapper thay vì request trực tiếp
import { Product, Category, Subcategory } from "../types/models";

export const productApi = {
  // ===== PRODUCT =====
  getAllProducts(): Promise<Product[]> {
    return API.get("/products/");
  },

  getFeaturedProducts(): Promise<Product[]> {
    return API.get("/products/top-products/");
  },

  getProduct(id: number): Promise<Product> {
    return API.get(`/products/${id}/`);
  },

  // ===== CATEGORY =====
  getCategories(): Promise<Category[]> {
    return API.get("/products/categories/");
  },

  // ✅ ===== SUBCATEGORY =====
  getSubcategories(categoryId: number): Promise<Subcategory[]> {
    return API.get(`/products/categories/${categoryId}/subcategories/`);
  },

  getProducts(
    params: { subcategory?: string; search?: string } = {}
  ): Promise<Product[]> {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/products/?${query}` : "/products/";
    return API.get(url);
  },

  getProductsBySubcategory(subcategoryId: number): Promise<Product[]> {
    return API.get(`/products/subcategories/${subcategoryId}/products/`);
  },
};