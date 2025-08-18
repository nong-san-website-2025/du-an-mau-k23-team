import React, { useState } from "react";
import axios from "axios";

const mainColor = "#2E8B57";

const ChangePassword = () => {
  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (form.new_password !== form.confirm_password) {
    setError("Mật khẩu mới và xác nhận không khớp.");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    await axios.post(
      "http://localhost:8000/api/users/change-password/",
      {
        current_password: form.old_password,
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    setMessage("Đổi mật khẩu thành công!");
    setForm({
      old_password: "",
      new_password: "",
      confirm_password: "",
    });
  } catch (err) {
    setError(err.response?.data?.error || "Có lỗi xảy ra.");
  }
};
  return (
    <div>
      <h5 style={{ color: mainColor }}>Đổi mật khẩu</h5>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Mật khẩu hiện tại</label>
          <input
            type="password"
            name="old_password"
            className="form-control"
            value={form.old_password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label>Mật khẩu mới</label>
          <input
            type="password"
            name="new_password"
            className="form-control"
            value={form.new_password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label>Xác nhận mật khẩu mới</label>
          <input
            type="password"
            name="confirm_password"
            className="form-control"
            value={form.confirm_password}
            onChange={handleChange}
            required
          />
        </div>
        <button className="btn btn-success" type="submit">
          Đổi mật khẩu
        </button>
        {message && <div className="mt-3 text-success">{message}</div>}
        {error && <div className="mt-3 text-danger">{error}</div>}
      </form>
    </div>
  );
};

export default ChangePassword;
