import React from "react";
import { Button, Image } from "react-bootstrap";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaSeedling } from "react-icons/fa";

const mainColor = "#2E8B57";
const accentColor = "#F57C00";
const iconColor = mainColor;

const ProfileInfo = ({ form, editMode, setEditMode, handleChange, handleSave, saving, error, user, setForm, addresses }) => (
  <>
    <div
      style={{
        fontWeight: 700,
        fontSize: 22,
        marginBottom: 18,
        color: mainColor,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <FaUser color={iconColor} size={24} style={{ marginRight: 4 }} /> Hồ Sơ Của Tôi
    </div>
    <div className="d-flex align-items-center mb-4">
      <div style={{ position: "relative", marginRight: 32 }}>
        <Image
          src={form.avatar || "/default-avatar.png"}
          roundedCircle
          width={120}
          height={120}
          style={{
            objectFit: "cover",
            border: `3px solid ${mainColor}`,
            background: "#f5f5f5",
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
              background: accentColor,
              color: "#fff",
              padding: "4px 12px",
              borderRadius: 16,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
      <div>
        <h3
          style={{
            color: mainColor,
            fontWeight: 800,
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {form.full_name || form.username}
        </h3>
        <span
          style={{
            color: "#888",
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FaEnvelope color={iconColor} size={15} style={{ marginRight: 2 }} /> {form.email}
        </span>
      </div>
    </div>
    <form onSubmit={handleSave}>
      <div style={{ fontSize: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <FaUser color={iconColor} size={16} style={{ marginRight: 2 }} /> <b>Tên đăng nhập:</b> {form.username}
      </div>
      <div style={{ fontSize: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <FaUser color={iconColor} size={16} style={{ marginRight: 2 }} /> <b>Họ tên:</b>{" "}
        {editMode ? (
          <input
            name="full_name"
            value={form.full_name || ""}
            onChange={handleChange}
            style={{
              marginLeft: 8,
              padding: 6,
              border: `1px solid ${mainColor}`,
              borderRadius: 8,
              minWidth: 200,
            }}
          />
        ) : (
          form.full_name || "---"
        )}
      </div>
      <div style={{ fontSize: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <FaEnvelope color={iconColor} size={16} style={{ marginRight: 2 }} /> <b>Email:</b>{" "}
        {editMode ? (
          <input
            name="email"
            value={form.email || ""}
            onChange={handleChange}
            style={{
              marginLeft: 8,
              padding: 6,
              border: `1px solid ${mainColor}`,
              borderRadius: 8,
              minWidth: 200,
            }}
          />
        ) : (
          form.email
        )}
      </div>
      <div style={{ fontSize: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <FaPhone color={iconColor} size={16} style={{ marginRight: 2 }} /> <b>Số điện thoại:</b>{" "}
        {editMode ? (
          <input
            name="phone"
            value={form.phone || ""}
            onChange={handleChange}
            style={{
              marginLeft: 8,
              padding: 6,
              border: `1px solid ${mainColor}`,
              borderRadius: 8,
              minWidth: 200,
            }}
          />
        ) : (
          form.phone || "---"
        )}
      </div>
      <div style={{ fontSize: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <FaMapMarkerAlt color={iconColor} size={16} style={{ marginRight: 2 }} /> <b>Địa chỉ mặc định:</b>{" "}
        {addresses.find((addr) => addr.is_default)?.location || "---"}

      </div>
      <div style={{ fontSize: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <FaSeedling color={iconColor} size={16} style={{ marginRight: 2 }} /> <b>Ngày tạo tài khoản:</b>{" "}
        {form.created_at ? new Date(form.created_at).toLocaleDateString() : "---"}
      </div>
      {error && (
        <div style={{ color: "red", marginBottom: 10 }}>{error}</div>
      )}
      {editMode ? (
        <>
          <Button
            type="submit"
            disabled={saving}
            style={{
              fontWeight: 700,
              minWidth: 140,
              borderRadius: 8,
              background: mainColor,
              color: "#fff",
              border: "none",
            }}
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
          <Button
            style={{
              marginLeft: 12,
              fontWeight: 700,
              borderRadius: 8,
              background: "#eee",
              color: mainColor,
              border: `1px solid ${mainColor}`,
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
            marginTop: 18,
            fontWeight: 700,
            borderRadius: 8,
            background: mainColor,
            color: "#fff",
            border: "none",
          }}
          onClick={() => setEditMode(true)}
        >
          Chỉnh sửa thông tin
        </Button>
      )}
    </form>
  </>
);

export default ProfileInfo;
