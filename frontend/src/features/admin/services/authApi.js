// services/authApi.js

const API_BASE = "http://localhost:8000/api";

// Lưu token vào localStorage
function saveTokens(access, refresh) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

// Xóa token (logout)
function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export const authApi = {
  // Đăng nhập -> lấy token
  login: async (username, password) => {
    const res = await fetch(`${API_BASE}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) throw new Error("Đăng nhập thất bại");

    const data = await res.json();
    saveTokens(data.access, data.refresh);
    return data; // { access, refresh }
  },

  // Làm mới access token
  refreshToken: async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) throw new Error("Không có refresh token");

    const res = await fetch(`${API_BASE}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) throw new Error("Refresh token thất bại");

    const data = await res.json();
    saveTokens(data.access, refresh); // refresh không đổi
    return data.access;
  },

  // Đăng xuất
  logout: () => {
    clearTokens();
    window.location.href = "/login"; // Điều hướng về trang login
  },

  // Kiểm tra đang đăng nhập hay không
  isAuthenticated: () => {
    return !!localStorage.getItem("access_token");
  },
};
