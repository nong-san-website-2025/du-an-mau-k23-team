import React, { useEffect, useState } from "react";
import { Container, Card, Button, Spinner, Row, Col } from "react-bootstrap";
import { toast } from 'react-toastify';
import API from "../../login_register/services/api";
import { useNavigate, useSearchParams } from "react-router-dom";

import ProfileSidebar from "../components/ProfileSidebar";
import ProfileInfo from "../components/ProfileInfo";
import AddressList from "../components/AddressList";
import WalletTab from "../components/WalletTab";
import ChangePassword from "../components/ChangePassword";
import NotificationSettings from "../components/NotificationSettings";
import VoucherList from "../components/VoucherList";
import Rewards from "../../points/pages/Rewards";

const mainColor = "#2E8B57";
const accentColor = "#F57C00";

function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Address
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({ recipient_name: "", phone: "", location: "" });
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Wallet
  const [walletBalance, setWalletBalance] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeError, setRechargeError] = useState("");

  const [lastNotificationCheck, setLastNotificationCheck] = useState(Date.now());

  /** -------------------- API Calls -------------------- **/

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get("users/me/");
      setUser(res.data);
      setForm(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await API.get("users/addresses/");
      setAddresses(res.data);
    } catch (err) {
      console.error("Fetch addresses failed:", err);
    }
  };

  const refreshWalletBalance = async () => {
    try {
      const res = await API.get("/wallet/my_wallet/");
      setWalletBalance(res.data.balance);
    } catch (err) {
      console.error('Failed to refresh wallet balance:', err);
    }
  };

  const checkWalletNotifications = async () => {
    try {
      const res = await API.get(`/wallet/notifications/?since=${lastNotificationCheck}`);
      const notifications = res.data;

      notifications.forEach(notification => {
        if (notification.type === 'topup_approved') {
          toast.success(`✅ Nạp tiền thành công! Đã cộng ${notification.amount.toLocaleString('vi-VN')} ₫ vào ví.`, { autoClose: 6000 });
          refreshWalletBalance();
        } else if (notification.type === 'topup_rejected') {
          toast.error(`❌ Yêu cầu nạp tiền ${notification.amount.toLocaleString('vi-VN')} ₫ bị từ chối. ${notification.reason || ''}`, { autoClose: 6000 });
        }
      });

      if (notifications.length > 0) {
        setLastNotificationCheck(Date.now());
      }
    } catch (err) {
      console.log('Notification check failed:', err);
    }
  };

  /** -------------------- Lifecycle -------------------- **/

  useEffect(() => {
    fetchProfile();
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  // Fetch addresses once on mount so profile has default address available
  useEffect(() => {
    fetchAddresses();
  }, []);

  // Also refresh when switching to the address tab
  useEffect(() => {
    if (activeTab === "address") fetchAddresses();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "wallet") {
      setLoadingWallet(true);
      refreshWalletBalance().finally(() => setLoadingWallet(false));

      const interval = setInterval(checkWalletNotifications, 30000);
      checkWalletNotifications();
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  /** -------------------- Handlers -------------------- **/

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar" && files && files[0]) setForm(prev => ({ ...prev, avatar: files[0] }));
    else setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("username", form.username || "");
      formData.append("full_name", form.full_name || "");
      formData.append("email", form.email || "");
      formData.append("phone", form.phone || "");
      if (form.avatar instanceof File) formData.append("avatar", form.avatar);

      // Let the HTTP client set the proper multipart boundary automatically
      const res = await API.put("users/me/", formData);
      setEditMode(false);
      setUser(res.data);
      setForm(res.data);
      // Sync username globally for header and other components
      try {
        if (res.data?.username) localStorage.setItem("username", res.data.username);
      } catch {}
      // Broadcast a profile update event for live UI updates without reload
      try { window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: res.data })); } catch {}
      toast.success("✅ Cập nhật thông tin thành công!");
    } catch {
      setError("Cập nhật thất bại. Vui lòng thử lại!");
      toast.error("❌ Cập nhật thất bại!");
    } finally {
      setSaving(false);
    }
  };

  const handleRecharge = async () => {
    setRechargeLoading(true);
    setRechargeError("");
    try {
      const amount = Number(rechargeAmount);
      if (!amount || isNaN(amount) || amount < 10000 || amount > 300000000) {
        const msg = !amount || isNaN(amount) ? "Vui lòng nhập số tiền hợp lệ!" :
          amount < 10000 ? "Số tiền nạp tối thiểu là 10.000 ₫." :
          "Số tiền nạp tối đa mỗi lần là 300.000.000 ₫.";
        setRechargeError(msg);
        toast.error(msg);
        return;
      }

      await API.post("/wallet/request_topup/", { amount });
      toast.info(`📝 Đã gửi yêu cầu nạp tiền ${amount.toLocaleString('vi-VN')} ₫. Vui lòng chờ xét duyệt!`);
      setRechargeAmount("");
      refreshWalletBalance();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Có lỗi xảy ra, vui lòng thử lại!";
      setRechargeError(msg);
      toast.error(`❌ ${msg}`);
    } finally {
      setRechargeLoading(false);
    }
  };

  const addAddress = async () => {
    try {
      await API.post("users/addresses/", newAddress);
      await fetchAddresses();
      setShowAddressForm(false);
      setNewAddress({ recipient_name: "", phone: "", location: "" });
      toast.success("✅ Thêm địa chỉ thành công!");
      // Nếu quay lại checkout sau khi thêm địa chỉ
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      if (redirect === 'checkout') navigate('/checkout');
    } catch {
      toast.error("❌ Thêm địa chỉ thất bại!");
    }
  };

  const editAddress = async (id, data) => {
    try {
      await API.put(`users/addresses/${id}/`, data);
      fetchAddresses();
      toast.success("✅ Chỉnh sửa địa chỉ thành công!");
    } catch {
      toast.error("❌ Chỉnh sửa địa chỉ thất bại!");
    }
  };

  const deleteAddress = async (id) => {
    try {
      await API.delete(`users/addresses/${id}/`);
      fetchAddresses();
      toast.success("✅ Xóa địa chỉ thành công!");
    } catch {
      toast.error("❌ Xóa địa chỉ thất bại!");
    }
  };

  const setDefaultAddress = async (id) => {
    // Optimistic UI update: mark default locally for smooth UX
    setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
    try {
      await API.patch(`users/addresses/${id}/set_default/`);
      // Optional: revalidate in background to keep fresh data without blocking UI
      fetchAddresses();
      toast.success("✅ Đặt địa chỉ mặc định thành công!");
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      if (redirect === 'checkout') navigate('/checkout');
    } catch {
      // Revert on failure
      fetchAddresses();
      toast.error("❌ Không thể đặt địa chỉ mặc định!");
    }
  };

  /** -------------------- Render -------------------- **/

  if (loading) return (
    <Container className="py-5 text-center">
      <Spinner animation="border" style={{ color: mainColor }} />
      <div className="mt-3" style={{ color: mainColor, fontWeight: 600 }}>
        Đang tải thông tin cá nhân...
      </div>
    </Container>
  );

  if (!user || !form) return (
    <Container className="py-5 text-center">
      <h2 className="mb-2 fw-bold" style={{ color: mainColor }}>
        Không tìm thấy thông tin người dùng
      </h2>
      <Button href="/" style={{ background: mainColor, border: "none", borderRadius: 8, fontWeight: 700 }}>
        Về trang chủ
      </Button>
    </Container>
  );

  return (
    <Container className="py-0">
      <Row>
        <Col md={3}>
          <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </Col>
        <Col md={9}>
          <Card className="shadow border-0 p-3 mb-4" style={{ background: "#fff" }}>
            {activeTab === "profile" && <ProfileInfo form={form} editMode={editMode} setEditMode={setEditMode} handleChange={handleChange} handleSave={handleSave} saving={saving} error={error} user={user} setForm={setForm} addresses={addresses} />}
            {activeTab === "address" && <AddressList addresses={addresses} setDefaultAddress={setDefaultAddress} showAddressForm={showAddressForm} setShowAddressForm={setShowAddressForm} newAddress={newAddress} setNewAddress={setNewAddress} addAddress={addAddress} editAddress={editAddress} deleteAddress={deleteAddress} />}
            {activeTab === "password" && <ChangePassword />}
            {activeTab === "notification" && <NotificationSettings />}
            {activeTab === "voucher" && <div style={{ fontSize: 16, marginBottom: 10, color: accentColor }}><VoucherList /></div>}
            {activeTab === "point" && <div style={{ fontSize: 16, marginBottom: 10, color: "#FFD700" }}><Rewards /></div>}
            {activeTab === "special" && <div style={{ fontSize: 16, marginBottom: 10, color: "#D32F2F" }}>Chức năng ưu đãi đặc biệt sẽ được bổ sung.</div>}
            {activeTab === "wallet" && <WalletTab walletBalance={walletBalance} loadingWallet={loadingWallet} rechargeAmount={rechargeAmount} setRechargeAmount={setRechargeAmount} rechargeLoading={rechargeLoading} rechargeError={rechargeError} handleRecharge={handleRecharge} />}
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ProfilePage;
