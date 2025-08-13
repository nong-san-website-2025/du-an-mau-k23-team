// services/choiceApi.js
import { api } from "../../login_register/services/AuthContext";

async function fetchWithAuth(url, method = "GET", body = null) {
  try {
    console.log("=== API DEBUG ===");
    console.log("URL:", url);
    console.log("Method:", method);
    console.log("Body type:", body ? body.constructor.name : "null");

    if (body instanceof FormData) {
      console.log("Body is FormData");
      console.log("FormData entries:");
      for (let [key, value] of body.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
    }

    let response;
    if (method === "GET") {
      response = await api.get(url);
    } else if (method === "POST") {
      response = await api.post(url, body, {
        headers:
          body instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : {},
      });
    } else if (method === "PUT") {
      response = await api.put(url, body);
    } else if (method === "DELETE") {
      response = await api.delete(url, body);
    }

    console.log("Response status:", response.status);
    console.log("Response data:", response.data);

    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    console.error("Error response:", error.response);
    throw new Error(
      `API error: ${error.response?.status || "Unknown"} - ${
        error.response?.data?.detail || error.message
      }`
    );
  }
}

const choiceApi = {
  getCategories() {
    return fetchWithAuth("/products/categories/");
  },
  getSubcategories(categoryId) {
    return fetchWithAuth(`/products/categories/${categoryId}/subcategories/`);
  },
  getSellers() {
    return fetchWithAuth("/sellers/");
  },
  createProduct(formData) {
    // Đừng set Content-Type, axios sẽ tự động set boundary cho multipart/form-data
    return api.post("/products/", formData);
  },
};

export default choiceApi;
