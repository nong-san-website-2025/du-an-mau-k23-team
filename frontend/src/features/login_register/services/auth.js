// services/authApi.js
const API_URL = "http://localhost:8000/api";

export const authApi = {
  login: async (username, password) => {
    const res = await fetch(`${API_URL}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      return { success: true, ...data };
    }
    return { success: false, error: data.detail || "Sai tài khoản hoặc mật khẩu" };
  },

  refresh: async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) return null;
    const res = await fetch(`${API_URL}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", data.access);
      return data.access;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
  },

  register: async (payload) => {
    const res = await fetch(`${API_URL}/users/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) return { success: true, ...data };
    return { success: false, error: data.detail || "Đăng ký thất bại" };
  },

  forgotPassword: async (email) => {
    return fetch(`${API_URL}/users/forgot-password/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  },

  verifyCode: async (email, code) => {
    return fetch(`${API_URL}/users/verify-code/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
  },

  resetPassword: async (email, password) => {
    return fetch(`${API_URL}/users/reset-password/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  },
};
