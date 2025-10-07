import api from "../../../login_register/services/api";

const sellerService = {
  getMe: async () => {
    const res = await api.get("/sellers/me");  
    return res.data;
  },
  update: async (id, data) => {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    const config = isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
    const res = await api.patch(`/sellers/${id}/`, data, config);
    return res.data;
  },
};

export default sellerService;
