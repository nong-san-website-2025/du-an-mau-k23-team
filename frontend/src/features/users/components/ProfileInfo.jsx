import React, { useEffect, useMemo, useRef } from "react";
import {
  Grid,
  Typography,
  Avatar,
  Button,
  TextField,
  Badge,
  Box,
  Paper,
} from "@mui/material";
import { FaUser } from "react-icons/fa";

const ProfileInfo = ({
  form,
  editMode,
  setEditMode,
  handleChange,
  handleSave,
  saving,
  error,
  user,
  setForm,
  addresses = [],
}) => {
  const objectUrlRef = useRef(null);

  const avatarSrc = useMemo(() => {
    if (form?.avatar instanceof File) {
      const url = URL.createObjectURL(form.avatar);
      objectUrlRef.current = url;
      return url;
    }
    return form?.avatar || "/default-avatar.png";
  }, [form?.avatar]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [avatarSrc]);

  const defaultAddress = useMemo(
    () => addresses.find((addr) => addr.is_default)?.location || "---",
    [addresses]
  );

  return (
    <div className="card p-3 mt-3">
      <h5 className="mb-3 text-success d-flex align-items-center">
        <FaUser className="me-2" /> Hồ Sơ Của Tôi
      </h5>

      <div className="row" style={{ minHeight: "300px" }}>
        {/* Left 3/5 */}
        <div className="col-12 col-md-7">
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label">Tên đăng nhập</label>
              <input
                type="text"
                className="form-control"
                value={form?.username || ""}
                disabled
              />
            </div>
            <div className="col-6">
              <label className="form-label">Họ tên</label>
              <input
                type="text"
                className="form-control"
                value={form?.full_name || ""}
                name="full_name"
                onChange={handleChange}
                disabled={!editMode}
              />
            </div>
            <div className="col-6">
              <label className="form-label">Email</label>
              <input
                type="text"
                className="form-control"
                value={form?.email || ""}
                name="email"
                onChange={handleChange}
                disabled={!editMode}
              />
            </div>
            <div className="col-6">
              <label className="form-label">Ngày tạo</label>
              <input
                type="text"
                className="form-control"
                value={
                  form?.created_at
                    ? new Date(form.created_at).toLocaleDateString("vi-VN")
                    : "---"
                }
                disabled
              />
            </div>
            <div className="col-6">
              <label className="form-label">Số điện thoại</label>
              <input
                type="text"
                className="form-control"
                value={form?.phone || ""}
                name="phone"
                onChange={handleChange}
                disabled={!editMode}
              />
            </div>
          </div>
        </div>

        {/* Right 2/5 */}
        <div className="col-12 col-md-5 d-flex flex-column justify-content-start align-items-center">
          <div className="position-relative">
            <img
              src={avatarSrc}
              alt="avatar"
              className="rounded-circle"
              style={{
                width: 100,
                height: 100,
                border: "2px solid #2E8B57",
                objectFit: "cover",
              }}
            />
            {editMode && (
              <label
                className="btn btn-sm btn-warning position-absolute bottom-0 start-50 translate-middle-x"
                style={{ fontSize: 12 }}
              >
                Chọn ảnh
                <input
                  type="file"
                  hidden
                  onChange={handleChange}
                  name="avatar"
                  accept="image/*"
                />
              </label>
            )}
          </div>
          <h6 className="fw-bold mb-1">{form?.full_name || "---"}</h6>
          <p className="mb-2">{form?.email || "---"}</p>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-success btn-sm"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("openFollowingModal"))
              }
            >
              Đang theo dõi{" "}
              <span className="badge bg-success">
                {form?.followingCount ?? 0}
              </span>
            </button>
            <button
              type="button"
              className="btn btn-outline-warning btn-sm"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("openFollowersModal"))
              }
            >
              Người theo dõi{" "}
              <span className="badge bg-warning">
                {form?.followersCount ?? 0}
              </span>
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      <div className="mt-3 d-flex flex-wrap gap-2">
        {editMode ? (
          <>
            <button
              className="btn btn-success"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button
              className="btn btn-outline-success"
              onClick={() => {
                setEditMode(false);
                setForm(user);
              }}
            >
              Hủy
            </button>
          </>
        ) : (
          <button className="btn btn-success" onClick={() => setEditMode(true)}>
            Chỉnh sửa thông tin
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileInfo;
