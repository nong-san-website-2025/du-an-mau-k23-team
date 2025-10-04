import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ResetPasswordPage() {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      const res = await api.post(`/users/password-reset-confirm/${uidb64}/${token}/`, {
        password,
      });
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 2000); // chuyển về login sau 2s
    } catch (err) {
      setError(err.response?.data?.error || "Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  return (
    <div className="container mt-5">
      <h4>Đặt lại mật khẩu</h4>
      <form onSubmit={handleSubmit} className="mt-3">
        <input
          type="password"
          className="form-control mb-3"
          placeholder="Mật khẩu mới"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          className="form-control mb-3"
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <div className="text-danger mb-2">{error}</div>}
        {message && <div className="text-success mb-2">{message}</div>}

        <button className="btn btn-success w-100">Đặt lại mật khẩu</button>
      </form>
    </div>
  );
}
