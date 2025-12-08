import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

export const getSellerActivity = async (sellerId) => {
  const res = await axios.get(`${API_URL}/sellers/activity/${sellerId}/`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
};
