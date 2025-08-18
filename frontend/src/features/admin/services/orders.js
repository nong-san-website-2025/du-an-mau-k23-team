import http from "./http";

export const getOrders = async (params = {}) => {
  const res = await http.get("/orders/", { params });
  return res.data;
};

export const addOrder = async (data) => {
  const res = await http.post("/orders/", data);
  return res.data;
};

export const updateOrder = async (id, data) => {
  const res = await http.put(`/orders/${id}/`, data);
  return res.data;
};

export const deleteOrder = async (id) => {
  const res = await http.delete(`/orders/${id}/`);
  return res.data;
};
