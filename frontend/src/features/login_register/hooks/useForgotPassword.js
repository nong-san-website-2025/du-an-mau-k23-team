// src/features/auth/hooks/useForgotPassword.js
import { useState } from "react";
import api from "../services/api";

export function useForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendResetEmail = async (email) => {
    if (!email || !email.trim()) {
      setError("Vui lòng nhập email!");
      return { success: false, error: "Vui lòng nhập email!" };
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/users/password-reset-request/", { email });

      if (data?.message) {
        return {
          success: true,
          message: data.message,
        };
      }

      const errorMessage = data?.error || "Gửi email thất bại!";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Có lỗi xảy ra. Vui lòng thử lại!";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    sendResetEmail,
  };
}
