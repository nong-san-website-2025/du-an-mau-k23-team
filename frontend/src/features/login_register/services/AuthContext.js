import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user từ localStorage
  useEffect(() => {
    console.log("AuthProvider: Loading user from localStorage...");
    
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    let role = localStorage.getItem("role");

    console.log("AuthProvider Debug:");
    console.log("- Token from localStorage:", token ? "exists" : "null");
    console.log("- Username from localStorage:", username);
    console.log("- Role from localStorage:", role);

    // Fallback: nếu role là undefined hoặc null, kiểm tra is_admin/is_seller
    if (!role || role === 'undefined' || role === 'null') {
      const isAdmin = localStorage.getItem("is_admin");
      const isSeller = localStorage.getItem("is_seller");
      
      console.log("- is_admin from localStorage:", isAdmin);
      console.log("- is_seller from localStorage:", isSeller);
      
      if (isAdmin === 'true' || username === 'admin') {
        role = 'admin';
        localStorage.setItem("role", role); // Cập nhật lại localStorage
      } else if (isSeller === 'true') {
        role = 'seller';
        localStorage.setItem("role", role);
      } else {
        role = 'customer';
        localStorage.setItem("role", role);
      }
      
      console.log("- Determined role from fallback logic:", role);
    }

    if (token && username && role) {
      const userData = { 
        token, 
        username, 
        role, 
        isAuthenticated: true 
      };
      
      console.log("✅ Setting user data:", userData);
      setUser(userData);
    } else {
      console.log("❌ Missing authentication data in localStorage");
      setUser(null);
    }
    
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      console.log("AuthProvider: Attempting login for username:", username);
      
      const { data } = await api.post("/users/login/", { username, password });
      
      console.log("Login response data:", data);
      
      // Xử lý cả format cũ (is_admin, is_seller) và format mới (role)
      let userRole;
      if (data.role && data.role !== 'undefined') {
        userRole = data.role;
      } else {
        // Fallback cho format cũ - kiểm tra cả string và boolean
        const isAdmin = data.is_admin === true || data.is_admin === 'true';
        const isSeller = data.is_seller === true || data.is_seller === 'true';
        
        if (isAdmin) {
          userRole = 'admin';
        } else if (isSeller) {
          userRole = 'seller';
        } else {
          userRole = 'customer';
        }
      }
      
      // Special case: nếu username là 'admin' và không có role rõ ràng, set role = admin
      if (data.username === 'admin' && userRole === 'customer') {
        userRole = 'admin';
        console.log("⚠️ Special case: username 'admin' detected, setting role to admin");
      }
      
      console.log("Determined user role:", userRole);
      
      // Lưu vào localStorage
      localStorage.setItem("token", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("username", data.username);
      localStorage.setItem("role", userRole);

      const userData = {
        token: data.access,
        username: data.username,
        role: userRole,
        isAuthenticated: true,
      };

      console.log("✅ Login successful, setting user:", userData);
      setUser(userData);

      return { success: true, role: userRole, token: data.access };
    } catch (err) {
      console.log("❌ Login failed:", err.response?.data);
      return { success: false, error: err.response?.data?.detail || "Login failed" };
    }
  };

  const register = async (payload) => {
    try {
      console.log("AuthProvider: Attempting registration with payload:", payload);
      
      const { data } = await api.post("/users/register/", payload);
      
      console.log("Register response data:", data);
      return { success: true, data };
    } catch (err) {
      console.log("❌ Register failed:", err.response?.data);
      return { success: false, error: err.response?.data?.detail || "Register failed" };
    }
  };

  const logout = () => {
    console.log("AuthProvider: Logging out user");
    localStorage.clear();
    setUser(null);
  };

  // Debug current user state
  useEffect(() => {
    console.log("AuthProvider: Current user state changed:", user);
  }, [user]);

  const setRole = (newRole) => {
    const normalized = String(newRole || '').trim().toLowerCase();
    console.log('AuthProvider.setRole():', normalized);

    // Update localStorage immediately
    localStorage.setItem('role', normalized);
    if (normalized === 'seller') {
      localStorage.setItem('is_seller', 'true');
    }

    // Update context state
    setUser((prev) => {
      if (!prev) return { role: normalized, isAuthenticated: true };
      return { ...prev, role: normalized };
    });
  };

  const value = {
    user,
    login,
    logout,
    register,
    setRole, // expose setter for immediate role update
    isAuthenticated: () => {
      const result = !!user?.isAuthenticated;
      console.log("isAuthenticated():", result);
      return result;
    },
    isAdmin: () => {
      const result = user?.role === 'admin';
      console.log("isAdmin():", result, "- User role:", user?.role);
      return result;
    },
    isSeller: () => {
      const result = user?.role === 'seller';
      console.log("isSeller():", result, "- User role:", user?.role);
      return result;
    },
    isCustomer: () => {
      const result = user?.role === 'customer';
      console.log("isCustomer():", result, "- User role:", user?.role);
      return result;
    },
    getRole: () => {
      console.log("getRole():", user?.role);
      return user?.role;
    },
    api,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};