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
    status: "",
    address: "",
    role_id: "",
    is_seller: false,
    is_admin: false,
    is_support: false,
    is_locked: false,
  });

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const getToken = () =>
    localStorage.getItem("access_token") || localStorage.getItem("token") || "";

  // load roles nếu có API
  useEffect(() => {
    const token = getToken();
    axios
      .get(`${API_BASE_URL}/roles/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setRoles(res.data || []))
      .catch((err) => console.error("Lỗi load roles:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/users/`, formData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (onUserAdded) onUserAdded(res.data);
      onClose();
    } catch (err) {
      console.error("❌ Lỗi thêm user:", err.response?.data || err.message);
      alert("Không thể thêm user, xem console để biết chi tiết.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        background: "rgba(0,0,0,0.5)",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
      }}
    >
      <div
        className="modal-dialog modal-lg"
        style={{ marginLeft: "40%"}}
      >
        <div className="modal-content shadow-lg border-0" style={{ width: "1000px" }}>
          <div className="modal-header border-0 pb-0">
            <h4 className="modal-title fw-bold">Thêm người dùng</h4>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Thông tin cơ bản */}
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

              {/* Mật khẩu */}
              <div className="mb-2">
                <label className="form-label">Mật khẩu</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              {/* Dropdown Role */}
              {Array.isArray(roles) && roles.length > 0 && (
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

              {/* Quyền flags */}
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="is_seller"
                  checked={formData.is_seller}
                  onChange={handleChange}
                />
                <label className="form-check-label">Seller</label>
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="is_admin"
                  checked={formData.is_admin}
                  onChange={handleChange}
                />
                <label className="form-check-label">Admin</label>
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="is_support"
                  checked={formData.is_support}
                  onChange={handleChange}
                />
                <label className="form-check-label">Support</label>
              </div>
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="is_locked"
                  checked={formData.is_locked}
                  onChange={handleChange}
                />
                <label className="form-check-label">Khóa tài khoản</label>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-0">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? "Đang lưu..." : "Thêm người dùng"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
