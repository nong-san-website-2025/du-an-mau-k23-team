// frontend/src/features/login_register/hooks/useRegister.js
import { useState } from "react";
import { useAuth } from "../services/AuthContext";
import { useNavigate } from "react-router-dom";

export function useRegister(onSuccess) {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setError("");

    if (!form.username || !form.email || !form.password || !form.password2) {
      setError("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (form.password !== form.password2) {
      setError("Mật khẩu nhập lại không khớp!");
      return;
    }

    setLoading(true);
    try {
      // Gọi register từ AuthContext: tự xử lý đăng ký, auto-login và xác nhận role
      const res = await register({
        username: form.username,
        email: form.email,
        password: form.password,
        password2: form.password2,
      });

      if (res?.success) {
        onSuccess?.(res);
        // Điều hướng thẳng về trang "/"; Context đã cập nhật ngay nên không cần qua trang profile
        navigate("/");
      } else {
        setError(res?.error || "Đăng ký thất bại, vui lòng thử lại!");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    error,
    handleChange,
    handleSubmit,
  };
}
