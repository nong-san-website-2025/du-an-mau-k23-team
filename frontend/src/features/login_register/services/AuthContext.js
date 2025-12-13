import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
// import { jwtDecode } from "jwt-decode"; // Nếu không dùng ở dưới thì có thể bỏ comment hoặc xóa
import { message, notification } from "antd"; // ✅ Import Ant Design

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user từ token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await api.get("/users/me/");
        const userData = {
          ...res.data,
          isAuthenticated: true,
          token,
        };
        setUser(userData);
        
        // Đồng bộ role flag vào localStorage
        const roleValue = res.data?.role?.name || res.data?.role || "";
        if (String(roleValue).trim().toLowerCase() === "seller") {
          localStorage.setItem("is_seller", "true");
        } else {
          localStorage.removeItem("is_seller");
        }
      } catch (err) {
        console.error("Cannot fetch current user:", err);
        // Không cần thông báo lỗi ở đây vì người dùng chỉ vừa F5 lại trang
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // --- HÀM LOGIN ---
  const login = async (username, password) => {
    try {
      const { data } = await api.post("users/login/", { username, password });

      localStorage.setItem("token", data.access);
      if (data.refresh) localStorage.setItem("refresh", data.refresh);

      const meRes = await api.get("/users/me/");
      const userData = {
        ...meRes.data,
        isAuthenticated: true,
        token: data.access,
      };
      setUser(userData);

      if (meRes.data?.username) {
        localStorage.setItem("username", meRes.data.username);
      }

      // Đồng bộ role flag vào localStorage
      const roleValue = meRes.data?.role?.name || meRes.data?.role || "";
      if (String(roleValue).trim().toLowerCase() === "seller") {
        localStorage.setItem("is_seller", "true");
      } else {
        localStorage.removeItem("is_seller");
      }

      window.dispatchEvent(new CustomEvent("user-logged-in"));

      // ✅ THÔNG BÁO THÀNH CÔNG
      message.success(`Xin chào, ${meRes.data.username || "bạn"}! Đăng nhập thành công.`);

      return { success: true, role: meRes.data.role, token: data.access };
    } catch (err) {
      // ✅ XỬ LÝ LỖI
      const errorDetail = err.response?.data?.detail;
      let errorMsg = "Đăng nhập thất bại. Vui lòng thử lại!";

      // Kiểm tra mã lỗi hoặc nội dung text trả về để báo cụ thể
      if (err.response?.status === 401) {
        errorMsg = "Sai tên tài khoản hoặc mật khẩu!";
      } else if (errorDetail) {
        errorMsg = errorDetail; // Lỗi cụ thể từ backend nếu có
      }

      message.error(errorMsg); // Hiển thị lỗi màu đỏ

      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  // --- HÀM LOGIN WITH TOKEN (OAuth/VNPAY) ---
  const loginWithToken = async (accessToken, refreshToken = null) => {
    try {
      localStorage.setItem("token", accessToken);
      if (refreshToken) localStorage.setItem("refresh", refreshToken);

      const meRes = await api.get("/users/me/");
      const userData = {
        ...meRes.data,
        isAuthenticated: true,
        token: accessToken,
      };
      setUser(userData);

      // Đồng bộ role flag vào localStorage
      const roleValue = meRes.data?.role?.name || meRes.data?.role || "";
      if (String(roleValue).trim().toLowerCase() === "seller") {
        localStorage.setItem("is_seller", "true");
      } else {
        localStorage.removeItem("is_seller");
      }

      window.dispatchEvent(new CustomEvent("user-logged-in"));
      
      // ✅ Thông báo nhẹ
      message.success("Đăng nhập thành công!");

    } catch (err) {
      console.error("loginWithToken error:", err);
      setUser(null);
      message.error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
    }
  };

  // --- HÀM LOGOUT ---
  const logout = async () => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const refreshToken = localStorage.getItem("refresh");
          await api.post("/users/logout/", {
            refresh: refreshToken,
          });
        } catch (logoutErr) {
          console.warn("Logout API call failed:", logoutErr);
        }

        // Xử lý cart (giữ nguyên logic của bạn)
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
      const keysToRemove = ["token", "refresh", "username"]; // Xóa thêm username cho sạch
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      setUser(null);

      window.dispatchEvent(new CustomEvent("user-logged-out"));

      // ✅ THÔNG BÁO LOGOUT
      message.success("Đăng xuất thành công. Hẹn gặp lại!");
    }
  };

  // --- GIÁ TRỊ CONTEXT ---
  const value = {
    user,
    login,
    logout,
    loginWithToken,
    register: async (payload) => {
      try {
        const { data } = await api.post("/users/register/", payload);
        
        // ✅ THÔNG BÁO ĐĂNG KÝ
        message.success("Đăng ký tài khoản thành công! Đang đăng nhập...");

        if (payload?.username && payload?.password) {
          // Gọi login nội bộ (login này đã có thông báo success riêng rồi)
          await login(payload.username, payload.password);
        }
        return { success: true, data };
      } catch (err) {
        // ✅ XỬ LÝ LỖI ĐĂNG KÝ
        // Backend thường trả về object lỗi validation, ví dụ: { username: ["Tên này đã tồn tại"] }
        const errorData = err.response?.data;
        let errorMessage = "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";

        if (errorData) {
            // Nếu backend trả về string lỗi trực tiếp
            if (typeof errorData.detail === 'string') {
                errorMessage = errorData.detail;
            } 
            // Nếu backend trả về lỗi validation dạng object
            else if (typeof errorData === 'object') {
                // Lấy lỗi đầu tiên tìm thấy
                const firstKey = Object.keys(errorData)[0];
                const firstError = errorData[firstKey];
                if (Array.isArray(firstError)) {
                    errorMessage = `${firstKey}: ${firstError[0]}`; // VD: username: Tài khoản đã tồn tại
                }
            }
        }

        // Dùng notification cho lỗi đăng ký vì nội dung lỗi có thể dài
        notification.error({
            message: 'Đăng ký thất bại',
            description: errorMessage,
            placement: 'topRight',
        });

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    googleLogin: async (googleResponse) => {
      try {
        localStorage.setItem("token", googleResponse.access);
        localStorage.setItem("refresh", googleResponse.refresh);

        const meRes = await api.get("/users/me/");
        const userData = {
          ...meRes.data,
          isAuthenticated: true,
          token: googleResponse.access,
        };
        setUser(userData);

        // Đồng bộ role flag vào localStorage
        const roleValue = meRes.data?.role?.name || meRes.data?.role || "";
        if (String(roleValue).trim().toLowerCase() === "seller") {
          localStorage.setItem("is_seller", "true");
        } else {
          localStorage.removeItem("is_seller");
        }

        window.dispatchEvent(new CustomEvent("user-logged-in"));
        
        // ✅ Thông báo Google
        message.success(`Đăng nhập Google thành công! Chào ${meRes.data.username}`);

        return { success: true, user: meRes.data };
      } catch (err) {
        console.error("Google login failed:", err);
        message.error("Đăng nhập Google thất bại. Vui lòng thử lại sau.");
        return { success: false, error: "Google login failed" };
      }
    },
    setRole: (newRole) => {
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, role: newRole };
        
        // Đồng bộ role flag vào localStorage
        if (String(newRole).trim().toLowerCase() === "seller") {
          localStorage.setItem("is_seller", "true");
        } else {
          localStorage.removeItem("is_seller");
        }
        
        return updated;
      });
    },
    isAuthenticated: () => !!user?.isAuthenticated,
    isAdmin: () => {
      const roleValue = user?.role?.name || user?.role || "";
      return String(roleValue).trim().toLowerCase() === "admin";
    },
    isSeller: () => {
      const roleValue = user?.role?.name || user?.role || "";
      return String(roleValue).trim().toLowerCase() === "seller";
    },
    isCustomer: () => {
      const roleValue = user?.role?.name || user?.role || "";
      return String(roleValue).trim().toLowerCase() === "customer";
    },
    getRole: () => user?.role,
    api,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};