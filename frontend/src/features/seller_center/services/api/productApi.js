// src/api/productApi.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export const productApi = {
  getCategories: () =>
    api.get("/products/categories/", { headers: getAuthHeaders() }),

  getSellerProducts: (params) =>
    api.get("/sellers/productseller/", {
      headers: getAuthHeaders(),
      params,
    }),

  createProduct: (data) =>
    api.post("/products/", data, {
      headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
    }),

  updateProduct: (id, data) =>
    api.put(`/products/${id}/`, data, {
      headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
    }),

  deleteProduct: (id) =>
    api.delete(`/products/${id}/`, { headers: getAuthHeaders() }),

  toggleHide: (id) =>
    api.post(`/products/${id}/toggle-hide/`, {}, { headers: getAuthHeaders() }),

  selfReject: (id) =>
    api.post(`/products/${id}/self-reject/`, {}, { headers: getAuthHeaders() }),

  uploadProductImages: (productId, formData) => {
    return api.post(`/products/${productId}/images/`, formData, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteProductImage: (imageId) => {
    return api.delete(`/images/${imageId}/`, {
      headers: getAuthHeaders(),
    });
  },
};
