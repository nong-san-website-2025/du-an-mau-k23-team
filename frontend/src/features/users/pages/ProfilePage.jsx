    // Hàm nạp tiền ví

import React, { useEffect, useState } from "react";
import { Container, Card, Button, Spinner, Row, Col } from "react-bootstrap";
import API from "../../login_register/services/api";
import { useNavigate } from "react-router-dom";
import ProfileSidebar from "../components/ProfileSidebar";
import ProfileInfo from "../components/ProfileInfo";
import AddressList from "../components/AddressList";
import WalletTab from "../components/WalletTab";
const mainColor = "#2E8B57";
const accentColor = "#F57C00";

function ProfilePage() {
  const navigate = useNavigate();
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
  // Wallet state
  const [walletBalance, setWalletBalance] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeError, setRechargeError] = useState("");
  // Fetch wallet balance when tab is wallet

  useEffect(() => {
    if (activeTab === "wallet") {
      setLoadingWallet(true);
      setRechargeError("");
      // Gọi API lấy số dư ví
  API.get("/wallet/my_wallet/")
        .then(res => setWalletBalance(res.data.balance))
        .catch(() => setWalletBalance(null))
        .finally(() => setLoadingWallet(false));
    }
  }, [activeTab]);


  useEffect(() => {
    if (activeTab === "address") {
      API.get("users/addresses/").then((res) => setAddresses(res.data));
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

      const handleRecharge = async () => {
      setRechargeLoading(true);
      setRechargeError("");
      try {
        const amount = Number(rechargeAmount);
        if (!rechargeAmount || isNaN(amount)) {
          setRechargeError("Vui lòng nhập số tiền hợp lệ!");
          setRechargeLoading(false);
          return;
        }
        if (amount < 10000) {
          setRechargeError("Số tiền nạp tối thiểu là 10.000 ₫.");
          setRechargeLoading(false);
          return;
        }
        if (amount > 300000000) {
          setRechargeError("Số tiền nạp tối đa mỗi lần là 300.000.000 ₫.");
          setRechargeLoading(false);
          return;
        }
    // Gọi API nạp tiền đúng endpoint backend
    await API.post("/wallet/request_topup/", { amount });
        setRechargeAmount("");
        setRechargeError("");
        // Sau khi nạp thành công, reload số dư
        setLoadingWallet(true);
    const res = await API.get("/wallet/my_wallet/");
        setWalletBalance(res.data.balance);
        setLoadingWallet(false);
      } catch (err) {
        setRechargeError("Có lỗi xảy ra, vui lòng thử lại!");
        setLoadingWallet(false);
      } finally {
        setRechargeLoading(false);
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
      const res = await API.get("users/addresses/");
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
        <Col md={3}>
          <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </Col>
        <Col md={9}>
          <Card className="shadow border-0 p-3 mb-4" style={{ background: "#fff" }}>
            {activeTab === "profile" && (
              <ProfileInfo
                form={form}
                editMode={editMode}
                setEditMode={setEditMode}
                handleChange={handleChange}
                handleSave={handleSave}
                saving={saving}
                error={error}
                user={user}
                setForm={setForm}
                addresses={addresses}
              />
            )}
            {activeTab === "address" && (
              <AddressList
                addresses={addresses}
                setDefaultAddress={setDefaultAddress}
                showAddressForm={showAddressForm}
                setShowAddressForm={setShowAddressForm}
                newAddress={newAddress}
                setNewAddress={setNewAddress}
                addAddress={addAddress}
              />
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
                Chức năng điểm thưởng sẽ được bổ sung.
              </div>
            )}
            {activeTab === "special" && (
              <div style={{ fontSize: 16, marginBottom: 10, color: "#D32F2F" }}>
                Chức năng ưu đãi đặc biệt sẽ được bổ sung.
              </div>
            )}
            {activeTab === "wallet" && (
              <WalletTab
                walletBalance={walletBalance}
                loadingWallet={loadingWallet}
                rechargeAmount={rechargeAmount}
                setRechargeAmount={setRechargeAmount}
                rechargeLoading={rechargeLoading}
                rechargeError={rechargeError}
                handleRecharge={handleRecharge}
              />
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ProfilePage;
