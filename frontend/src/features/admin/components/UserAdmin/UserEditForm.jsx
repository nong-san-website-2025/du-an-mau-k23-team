// components/UserAdmin/UserEditForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

export default function UserEditForm({ editUser, onCancel, onSave }) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    role_id: "",
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const getToken = () => localStorage.getItem("token") || "";

  // Load roles + fill data từ editUser
  useEffect(() => {
    if (!editUser) return;

    const token = getToken();

    axios
      .get(`${API_BASE_URL}/users/roles/list/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("✅ Roles response:", res.data);
        setRoles(res.data || []);
      })
      .catch((err) => console.error("❌ Lỗi load roles:", err));

    setFormData({
      full_name: editUser?.full_name || "",
      phone: editUser?.phone || "",
      role_id: editUser?.role ? String(editUser.role.id) : "",
    });
  }, [editUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editUser?.id) {
      console.error("❌ Không có user để update");
      return;
    }
    setLoading(true);

    try {
      const payload = {
        full_name: formData.full_name,
        phone: formData.phone,
        role_id: formData.role_id ? Number(formData.role_id) : null,
        is_active: formData.is_active,
      };

      const response = await axios.patch(
        `${API_BASE_URL}/users/${editUser.id}/`,
        payload,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      console.log("✅ Update user response:", response.data);
      if (onSave) onSave(response.data);
    } catch (err) {
      console.error(
        "❌ Cập nhật user thất bại:",
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  if (!editUser) return <p>⏳ Đang tải dữ liệu...</p>;

  return (
    <form onSubmit={handleSubmit}>
      {/* Chỉ hiển thị */}
      <div className="mb-2">
        <label className="form-label">Tên đăng nhập</label>
        <input
          type="text"
          value={editUser.username || ""}
          className="form-control"
          disabled
        />
      </div>
      <div className="mb-2">
        <label className="form-label">Email</label>
        <input
          type="email"
          value={editUser.email || ""}
          className="form-control"
          disabled
        />
      </div>

      {/* Editable fields */}
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

      {/* Role select */}
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
            <option key={r.id} value={String(r.id)}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      {/* Account status */}
      <div className="mb-2">
        <label className="form-label">Trạng thái</label>
        <input
          type="text"
          value={editUser.is_active ? "Đang hoạt động" : "Bị khóa"}
          className="form-control"
          disabled
        />
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
