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
  FaTractor,
  FaSeedling,
} from "react-icons/fa";
import API from "../../login_register/services/api";

const green = "#22C55E";
const darkGreen = "#1B5E20";
const iconColor = "#1B5E20";

function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Removed unused navigate

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
        <Spinner animation="border" style={{ color: green }} />
        <div className="mt-3" style={{ color: green, fontWeight: 600 }}>
          Đang tải thông tin cá nhân...
        </div>
      </Container>
    );
  }

  if (!user || !form) {
    return (
      <Container className="py-5 text-center">
        <h2 className="mb-2 fw-bold" style={{ color: green }}>
          Không tìm thấy thông tin người dùng
        </h2>
        <Button
          href="/"
          style={{
            background: green,
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
        <Col md={2}>
          <Card
            className="shadow border-0 p-3 mb-4"
            style={{ background: "#fff" }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                marginBottom: 18,
                color: darkGreen,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FaTractor
                color={iconColor}
                size={22}
                style={{ marginRight: 4 }}
              />{" "}
              Tài khoản
            </div>
            <div style={{ marginBottom: 18 }}>
              <Button
                variant={
                  activeTab === "profile" ? "success" : "outline-success"
                }
                className="w-100 mb-2"
                style={{ fontWeight: 700, borderRadius: 0 }}
                onClick={() => setActiveTab("profile")}
              >
                {" "}
                <FaUser style={{ marginRight: 6 }} /> Hồ sơ
              </Button>
              <Button
                variant={
                  activeTab === "address" ? "success" : "outline-success"
                }
                className="w-100 mb-2"
                style={{ fontWeight: 700, borderRadius: 0 }}
                onClick={() => setActiveTab("address")}
              >
                {" "}
                <FaMapMarkerAlt style={{ marginRight: 6 }} /> Địa chỉ
              </Button>
              <Button
                variant={
                  activeTab === "password" ? "success" : "outline-success"
                }
                className="w-100 mb-2"
                style={{ fontWeight: 700, borderRadius: 0 }}
                onClick={() => setActiveTab("password")}
              >
                🔒 Đổi mật khẩu
              </Button>
              <Button
                variant={
                  activeTab === "notification" ? "success" : "outline-success"
                }
                className="w-100 mb-2 p-0"
                style={{ fontWeight: 700, borderRadius: 0 }}
                onClick={() => setActiveTab("notification")}
              >
                🔔 Cài đặt thông báo
              </Button>
            </div>
            <Button
              variant={activeTab === "voucher" ? "warning" : "outline-warning"}
              className="w-100 mb-2"
              style={{
                fontWeight: 700,
                borderRadius: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onClick={() => setActiveTab("voucher")}
            >
              {" "}
              <FaSeedling
                color={iconColor}
                size={20}
                style={{ marginRight: 4 }}
              />{" "}
              Kho voucher
            </Button>
            <Button
              variant={activeTab === "point" ? "info" : "outline-info"}
              className="w-100 mb-2"
              style={{
                fontWeight: 700,
                borderRadius: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onClick={() => setActiveTab("point")}
            >
              {" "}
              ⭐ Điểm thưởng
            </Button>
            <Button
              variant={activeTab === "special" ? "danger" : "outline-danger"}
              className="w-100 mb-2"
              style={{
                fontWeight: 700,
                borderRadius: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onClick={() => setActiveTab("special")}
            >
              {" "}
              � Ưu đãi đặc biệt
            </Button>
          </Card>
        </Col>
        {/* Main profile content - 8/10 */}
        <Col md={10}>
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
                    fontSize: 19,
                    marginBottom: 18,
                    color: darkGreen,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FaUser
                    color={iconColor}
                    size={22}
                    style={{ marginRight: 4 }}
                  />{" "}
                  Thông tin cá nhân
                </div>
                <div className="d-flex align-items-center mb-4">
                  <Image
                    src={form.avatar || "/default-avatar.png"}
                    roundedCircle
                    width={110}
                    height={110}
                    style={{
                      objectFit: "cover",
                      marginRight: 24,
                      border: "2px solid #eee",
                    }}
                  />
                  <div>
                    <h3
                      style={{
                        color: darkGreen,
                        fontWeight: 800,
                        marginBottom: 4,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <FaTractor
                        color={iconColor}
                        size={20}
                        style={{ marginRight: 4 }}
                      />{" "}
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
                      <FaEnvelope
                        color={iconColor}
                        size={15}
                        style={{ marginRight: 2 }}
                      />{" "}
                      {form.email}
                    </span>
                  </div>
                </div>
                <form onSubmit={handleSave}>
                  <div
                    style={{
                      fontSize: 16,
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <FaUser
                      color={iconColor}
                      size={16}
                      style={{ marginRight: 2 }}
                    />{" "}
                    <b>Tên đăng nhập:</b> {form.username}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <FaUser
                      color={iconColor}
                      size={16}
                      style={{ marginRight: 2 }}
                    />{" "}
                    <b>Họ tên:</b>{" "}
                    {editMode ? (
                      <input
                        name="full_name"
                        value={form.full_name || ""}
                        onChange={handleChange}
                        style={{
                          marginLeft: 8,
                          padding: 4,
                          border: "1px solid #eee",
                          minWidth: 180,
                        }}
                      />
                    ) : (
                      form.full_name || "---"
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <FaUser
                      color={iconColor}
                      size={16}
                      style={{ marginRight: 2 }}
                    />{" "}
                    <b>Ảnh đại diện:</b>{" "}
                    {editMode ? (
                      <input
                        type="file"
                        name="avatar"
                        accept="image/*"
                        onChange={handleChange}
                        style={{ marginLeft: 8 }}
                      />
                    ) : null}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <FaEnvelope
                      color={iconColor}
                      size={16}
                      style={{ marginRight: 2 }}
                    />{" "}
                    <b>Email:</b>{" "}
                    {editMode ? (
                      <input
                        name="email"
                        value={form.email || ""}
                        onChange={handleChange}
                        style={{
                          marginLeft: 8,
                          padding: 4,
                          border: "1px solid #eee",
                          minWidth: 180,
                        }}
                      />
                    ) : (
                      form.email
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <FaPhone
                      color={iconColor}
                      size={16}
                      style={{ marginRight: 2 }}
                    />{" "}
                    <b>Số điện thoại:</b>{" "}
                    {editMode ? (
                      <input
                        name="phone"
                        value={form.phone || ""}
                        onChange={handleChange}
                        style={{
                          marginLeft: 8,
                          padding: 4,
                          border: "1px solid #eee",
                          minWidth: 180,
                        }}
                      />
                    ) : (
                      form.phone || "---"
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <FaMapMarkerAlt
                      color={iconColor}
                      size={16}
                      style={{ marginRight: 2 }}
                    />
                    <b>Địa chỉ mặc định:</b>{" "}
                    {addresses.find((addr) => addr.is_default)?.location ||
                      "---"}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <FaSeedling
                      color={iconColor}
                      size={16}
                      style={{ marginRight: 2 }}
                    />{" "}
                    <b>Ngày tạo tài khoản:</b>{" "}
                    {form.created_at
                      ? new Date(form.created_at).toLocaleDateString()
                      : "---"}
                  </div>
                  {error && (
                    <div style={{ color: "red", marginBottom: 10 }}>
                      {error}
                    </div>
                  )}
                  {editMode ? (
                    <>
                      <Button
                        type="submit"
                        variant="success"
                        disabled={saving}
                        style={{
                          fontWeight: 700,
                          minWidth: 120,
                          borderRadius: 0,
                        }}
                      >
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        style={{
                          marginLeft: 12,
                          fontWeight: 700,
                          borderRadius: 0,
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
                      variant="outline-success"
                      style={{
                        marginTop: 18,
                        fontWeight: 700,
                        borderRadius: 0,
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
                    fontSize: 19,
                    marginBottom: 18,
                    color: darkGreen,
                  }}
                >
                  Địa chỉ của tôi
                </div>

                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="mb-3 p-3 border rounded"
                    style={{
                      background: addr.is_default ? "#e0ffe0" : "#f9f9f9",
                    }}
                  >
                    <div>
                      <b>{addr.recipient_name}</b> - {addr.phone}
                    </div>
                    <div>{addr.location}</div>
                    <div>
                      {!addr.is_default && (
                        <Button
                          size="sm"
                          variant="outline-success"
                          onClick={() => setDefaultAddress(addr.id)}
                        >
                          Chọn làm mặc định
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  variant="success"
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
                    />
                    <input
                      className="form-control mb-2"
                      placeholder="Số điện thoại"
                      value={newAddress.phone}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, phone: e.target.value })
                      }
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
                    />
                    <Button variant="primary" onClick={addAddress}>
                      Lưu địa chỉ
                    </Button>
                  </div>
                )}
              </>
            )}

            {activeTab === "password" && (
              <div style={{ fontSize: 16, marginBottom: 10 }}>
                Chức năng đổi mật khẩu sẽ được bổ sung.
              </div>
            )}
            {activeTab === "notification" && (
              <div style={{ fontSize: 16, marginBottom: 10 }}>
                Chức năng cài đặt thông báo sẽ được bổ sung.
              </div>
            )}
            {activeTab === "voucher" && (
              <div style={{ fontSize: 16, marginBottom: 10 }}>
                Chức năng voucher sẽ được bổ sung.
              </div>
            )}
            {activeTab === "point" && (
              <div style={{ fontSize: 16, marginBottom: 10 }}>
                Chức năng điểm thưởng sẽ được bổ sung.
              </div>
            )}
            {activeTab === "special" && (
              <div style={{ fontSize: 16, marginBottom: 10 }}>
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
