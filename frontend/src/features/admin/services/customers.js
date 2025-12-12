import http from "./http";

export const getCustomers = async (params = {}) => {
  const res = await http.get("/customers/", { params });
  return res.data;
};

export const addCustomer = async (data) => {
  const res = await http.post("/customers/", data);
  return res.data;
};

export const updateCustomer = async (id, data) => {
  const res = await http.put(`/customers/${id}/`, data);
  return res.data;
};

export const deleteCustomer = async (id) => {
  const res = await http.delete(`/customers/${id}/`);
  return res.data;
};
