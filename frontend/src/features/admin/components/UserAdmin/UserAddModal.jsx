// components/UserAdmin/UserAddModal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

export default function UserAddModal({ onClose, onUserAdded }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    phone: "",
    password: "",
    role_id: "",
  });

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const getToken = () =>
    localStorage.getItem("access_token") || localStorage.getItem("token") || "";

  // Load roles từ backend
  useEffect(() => {
    const token = getToken();
    axios
      .get(`${API_BASE_URL}/roles/list/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setRoles(res.data || []))
      .catch((err) => console.error("❌ Lỗi load roles:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const payload = { ...formData };

    // Nếu admin bỏ trống password, set mặc định
    if (!payload.password) payload.password = "123456";

    const res = await axios.post(`${API_BASE_URL}/user-management/`, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (onUserAdded) onUserAdded(res.data); // cập nhật bảng ngay
    onClose();
  } catch (err) {
    console.error("❌ Lỗi thêm user:", err.response?.data || err.message);
    alert("Không thể thêm user, xem console để biết chi tiết.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Thêm người dùng</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-2">
                <label className="form-label">Tên đăng nhập</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="mb-2">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="mb-2">
                <label className="form-label">Họ và tên</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>

              <div className="mb-2">
                <label className="form-label">Số điện thoại</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>

              <div className="mb-2">
                <label className="form-label">Mật khẩu (tùy chọn)</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Để trống nếu muốn tạo mặc định"
                />
              </div>

              {roles.length > 0 && (
                <div className="mb-2">
                  <label className="form-label">Quyền (role)</label>
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">-- Chọn quyền --</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                Hủy
              </button>
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? "Đang lưu..." : "Thêm người dùng"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
