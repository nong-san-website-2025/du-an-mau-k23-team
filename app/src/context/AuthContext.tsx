// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { API } from "../api/api";
import type { User, GuestCartItem, CartResponseItem } from "../types/models";
import { SecureStorage } from "../utils/secureStorage";

// Định nghĩa kiểu cho User đã đăng nhập
type AuthUser = User & { isAuthenticated: true; token: string };

interface LoginResponse {
  access: string;
  refresh: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (
    username: string,
    password: string
  ) => Promise<{
    success: boolean;
    role?: string;
    token?: string;
    error?: string;
  }>;
  logout: () => Promise<void>;
  loginWithToken: (
    accessToken: string,
    refreshToken?: string | null
  ) => Promise<void>;
  register: (
    payload: Record<string, unknown>
  ) => Promise<{ success: boolean; data?: unknown; error?: string }>;
  googleLogin: (googleResponse: {
    access: string;
    refresh: string;
  }) => Promise<{ success: boolean; user?: User; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // 1. INIT AUTH
  // ==========================================
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await SecureStorage.getToken();

        if (!token) {
          setUser(null);
          return;
        }

        const userData = await API.get<User>("/users/me/");
        setUser({ ...userData, isAuthenticated: true, token });
      } catch (err: unknown) { // ✅ Dùng unknown thay vì any
        console.error("AuthProvider init error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    
    const handleLogoutEvent = () => logout();
    window.addEventListener('user-logged-out', handleLogoutEvent);

    return () => {
        window.removeEventListener('user-logged-out', handleLogoutEvent);
    }
  }, []);

  // ==========================================
  // 2. LOGIN
  // ==========================================
  const login = async (username: string, password: string) => {
    try {
      // Xác định rõ kiểu trả về <LoginResponse> và kiểu data gửi đi
      const tokens = await API.post<LoginResponse, {username: string, password: string}>(
        "/users/login/",
        { username, password }
      );

      await SecureStorage.setToken(tokens.access);
      if (tokens.refresh) await SecureStorage.setRefreshToken(tokens.refresh);

      const userData = await API.get<User>("/users/me/");
      
      const authUser: AuthUser = {
        ...userData,
        isAuthenticated: true,
        token: tokens.access,
      };
      
      setUser(authUser);
      window.dispatchEvent(new CustomEvent("user-logged-in"));
      
      return { success: true, role: userData.role, token: tokens.access };
    } catch (err: unknown) { // ✅ Strict Error Handling
      const errorMessage = err instanceof Error ? err.message : "Đăng nhập thất bại";
      return { success: false, error: errorMessage };
    }
  };

  // ==========================================
  // 3. LOGOUT (Sync Cart Logic)
  // ==========================================
  const logout = async () => {
    try {
      const token = await SecureStorage.getToken();
      
      if (token) {
        const serverCart = await API.get<CartResponseItem[]>("/cartitems/");
        
        // Map dữ liệu Strict Type
        const guestCart: GuestCartItem[] = serverCart.map((item) => {
            // Lấy product_data an toàn (nếu null thì dùng fallback)
            const pData = item.product_data;

            return {
                product: item.product, 
                quantity: item.quantity,
                product_data: {
                    // Dùng Nullish Coalescing (??) để fallback giá trị mặc định
                    id: pData?.id ?? item.product,
                    name: pData?.name ?? "Unknown Product",
                    price: pData?.price ?? 0,
                    image: pData?.image ?? "",
                },
            };
        });

        if (guestCart.length > 0) {
          await SecureStorage.setGuestCart(JSON.stringify(guestCart));
        }
      }
    } catch (e: unknown) { // ✅ Catch error an toàn
      console.warn("Cart sync on logout failed", e);
    }

    await SecureStorage.clearAuth();
    setUser(null);
  };

  // ==========================================
  // 4. LOGIN WITH TOKEN
  // ==========================================
  const loginWithToken = async (
    accessToken: string,
    refreshToken: string | null = null
  ) => {
    try {
      await SecureStorage.setToken(accessToken);
      if (refreshToken) await SecureStorage.setRefreshToken(refreshToken);
      
      const userData = await API.get<User>("/users/me/");
      setUser({ ...userData, isAuthenticated: true, token: accessToken });
      
      window.dispatchEvent(new CustomEvent("user-logged-in"));
    } catch (err: unknown) {
      console.error("loginWithToken failed:", err);
      await SecureStorage.clearAuth();
      setUser(null);
    }
  };

  // ==========================================
  // 5. REGISTER
  // ==========================================
  const register = async (payload: Record<string, unknown>) => {
    try {
      const data = await API.post("/users/register/", payload);
      
      if (
        typeof payload.username === "string" &&
        typeof payload.password === "string"
      ) {
        await login(payload.username, payload.password);
      }
      return { success: true, data };
    } catch (err: unknown) { // ✅ Strict Error Handling
      const errorMessage = err instanceof Error ? err.message : "Đăng ký thất bại";
      return { success: false, error: errorMessage };
    }
  };

  // ==========================================
  // 6. GOOGLE LOGIN
  // ==========================================
  const googleLogin = async (googleResponse: {
    access: string;
    refresh: string;
  }) => {
    try {
      await SecureStorage.setToken(googleResponse.access);
      await SecureStorage.setRefreshToken(googleResponse.refresh);
      
      const userData = await API.get<User>("/users/me/");
      
      setUser({
        ...userData,
        isAuthenticated: true,
        token: googleResponse.access,
      });
      window.dispatchEvent(new CustomEvent("user-logged-in"));
      return { success: true, user: userData };
    } catch (err: unknown) { // ✅ Strict Error Handling
      const errorMessage = err instanceof Error ? err.message : "Đăng nhập Google thất bại";
      return { success: false, error: errorMessage };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    loginWithToken,
    register,
    googleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};