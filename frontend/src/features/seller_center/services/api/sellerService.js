import api from "../../../login_register/services/api";

const sellerService = {
  getMe: async () => {
    const res = await api.get("/sellers/me");  // ✅ thêm /api/
    return res.data;
  },
  update: async (id, data) => {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    const config = isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
    const res = await api.patch(`/api/sellers/${id}/`, data, config);  // ✅ thêm /api/
    return res.data;
  },
};

export default sellerService;
