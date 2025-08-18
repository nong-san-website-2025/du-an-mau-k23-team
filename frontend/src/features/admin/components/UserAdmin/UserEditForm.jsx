import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api"; // chỉnh 1 chỗ dùng mọi nơi

export default function UserEditForm({ editUser, onCancel, onSave }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    phone: "",
    status: "",
    address: "",
    role_id: "",
    is_seller: false,
    is_admin: false,
    is_support: false,
    is_locked: false,
    avatar: null,
  });

  const [roles, setRoles] = useState([]); // nếu có API roles sẽ hiện dropdown
  const [loading, setLoading] = useState(false);

  // Lấy token từ localStorage (hỗ trợ cả 'access_token' hoặc 'token')
  const getToken = () =>
    localStorage.getItem("access_token") || localStorage.getItem("token") || "";

  // Load roles (nếu có endpoint) + fill form từ editUser
  useEffect(() => {
    const token = getToken();

    // (Tuỳ chọn) Nếu bạn có endpoint roles, mở comment đoạn này và đúng URL:
    axios
      .get(`${API_BASE_URL}/roles/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setRoles(res.data || []))
      .catch((err) => console.error("Lỗi load roles:", err));

    // Fill form từ editUser
    setFormData({
      username: editUser?.username || "",
      email: editUser?.email || "",
      full_name: editUser?.full_name || "",
      phone: editUser?.phone || "",
      status: editUser?.status || "",
      address: editUser?.address || "",
      role_id: editUser?.role ? editUser.role.id : "",
      is_seller: !!editUser?.is_seller,
      is_admin: !!editUser?.is_admin,
      is_support: !!editUser?.is_support,
      is_locked: !!editUser?.is_locked,
      avatar: null,
    });
  }, [editUser]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setFormData((s) => ({ ...s, [name]: checked }));
    } else if (type === "file") {
      setFormData((s) => ({ ...s, avatar: files?.[0] || null }));
    } else {
      setFormData((s) => ({ ...s, [name]: value }));
    }
  };

  // UserEditForm.jsx
  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const payload = {
      username: formData.username,
      email: formData.email,
      full_name: formData.full_name,
      phone: formData.phone,
      status: formData.status,
      address: formData.address,
      role_id: formData.role_id || null,
      is_seller: formData.is_seller,
      is_admin: formData.is_admin,
      is_support: formData.is_support,
      is_locked: formData.is_locked,
    };

    const response = await axios.patch(
      `${API_BASE_URL}/users/${editUser.id}/`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );

    if (onSave) onSave(response.data);
  } catch (err) {
    console.error("❌ Cập nhật user thất bại:", err.response?.data || err.message);
  } finally {
    setLoading(false);
  }
};



  return (
    <form onSubmit={handleSubmit}>
      {/* Thông tin cơ bản */}
      <div className="mb-2">
        <label className="form-label">Tên đăng nhập</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="form-control"
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

      {/* Avatar */}
      {/* <div className="mb-2">
        <label className="form-label">Ảnh đại diện</label>
        <input
          type="file"
          name="avatar"
          accept="image/*"
          onChange={handleChange}
          className="form-control"
        />
      </div> */}

      {/* Trạng thái */}
      {/* <div className="mb-2">
        <label className="form-label">Trạng thái</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="form-select"
        >
          <option value="">-- Chọn trạng thái --</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Ngừng hoạt động</option>
        </select>
      </div> */}

      {/* (Tuỳ chọn) Dropdown Role: chỉ hiện khi có dữ liệu roles */}
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

      <div className="d-flex justify-content-end gap-2">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onCancel}
        >
          Hủy
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}
