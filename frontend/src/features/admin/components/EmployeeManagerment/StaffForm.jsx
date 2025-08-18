import React, { useState, useEffect } from "react";
import "../../styles/StaffForm.css"; // Import custom styles

const StaffForm = ({ show, onHide, onSave, selected }) => {
  const [form, setForm] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    if (selected) {
      setForm({ ...selected, password: "" });
    } else {
      setForm({
        username: "",
        password: "",
        full_name: "",
        email: "",
        phone: "",
        address: ""
      });
    }
  }, [selected]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Regex kiểm tra đầu vào
    if (name === "full_name" && !/^[a-zA-ZÀ-ỹ\s]*$/.test(value)) return;
    if (name === "phone" && !/^[0-9]*$/.test(value)) return;
    if (name === "address" && !/^[a-zA-ZÀ-ỹ0-9\s,.-]*$/.test(value)) return;

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!/^[a-zA-ZÀ-ỹ\s]*$/.test(form.full_name)) {
      alert("Họ tên không được chứa ký tự đặc biệt!");
      return;
    }
    if (!/^[0-9]*$/.test(form.phone)) {
      alert("Số điện thoại chỉ được nhập số!");
      return;
    }
    if (!/^[a-zA-ZÀ-ỹ0-9\s,.-]*$/.test(form.address)) {
      alert("Địa chỉ không hợp lệ!");
      return;
    }

    onSave(form);
    onHide();
  };

  if (!show) return null;

  return (
    <div className="pam-modal-overlay">
      <div className="pam-modal-content wide p-3">
        <form onSubmit={handleSubmit} className="pam-form">
          <h6 className="pam-title fw-bold">
            {selected ? "Sửa nhân viên" : "Thêm nhân viên"}
          </h6>

          <div className="pam-form-grid">
            {/* Cột trái */}
            <div>
              {!selected && (
                <>
                  <label className="pam-label">Tên tài khoản</label>
                  <input
                    className="pam-input"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                  />

                  <label className="pam-label">Mật khẩu</label>
                  <input
                    className="pam-input"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                  />
                </>
              )}

              <label className="pam-label">Họ tên</label>
              <input
                className="pam-input"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
              />

              <label className="pam-label">SĐT</label>
              <input
                className="pam-input"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                maxLength={10}
              />
            </div>

            {/* Cột phải */}
            <div>
              <label className="pam-label">Email</label>
              <input
                className="pam-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />

              <label className="pam-label">Địa chỉ</label>
              <input
                className="pam-input"
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="pam-actions">
            <button
              type="button"
              className="pam-btn pam-btn-secondary"
              onClick={onHide}
            >
              Hủy
            </button>
            <button type="submit" className="pam-btn pam-btn-primary">
              {selected ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffForm;
