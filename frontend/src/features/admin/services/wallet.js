import http from "./http";

// Tùy backend: ví dụ endpoints /wallet/summary/ và /wallet/transactions/
export const getWalletSummary = async () => {
  const res = await http.get("/wallet/summary/");
  return res.data;
};

export const getWalletTransactions = async (params = {}) => {
  const res = await http.get("/wallet/transactions/", { params });
  return res.data;
};
