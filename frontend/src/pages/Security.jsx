

import React, { useState } from "react";


export default function Security() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    setLoading(true);
    try {
      // Lấy token từ localStorage (giả sử bạn lưu access token ở đây)
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users/change-password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          old_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess("Đổi mật khẩu thành công!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || data.detail || "Đổi mật khẩu thất bại.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    }
    setLoading(false);
  };

  return (
    <div className="container py-4" style={{maxWidth: 500}}>
      <div className="card mb-4" style={{borderRadius: 6, border: '1px solid #eee'}}>
        <div className="card-body">
          <div className="mb-3" style={{fontWeight: 500, fontSize: 20}}>Đổi mật khẩu</div>
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-3">
              <label className="form-label">Mật khẩu hiện tại</label>
              <div className="input-group">
                <input
                  type={showCurrent ? "text" : "password"}
                  className="form-control"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Mật khẩu mới</label>
              <div className="input-group">
                <input
                  type={showNew ? "text" : "password"}
                  className="form-control"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Xác nhận mật khẩu mới</label>
              <div className="input-group">
                <input
                  type={showConfirm ? "text" : "password"}
                  className="form-control"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            {error && <div className="alert alert-danger py-2 mb-2">{error}</div>}
            {success && <div className="alert alert-success py-2 mb-2">{success}</div>}

            <div className="d-flex gap-3 justify-content-center mt-3">
              <button className="btn btn-outline-dark px-5" type="button" onClick={() => {
                setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setError(""); setSuccess("");
              }} disabled={loading}>CANCEL</button>
              <button className="btn btn-dark px-5" type="submit" disabled={loading}>
                {loading ? "Đang xử lý..." : "XÁC NHẬN"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
