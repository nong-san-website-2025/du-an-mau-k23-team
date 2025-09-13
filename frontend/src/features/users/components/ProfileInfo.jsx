import React, { useEffect, useMemo, useRef } from "react";
import { Button, Image } from "react-bootstrap";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaSeedling } from "react-icons/fa";

// Nature/agri-inspired palette
const palette = {
  green: "#2E8B57", // primary
  orange: "#F57C00", // accent
  brown: "#6D4C41", // earthy
  sand: "#FAFAF0", // soft background
  white: "#FFFFFF",
  border: "#E5E7EB",
  text: "#2D2D2D",
  subtleText: "#6B7280",
};

const iconColor = palette.green;

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
  // Generate preview URL if avatar is a File
  const objectUrlRef = useRef(null);
  const avatarSrc = useMemo(() => {
    if (form?.avatar instanceof File) {
      const url = URL.createObjectURL(form.avatar);
      objectUrlRef.current = url;
      return url;
    }
    return form?.avatar || "/default-avatar.png";
  }, [form?.avatar]);

  // Cleanup File preview URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [avatarSrc]);

  const defaultAddress = useMemo(
    () => addresses.find((addr) => addr.is_default)?.location || "---",
    [addresses]
  );

  return (
    <section className="profile-info">
      {/* Header */}
      <div
        style={{
          fontWeight: 800,
          fontSize: 22,
          marginBottom: 18,
          color: palette.green,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
        aria-label="Tiêu đề hồ sơ"
      >
        <FaUser color={iconColor} size={24} style={{ marginRight: 4 }} /> Hồ Sơ Của Tôi
      </div>

      {/* Top identity section */}
      <div
        className="d-flex align-items-center mb-4 flex-wrap"
        style={{
          background: `linear-gradient(180deg, ${palette.sand} 0%, ${palette.white} 100%)`,
          border: `1px solid ${palette.border}`,
          borderRadius: 14,
          padding: 16,
          gap: 16,
        }}
      >
        <div style={{ position: "relative" }}>
          <Image
            src={avatarSrc}
            alt="Ảnh đại diện"
            roundedCircle
            width={120}
            height={120}
            style={{
              objectFit: "cover",
              border: `3px solid ${palette.green}`,
              background: "#f5f5f5",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
          />
          {editMode && (
            <label
              htmlFor="avatar-upload"
              style={{
                position: "absolute",
                bottom: -10,
                left: "50%",
                transform: "translateX(-50%)",
                background: palette.orange,
                color: "#fff",
                padding: "4px 12px",
                borderRadius: 16,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                whiteSpace: "nowrap",
              }}
            >
              Chọn Ảnh
              <input
                id="avatar-upload"
                type="file"
                name="avatar"
                accept="image/*"
                onChange={handleChange}
                style={{ display: "none" }}
              />
            </label>
          )}
        </div>

        <div style={{ minWidth: 220 }}>
          <h3
            style={{
              color: palette.green,
              fontWeight: 800,
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {form?.full_name || form?.username}
          </h3>
          {/* Follow stats under name: clickable + styled */}
          {(typeof form?.followingCount !== 'undefined' || typeof form?.followersCount !== 'undefined') && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => window.dispatchEvent(new CustomEvent('openFollowingModal'))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#F0FAF5',
                  color: palette.green,
                  border: `1px solid ${palette.green}22`,
                  borderRadius: 999,
                  padding: '6px 12px',
                  fontWeight: 700,
                }}
              >
                <span className="badge rounded-pill" style={{ background: palette.green, color: '#fff', fontWeight: 800 }}>
                  {form?.followingCount ?? 0}
                </span>
                Đang theo dõi
              </button>

              <button
                type="button"
                className="btn btn-sm"
                onClick={() => window.dispatchEvent(new CustomEvent('openFollowersModal'))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#FFF7F0',
                  color: palette.orange,
                  border: `1px solid ${palette.orange}22`,
                  borderRadius: 999,
                  padding: '6px 12px',
                  fontWeight: 700,
                }}
              >
                <span className="badge rounded-pill" style={{ background: palette.orange, color: '#fff', fontWeight: 800 }}>
                  {form?.followersCount ?? 0}
                </span>
                Người theo dõi
              </button>
            </div>
          )}
          <div
            style={{
              color: palette.subtleText,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FaEnvelope color={iconColor} size={15} style={{ marginRight: 2 }} />
            {form?.email}
          </div>
          <div style={{ fontSize: 12, color: palette.subtleText, marginTop: 6 }}>
            Tập tin PNG/JPG, kích thước &le; 2MB
          </div>
        </div>
      </div>

      {/* Details form */}
      <form
        onSubmit={handleSave}
        onKeyDown={(e) => {
          // Prevent accidental form submit when pressing Enter in inputs
          if (e.key === "Enter") e.preventDefault();
        }}
      >
        <div
          className="row g-3"
          style={{
            margin: 0,
          }}
        >
          {/* Username */}
          <div className="col-12 col-md-6">
            <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
              <FaUser color={iconColor} size={16} />
              <div style={{ width: "100%" }}>
                <div style={{ fontSize: 12, color: palette.subtleText }}>Tên đăng nhập</div>
                {editMode ? (
                  <input
                    className="form-control"
                    name="username"
                    value={form?.username || ""}
                    onChange={handleChange}
                    placeholder="Nhập tên đăng nhập"
                    style={{ borderColor: palette.green, borderRadius: 10 }}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: palette.text,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 10,
                      padding: "8px 12px",
                      background: palette.white,
                    }}
                  >
                    {form?.username}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full name */}
          <div className="col-12 col-md-6">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FaUser color={iconColor} size={16} />
              <div style={{ width: "100%" }}>
                <div style={{ fontSize: 12, color: palette.subtleText }}>Họ tên</div>
                {editMode ? (
                  <input
                    className="form-control"
                    name="full_name"
                    value={form?.full_name || ""}
                    onChange={handleChange}
                    placeholder="Nhập họ tên"
                    style={{
                      borderColor: palette.green,
                      borderRadius: 10,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: palette.text,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 10,
                      padding: "8px 12px",
                      background: palette.white,
                    }}
                  >
                    {form?.full_name || "---"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="col-12 col-md-6">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FaEnvelope color={iconColor} size={16} />
              <div style={{ width: "100%" }}>
                <div style={{ fontSize: 12, color: palette.subtleText }}>Email</div>
                {editMode ? (
                  <input
                    className="form-control"
                    name="email"
                    value={form?.email || ""}
                    onChange={handleChange}
                    placeholder="email@domain.com"
                    style={{ borderColor: palette.green, borderRadius: 10 }}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: palette.text,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 10,
                      padding: "8px 12px",
                      background: palette.white,
                    }}
                  >
                    {form?.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="col-12 col-md-6">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FaPhone color={iconColor} size={16} />
              <div style={{ width: "100%" }}>
                <div style={{ fontSize: 12, color: palette.subtleText }}>Số điện thoại</div>
                {editMode ? (
                  <input
                    className="form-control"
                    name="phone"
                    value={form?.phone || ""}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    style={{ borderColor: palette.green, borderRadius: 10 }}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: palette.text,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 10,
                      padding: "8px 12px",
                      background: palette.white,
                    }}
                  >
                    {form?.phone || "---"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Default Address */}
          <div className="col-12">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FaMapMarkerAlt color={iconColor} size={16} />
              <div style={{ width: "100%" }}>
                <div style={{ fontSize: 12, color: palette.subtleText }}>Địa chỉ mặc định</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: palette.text,
                    border: `1px solid ${palette.border}`,
                    borderRadius: 10,
                    padding: "8px 12px",
                    background: palette.white,
                  }}
                >
                  {defaultAddress}
                </div>
              </div>
            </div>
          </div>

          {/* Created At */}
          <div className="col-12 col-md-6">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FaSeedling color={iconColor} size={16} />
              <div>
                <div style={{ fontSize: 12, color: palette.subtleText }}>Ngày tạo tài khoản</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: palette.text }}>
                  {form?.created_at ? new Date(form.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "---"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            style={{
              color: "#B00020",
              background: "#FDECEC",
              border: "1px solid #F5C2C7",
              padding: "10px 12px",
              borderRadius: 10,
              marginTop: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="d-flex flex-wrap gap-2" style={{ marginTop: 16 }}>
          {editMode ? (
            <>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  fontWeight: 700,
                  minWidth: 160,
                  borderRadius: 10,
                  background: palette.green,
                  color: "#fff",
                  border: "none",
                }}
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button
                variant="light"
                style={{
                  fontWeight: 700,
                  minWidth: 120,
                  borderRadius: 10,
                  background: palette.white,
                  color: palette.green,
                  border: `1px solid ${palette.green}`,
                }}
                onClick={() => {
                  setEditMode(false);
                  setForm(user);
                }}
              >
                Hủy
              </Button>
            </>
          ) : (
            <Button
              style={{
                marginTop: 4,
                fontWeight: 700,
                borderRadius: 10,
                background: palette.green,
                color: "#fff",
                border: "none",
              }}
              onClick={() => setEditMode(true)}
            >
              Chỉnh sửa thông tin
            </Button>
          )}
        </div>
      </form>
    </section>
  );
};

export default ProfileInfo;