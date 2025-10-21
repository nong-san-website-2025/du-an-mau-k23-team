// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { API } from "../api/api";
import type { User, GuestCartItem, CartResponseItem } from "../types/models";
import { SecureStorage } from "../utils/secureStorage"; // ✅ Import mới

type AuthUser = User & { isAuthenticated: true; token: string };

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

  useEffect(() => {
    console.log("AuthProvider: initializing auth...");
    const initAuth = async () => {
      try {
        const token = await SecureStorage.getToken();
        console.log(
          "Token from secure storage:",
          token ? "✅ exists" : "❌ null"
        );

        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        const userData = await API.get<User>("/users/me/", true);
        console.log("User data fetched:", userData);
        setUser({ ...userData, isAuthenticated: true, token });
      } catch (err) {
        console.error("AuthProvider init error:", err);
        setUser(null);
      } finally {
        console.log("AuthProvider: setting loading = false");
        setLoading(false); // 👈 đảm bảo dòng này luôn chạy
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const tokens = await API.post<{ access: string; refresh: string }>(
        "/users/login/",
        {
          username,
          password,
        }
      );

      await SecureStorage.setToken(tokens.access);
      if (tokens.refresh) await SecureStorage.setRefreshToken(tokens.refresh);

      const userData = await API.get<User>("/users/me/", true);
      const authUser: AuthUser = {
        ...userData,
        isAuthenticated: true,
        token: tokens.access,
      };
      setUser(authUser);
      window.dispatchEvent(new CustomEvent("user-logged-in"));
      return { success: true, role: userData.role, token: tokens.access };
    } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message || "Login failed" };
    }
  };

  const logout = async () => {
    try {
      const token = await SecureStorage.getToken();
      if (token) {
        const serverCart = await API.get<CartResponseItem[]>(
          "/cartitems/",
          true
        );
        const guestCart: GuestCartItem[] = serverCart.map((item) => ({
          product: item.product_data?.id || item.product,
          quantity: item.quantity,
          product_data: {
            id: item.product_data?.id || item.product,
            name: item.product_data?.name || "Unknown Product",
            price: item.product_data?.price || 0,
            image: item.product_data?.image || "",
          },
        }));
        if (guestCart.length > 0) {
          await SecureStorage.setGuestCart(JSON.stringify(guestCart));
        }
      }
    } catch (e) {
      console.warn("Cart sync on logout failed", e);
    }

    await SecureStorage.removeToken();
    await SecureStorage.removeRefreshToken();
    setUser(null);
  };

  const loginWithToken = async (
    accessToken: string,
    refreshToken: string | null = null
  ) => {
    try {
      await SecureStorage.setToken(accessToken);
      if (refreshToken) await SecureStorage.setRefreshToken(refreshToken);
      const userData = await API.get<User>("/users/me/", true);
      setUser({ ...userData, isAuthenticated: true, token: accessToken });
      window.dispatchEvent(new CustomEvent("user-logged-in"));
    } catch (err) {
      console.error("loginWithToken failed:", err);
      await SecureStorage.removeToken();
      await SecureStorage.removeRefreshToken();
      setUser(null);
    }
  };

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
    } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message || "Register failed" };
    }
  };

  const googleLogin = async (googleResponse: {
    access: string;
    refresh: string;
  }) => {
    try {
      await SecureStorage.setToken(googleResponse.access);
      await SecureStorage.setRefreshToken(googleResponse.refresh);
      const userData = await API.get<User>("/users/me/", true);
      setUser({
        ...userData,
        isAuthenticated: true,
        token: googleResponse.access,
      });
      window.dispatchEvent(new CustomEvent("user-logged-in"));
      return { success: true, user: userData };
    } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message || "Google login failed" };
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
