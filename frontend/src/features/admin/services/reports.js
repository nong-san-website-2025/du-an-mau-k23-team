import http from "./http";

// Ví dụ: /reports/overview/ , /reports/top-products/
export const getOverviewReport = async (params = {}) => {
  const res = await http.get("/reports/overview/", { params });
  return res.data; // {revenue_today, orders_count, ...}
};

export const getTopProductsReport = async (params = {}) => {
  const res = await http.get("/reports/top-products/", { params });
  return res.data; // [{name, quantity, revenue}, ...]
};

export const getRevenueSeries = async (params = {}) => {
  const res = await http.get("/reports/revenue-series/", { params });
  return res.data; // [{date, revenue}, ...]
};
