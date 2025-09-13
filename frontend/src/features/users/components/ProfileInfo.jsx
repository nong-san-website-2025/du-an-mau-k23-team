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
      <div style={{
        fontWeight: 800,
        fontSize: 18,
        marginBottom: 12,
        color: palette.green,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }} aria-label="Tiêu đề hồ sơ">
        <FaUser color={iconColor} size={20} style={{ marginRight: 4 }} /> Hồ Sơ Của Tôi
      </div>
      <div className="row mb-4" style={{ background: `linear-gradient(180deg, ${palette.sand} 0%, ${palette.white} 100%)`, border: `1px solid ${palette.border}`, borderRadius: 14, padding: 12, fontSize: 14 }}>
        {/* Left: Họ tên, Số điện thoại, Ngày tạo tài khoản */}
        <div className="col-12 col-md-4 d-flex flex-column justify-content-center mb-3 mb-md-0">
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaUser color={iconColor} size={16} />
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: 11, color: palette.subtleText }}>Họ tên</div>
              {editMode ? (
                <input className="form-control" name="full_name" value={form?.full_name || ""} onChange={handleChange} placeholder="Nhập họ tên" style={{ borderColor: palette.green, borderRadius: 10, fontSize: 13, fontWeight: 400 }} />
              ) : (
                <div style={{ fontSize: 13, fontWeight: 400, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "6px 10px", background: palette.white }}>{form?.full_name || "---"}</div>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaPhone color={iconColor} size={16} />
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: 11, color: palette.subtleText }}>Số điện thoại</div>
              {editMode ? (
                <input className="form-control" name="phone" value={form?.phone || ""} onChange={handleChange} placeholder="Nhập số điện thoại" style={{ borderColor: palette.green, borderRadius: 10, fontSize: 13, fontWeight: 400 }} />
              ) : (
                <div style={{ fontSize: 13, fontWeight: 400, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "6px 10px", background: palette.white }}>{form?.phone || "---"}</div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaSeedling color={iconColor} size={16} />
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: 11, color: palette.subtleText }}>Ngày tạo tài khoản</div>
              <div style={{ fontSize: 13, fontWeight: 400, color: palette.text }}>
                {form?.created_at ? new Date(form.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "---"}
              </div>
            </div>
          </div>
        </div>
        {/* Center: Tên đăng nhập, Email, Địa chỉ mặc định */}
        <div className="col-12 col-md-4 d-flex flex-column justify-content-center mb-3 mb-md-0">
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaUser color={iconColor} size={16} />
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: 11, color: palette.subtleText }}>Tên đăng nhập</div>
              {editMode ? (
                <input className="form-control" name="username" value={form?.username || ""} onChange={handleChange} placeholder="Nhập tên đăng nhập" style={{ borderColor: palette.green, borderRadius: 10, fontSize: 13, fontWeight: 400 }} />
              ) : (
                <div style={{ fontSize: 13, fontWeight: 400, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "6px 10px", background: palette.white }}>{form?.username}</div>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaEnvelope color={iconColor} size={16} />
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: 11, color: palette.subtleText }}>Email</div>
              {editMode ? (
                <input className="form-control" name="email" value={form?.email || ""} onChange={handleChange} placeholder="email@domain.com" style={{ borderColor: palette.green, borderRadius: 10, fontSize: 13, fontWeight: 400 }} />
              ) : (
                <div style={{ fontSize: 13, fontWeight: 400, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "6px 10px", background: palette.white }}>{form?.email}</div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaMapMarkerAlt color={iconColor} size={16} />
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: 11, color: palette.subtleText }}>Địa chỉ mặc định</div>
              <div style={{ fontSize: 13, fontWeight: 400, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "6px 10px", background: palette.white }}>{defaultAddress}</div>
            </div>
          </div>
        </div>
        {/* Right: Avatar, Thánh boom hàng, 112@gmail.com, file info */}
        <div className="col-12 col-md-4 d-flex flex-column align-items-center justify-content-center">
          <div style={{ position: "relative", marginBottom: 8 }}>
            <Image
              src={avatarSrc}
              alt="Ảnh đại diện"
              roundedCircle
              width={100}
              height={100}
              style={{ objectFit: "cover", border: `2px solid ${palette.green}`, background: "#f5f5f5", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            />
            {editMode && (
              <label htmlFor="avatar-upload" style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", background: palette.orange, color: "#fff", padding: "2px 10px", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", whiteSpace: "nowrap" }}>
                Chọn Ảnh
                <input id="avatar-upload" type="file" name="avatar" accept="image/*" onChange={handleChange} style={{ display: "none" }} />
              </label>
            )}
          </div>
          <div style={{ fontWeight: 700, color: palette.green, fontSize: 15, marginBottom: 2 }}>{form?.full_name || "---"}</div>
          <div style={{ fontSize: 13, color: palette.text, marginBottom: 2 }}>{form?.email || "---"}</div>
          <div style={{ fontSize: 11, color: palette.subtleText }}>Tập tin PNG/JPG, kích thước &le; 2MB</div>
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
        </div>
      </div>
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
    </section>
  );
}

export default ProfileInfo;