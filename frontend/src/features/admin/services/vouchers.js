import http from "./http";

export const getVouchers = async (params = {}) => {
  const res = await http.get("/vouchers/", { params });
  return res.data;
};

export const addVoucher = async (data) => {
  const res = await http.post("/vouchers/", data);
  return res.data;
};

export const updateVoucher = async (id, data) => {
  const res = await http.put(`/vouchers/${id}/`, data);
  return res.data;
};

export const deleteVoucher = async (id) => {
  const res = await http.delete(`/vouchers/${id}/`);
  return res.data;
};
