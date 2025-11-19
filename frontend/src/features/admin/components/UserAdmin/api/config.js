// API Configuration - Tập trung quản lý API URLs
export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

export const getToken = () => localStorage.getItem("token");

export const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});
