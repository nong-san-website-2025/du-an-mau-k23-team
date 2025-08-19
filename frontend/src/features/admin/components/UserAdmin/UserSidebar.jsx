import React, { useState } from "react";

export default function UserSidebar({
  roles,
  selectedRole,
  setSelectedRole,
  onRoleCreated,
}) {
  const [showModal, setShowModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateClick = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleModalClose = () => {
    if (!loading) {
      setShowModal(false);
      setNewRoleName("");
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    if (!newRoleName.trim()) {
      alert("Vui lòng nhập tên vai trò");
      return;
    }

    try {
      setLoading(true);

      const roleData = {
        name: newRoleName.trim(),
      };

      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:8000/api/users/roles/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(roleData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      alert("Tạo vai trò mới thành công!");

      // Gọi lại hàm từ UsersPage để cập nhật UI ngay
      if (onRoleCreated) {
        onRoleCreated();
      }

      // Reset và đóng modal
      setNewRoleName("");
      setShowModal(false);
    } catch (error) {
      console.error("Error creating role:", error);
      alert(`Có lỗi xảy ra khi tạo vai trò mới: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-3 rounded shadow-sm border mb-3">
      <h5 className="fw-bold mb-4">Người dùng</h5>
      <div className="mb-3">
        <div className="d-flex align-items-center justify-content-between">
          <label className="form-label fw-bold" style={{ fontSize: "14px" }}>
            Vai trò
          </label>
          <a
            href="#"
            onClick={handleCreateClick}
            style={{
              textDecoration: "none",
              color: "#22C55E",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            
          </a>
        </div>
        <select
          className="form-select"
          value={String(selectedRole)}
          onChange={(e) => setSelectedRole(String(e.target.value))}
        >
          <option value="all">Tất cả vai trò</option>
          {roles.map((role) => (
            <option key={role.id} value={String(role.id)}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      {showModal && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: "block", background: "#0008" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <form onSubmit={handleModalSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">Tạo vai trò mới</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleModalClose}
                    disabled={loading}
                  ></button>
                </div>
                <div className="modal-body">
                  <label className="form-label" style={{ fontSize: "14px" }}>
                    Tên vai trò
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleModalClose}
                    disabled={loading}
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={loading}
                  >
                    {loading ? "Đang tạo..." : "Tạo mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
