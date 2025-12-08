import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user từ token, fetch role trực tiếp từ backend
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await api.get("/users/me/"); // backend trả về { username, role, ... }
        setUser({
          ...res.data,
          isAuthenticated: true,
          token,
        });
      } catch (err) {
        console.error("Cannot fetch current user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Trong hàm login
  const login = async (username, password) => {
    try {
      const { data } = await api.post("users/login/", { username, password });

      localStorage.setItem("token", data.access);
      if (data.refresh) localStorage.setItem("refresh", data.refresh);

      const meRes = await api.get("/users/me/");
      setUser({
        ...meRes.data,
        isAuthenticated: true,
        token: data.access,
      });

      // Store username in localStorage for seller status checking
      if (meRes.data?.username) {
        localStorage.setItem("username", meRes.data.username);
      }

      // 👇 GỬI SỰ KIỆN ĐĂNG NHẬP THÀNH CÔNG
      window.dispatchEvent(new CustomEvent("user-logged-in"));

      return { success: true, role: meRes.data.role, token: data.access };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || "Login failed",
      };
    }
  };

  // Trong hàm loginWithToken (dùng cho OAuth callback, VNPAY, v.v.)
  const loginWithToken = async (accessToken, refreshToken = null) => {
    try {
      localStorage.setItem("token", accessToken);
      if (refreshToken) localStorage.setItem("refresh", refreshToken);

      const meRes = await api.get("/users/me/");
      setUser({
        ...meRes.data,
        isAuthenticated: true,
        token: accessToken,
      });

      // 👇 GỬI SỰ KIỆN
      window.dispatchEvent(new CustomEvent("user-logged-in"));
    } catch (err) {
      console.error("loginWithToken error:", err);
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("token");

      // 🔥 GỬI REQUEST LOGOUT ĐẾN BACKEND (ghi log)
      if (token) {
        try {
          const refreshToken = localStorage.getItem("refresh");
          await api.post("/users/logout/", {
            refresh: refreshToken,
          });
        } catch (logoutErr) {
          console.warn("Logout API call failed (but continuing):", logoutErr);
        }

        // Xử lý cart như cũ
        try {
          const res = await api.get("/cartitems/");
          const serverCart = Array.isArray(res.data) ? res.data : [];
          const guestCart = serverCart.map((item) => ({
            product: item.product_data?.id || item.product,
            quantity: item.quantity,
            product_data: {
              id: item.product_data?.id || item.product,
              name: item.product_data?.name || "",
              price: item.product_data?.price || 0,
              image: item.product_data?.image || "",
            },
          }));
          if (guestCart.length > 0) {
            localStorage.setItem("guest_cart", JSON.stringify(guestCart));
          }
        } catch (e) {
          console.warn("Could not sync cart to guest_cart on logout", e);
        }
      }
    } catch (err) {
      console.error("Logout process error:", err);
    } finally {
      // ✅ LUÔN XÓA TOKEN VÀ RESET USER (dù có lỗi hay không)
      const keysToRemove = ["token", "refresh"];
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      setUser(null);

      // 👇 GỬI SỰ KIỆN ĐĂNG XUẤT (nếu cần)
      window.dispatchEvent(new CustomEvent("user-logged-out"));
    }
  };

  const value = {
    user,
    login,
    logout,
    loginWithToken,
    register: async (payload) => {
      // giữ nguyên logic register, chỉ cần gọi login() đã refactor
      try {
        const { data } = await api.post("/users/register/", payload);
        if (payload?.username && payload?.password) {
          await login(payload.username, payload.password);
        }
        return { success: true, data };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.detail || "Register failed",
        };
      }
    },
    googleLogin: async (googleResponse) => {
      try {
        localStorage.setItem("token", googleResponse.access);
        localStorage.setItem("refresh", googleResponse.refresh);

        const meRes = await api.get("/users/me/");
        setUser({
          ...meRes.data,
          isAuthenticated: true,
          token: googleResponse.access,
        });

        window.dispatchEvent(new CustomEvent("user-logged-in"));

        return { success: true, user: meRes.data };
      } catch (err) {
        console.error("Google login failed:", err);
        return { success: false, error: "Google login failed" };
      }
    },
    isAuthenticated: () => !!user?.isAuthenticated,
    isAdmin: () => user?.role === "admin",
    isSeller: () => user?.role === "seller",
    isCustomer: () => user?.role === "customer",
    getRole: () => user?.role,
    api,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
