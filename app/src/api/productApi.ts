// src/api/productApi.ts
import { request } from "./api";
import { Product, Category } from "../types/models";

export const productApi = {
  getAllProducts: (): Promise<Product[]> => request("/products/"),
  // src/api/productApi.ts
  getFeaturedProducts(): Promise<Product[]> {
    return request<Product[]>("/products/top-products/"); // ✅ Đúng đường dẫn
  },
  getProduct: (id: number): Promise<Product> => request(`/products/${id}/`),
  getCategories: (): Promise<Category[]> => request("/products/categories/"),
};
