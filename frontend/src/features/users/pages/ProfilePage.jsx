import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Button,
  Spinner,
  Row,
  Col,
  Image,
} from "react-bootstrap";
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaLock,
  FaBell,
  FaGift,
  FaStar,
  FaSeedling,
} from "react-icons/fa";
import API from "../../login_register/services/api";
import Rewards from "../../points/pages/Rewards";

// Use your header/footer color scheme
const mainColor = "#2E8B57"; // Example: header/footer green
const accentColor = "#F57C00"; // Example: header/footer orange
const sidebarBg = "#fff";
const sidebarActive = mainColor;
const sidebarInactive = "#eee";
const iconColor = mainColor;

function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    recipient_name: "",
    phone: "",
    location: "",
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    if (activeTab === "address") {
      API.get("/addresses/").then((res) => setAddresses(res.data));
    }
  }, [activeTab]);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await API.get("users/me/");
        setUser(res.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user) setForm(user);
  }, [user]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar" && files && files[0]) {
      setForm((prev) => ({ ...prev, avatar: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addAddress = async () => {
    try {
      await API.post("users/addresses/", newAddress);
      const res = await API.get("users/addresses/");
      setAddresses(res.data);
      setShowAddressForm(false);
      setNewAddress({ recipient_name: "", phone: "", location: "" });
    } catch (err) {
      console.error("Lỗi thêm địa chỉ:", err);
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      await API.patch(`users/addresses/${id}/set_default/`);
      const res = await API.get("/addresses/");
      setAddresses(res.data);
    } catch (err) {
      console.error("Lỗi đặt địa chỉ mặc định:", err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("full_name", form.full_name || "");
      formData.append("email", form.email || "");
      formData.append("phone", form.phone || "");
      formData.append("address", form.address || "");
      if (form.avatar instanceof File) {
        formData.append("avatar", form.avatar);
      }
      const res = await API.put("users/me/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditMode(false);
      setUser(res.data);
    } catch (err) {
      setError("Cập nhật thất bại. Vui lòng thử lại!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" style={{ color: mainColor }} />
        <div className="mt-3" style={{ color: mainColor, fontWeight: 600 }}>
          Đang tải thông tin cá nhân...
        </div>
      </Container>
    );
  }

  if (!user || !form) {
    return (
      <Container className="py-5 text-center">
        <h2 className="mb-2 fw-bold" style={{ color: mainColor }}>
          Không tìm thấy thông tin người dùng
        </h2>
        <Button
          href="/"
          style={{
            background: mainColor,
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
          }}
        >
          Về trang chủ
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-0">
      <Row>
        {/* Sidebar menu - 2/10 */}
        <Col md={3}>
          <Card
            className="shadow border-0 p-3 mb-4"
            style={{ background: sidebarBg }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                marginBottom: 18,
                color: mainColor,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FaUser color={iconColor} size={22} style={{ marginRight: 4 }} /> Tài khoản của tôi
            </div>
            <div style={{ marginBottom: 18 }}>
              <Button
                className="w-100 mb-2"
                style={{
                  fontWeight: 700,
                  borderRadius: 8,
                  background: activeTab === "profile" ? sidebarActive : sidebarInactive,
                  color: activeTab === "profile" ? "#fff" : mainColor,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onClick={() => setActiveTab("profile")}
              >
                <FaUser style={{ marginRight: 6 }} /> Hồ Sơ
              </Button>
              <Button
                className="w-100 mb-2"
                style={{
                  fontWeight: 700,
                  borderRadius: 8,
                  background: activeTab === "address" ? sidebarActive : sidebarInactive,
                  color: activeTab === "address" ? "#fff" : mainColor,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onClick={() => setActiveTab("address")}
              >
                <FaMapMarkerAlt style={{ marginRight: 6 }} /> Địa Chỉ
              </Button>
              <Button
                className="w-100 mb-2"
                style={{
                  fontWeight: 700,
                  borderRadius: 8,
                  background: activeTab === "password" ? sidebarActive : sidebarInactive,
                  color: activeTab === "password" ? "#fff" : mainColor,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onClick={() => setActiveTab("password")}
              >
                <FaLock style={{ marginRight: 6 }} /> Đổi Mật Khẩu
              </Button>
              <Button
                className="w-100 mb-2"
                style={{
                  fontWeight: 700,
                  borderRadius: 8,
                  background: activeTab === "notification" ? sidebarActive : sidebarInactive,
                  color: activeTab === "notification" ? "#fff" : mainColor,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onClick={() => setActiveTab("notification")}
              >
                <FaBell style={{ marginRight: 6 }} /> Cài Đặt Thông Báo
              </Button>
              <Button
                className="w-100 mb-2"
                style={{
                  fontWeight: 700,
                  borderRadius: 8,
                  background: activeTab === "voucher" ? accentColor : sidebarInactive,
                  color: activeTab === "voucher" ? "#fff" : accentColor,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onClick={() => setActiveTab("voucher")}
              >
                <FaGift style={{ marginRight: 6 }} /> Kho Voucher
              </Button>
              <Button
                className="w-100 mb-2"
                style={{
                  fontWeight: 700,
                  borderRadius: 8,
                  background: activeTab === "point" ? "#FFD700" : sidebarInactive,
                  color: activeTab === "point" ? "#fff" : "#FFD700",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onClick={() => setActiveTab("point")}
              >
                <FaStar style={{ marginRight: 6 }} /> Điểm Thưởng
              </Button>
              <Button
                className="w-100 mb-2"
                style={{
                  fontWeight: 700,
                  borderRadius: 8,
                  background: activeTab === "special" ? "#D32F2F" : sidebarInactive,
                  color: activeTab === "special" ? "#fff" : "#D32F2F",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onClick={() => setActiveTab("special")}
              >
                <FaSeedling style={{ marginRight: 6 }} /> Ưu Đãi Đặc Biệt
              </Button>
            </div>
          </Card>
        </Col>
        {/* Main profile content - 8/10 */}
        <Col md={9}>
          <Card
            className="shadow border-0 p-4 mb-4"
            style={{ background: "#fff" }}
          >
            {/* Tab content */}
            {activeTab === "profile" && (
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
            )}
            {activeTab === "address" && (
              <>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 22,
                    marginBottom: 18,
                    color: mainColor,
                  }}
                >
                  Địa Chỉ Của Tôi
                </div>
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="mb-3 p-3 border rounded"
                    style={{
                      background: addr.is_default ? "#e0ffe0" : "#f9f9f9",
                      border: addr.is_default ? `2px solid ${mainColor}` : "1px solid #eee",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: mainColor }}>
                      <FaUser style={{ marginRight: 6 }} /> {addr.recipient_name} - {addr.phone}
                    </div>
                    <div style={{ color: "#555" }}>{addr.location}</div>
                    <div>
                      {!addr.is_default && (
                        <Button
                          size="sm"
                          style={{
                            background: mainColor,
                            color: "#fff",
                            borderRadius: 8,
                            fontWeight: 700,
                            border: "none",
                            marginTop: 6,
                          }}
                          onClick={() => setDefaultAddress(addr.id)}
                        >
                          Chọn làm mặc định
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  style={{
                    background: accentColor,
                    color: "#fff",
                    borderRadius: 8,
                    fontWeight: 700,
                    border: "none",
                    marginTop: 8,
                  }}
                  onClick={() => setShowAddressForm(!showAddressForm)}
                >
                  {showAddressForm ? "Huỷ" : "Thêm địa chỉ mới"}
                </Button>
                {showAddressForm && (
                  <div className="mt-3">
                    <input
                      className="form-control mb-2"
                      placeholder="Họ tên người nhận"
                      value={newAddress.recipient_name}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          recipient_name: e.target.value,
                        })
                      }
                      style={{ border: `1px solid ${mainColor}`, borderRadius: 8, padding: 8 }}
                    />
                    <input
                      className="form-control mb-2"
                      placeholder="Số điện thoại"
                      value={newAddress.phone}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, phone: e.target.value })
                      }
                      style={{ border: `1px solid ${mainColor}`, borderRadius: 8, padding: 8 }}
                    />
                    <textarea
                      className="form-control mb-2"
                      placeholder="Địa chỉ"
                      value={newAddress.location}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          location: e.target.value,
                        })
                      }
                      style={{ border: `1px solid ${mainColor}`, borderRadius: 8, padding: 8 }}
                    />
                    <Button
                      style={{
                        background: mainColor,
                        color: "#fff",
                        borderRadius: 8,
                        fontWeight: 700,
                        border: "none",
                        marginTop: 4,
                      }}
                      onClick={addAddress}
                    >
                      Lưu địa chỉ
                    </Button>
                  </div>
                )}
              </>
            )}

            {activeTab === "password" && (
              <div style={{ fontSize: 16, marginBottom: 10, color: mainColor }}>
                Chức năng đổi mật khẩu sẽ được bổ sung.
              </div>
            )}
            {activeTab === "notification" && (
              <div style={{ fontSize: 16, marginBottom: 10, color: mainColor }}>
                Chức năng cài đặt thông báo sẽ được bổ sung.
              </div>
            )}
            {activeTab === "voucher" && (
              <div style={{ fontSize: 16, marginBottom: 10, color: accentColor }}>
                Chức năng voucher sẽ được bổ sung.
              </div>
            )}
            {activeTab === "point" && (
              <div style={{ fontSize: 16, marginBottom: 10, color: "#FFD700" }}>
                <Rewards />
              </div>
            )}
            {activeTab === "special" && (
              <div style={{ fontSize: 16, marginBottom: 10, color: "#D32F2F" }}>
                Chức năng ưu đãi đặc biệt sẽ được bổ sung.
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ProfilePage;
