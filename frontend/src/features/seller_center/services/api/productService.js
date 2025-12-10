import api from "./api";

export const productService = {
  getSellerProducts: async () => {
    try {
      const res = await api.get("/sellers/products/"); // 👈 URL đúng theo backend
      return res.data;
    } catch (err) {
      console.error(err);
      return [];
    }
  },
};
