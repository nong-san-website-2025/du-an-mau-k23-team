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
import { toast } from 'react-toastify';
import API from "../../login_register/services/api";
import Rewards from "../../points/pages/Rewards";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProfileSidebar from "../components/ProfileSidebar";
import ProfileInfo from "../components/ProfileInfo";
import AddressList from "../components/AddressList";
import WalletTab from "../components/WalletTab";
import ChangePassword from "../components/ChangePassword";
import NotificationSettings from "../components/NotificationSettings";
import VoucherList from "../components/VoucherList";
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
  const [lastNotificationCheck, setLastNotificationCheck] = useState(Date.now());
  // Fetch wallet balance when tab is wallet

  // Check for wallet notifications
  const checkWalletNotifications = async () => {
    try {
      const response = await API.get(`/wallet/notifications/?since=${lastNotificationCheck}`);
      const notifications = response.data;
      
      notifications.forEach(notification => {
        if (notification.type === 'topup_approved') {
          toast.success(`✅ Nạp tiền thành công! Đã cộng ${notification.amount.toLocaleString('vi-VN')} ₫ vào ví của bạn.`, {
            position: "top-right",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          // Refresh wallet balance
          refreshWalletBalance();
        } else if (notification.type === 'topup_rejected') {
          toast.error(`❌ Yêu cầu nạp tiền ${notification.amount.toLocaleString('vi-VN')} ₫ đã bị từ chối. ${notification.reason || ''}`, {
            position: "top-right",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      });
      
      if (notifications.length > 0) {
        setLastNotificationCheck(Date.now());
      }
    } catch (error) {
      // Silently fail - không cần thông báo lỗi cho việc check notification
      console.log('Notification check failed:', error);
    }
  };

  const refreshWalletBalance = async () => {
    try {
      const res = await API.get("/wallet/my_wallet/");
      setWalletBalance(res.data.balance);
    } catch (error) {
      console.error('Failed to refresh wallet balance:', error);
    }
  };

  useEffect(() => {
    if (activeTab === "wallet") {
      setLoadingWallet(true);
      setRechargeError("");
      // Gọi API lấy số dư ví
      API.get("/wallet/my_wallet/")
        .then(res => setWalletBalance(res.data.balance))
        .catch(() => setWalletBalance(null))
        .finally(() => setLoadingWallet(false));
      
      // Check for notifications immediately
      checkWalletNotifications();
      
      // Set up polling for notifications every 30 seconds
      const notificationInterval = setInterval(checkWalletNotifications, 30000);
      
      return () => clearInterval(notificationInterval);
    }
  }, [activeTab, lastNotificationCheck]);


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
    
    // Check for tab parameter in URL
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
          toast.error("Vui lòng nhập số tiền hợp lệ!");
          setRechargeLoading(false);
          return;
        }
        if (amount < 10000) {
          setRechargeError("Số tiền nạp tối thiểu là 10.000 ₫.");
          toast.error("Số tiền nạp tối thiểu là 10.000 ₫.");
          setRechargeLoading(false);
          return;
        }
        if (amount > 300000000) {
          setRechargeError("Số tiền nạp tối đa mỗi lần là 300.000.000 ₫.");
          toast.error("Số tiền nạp tối đa mỗi lần là 300.000.000 ₫.");
          setRechargeLoading(false);
          return;
        }

        // Gọi API nạp tiền đúng endpoint backend
        await API.post("/wallet/request_topup/", { amount });
        
        // Hiển thị thông báo đã gửi yêu cầu nạp tiền
        toast.info(`📝 Đã gửi yêu cầu nạp tiền ${amount.toLocaleString('vi-VN')} ₫. Vui lòng chờ xét duyệt!`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        setRechargeAmount("");
        setRechargeError("");

      } catch (err) {
        console.error("Recharge error:", err);
        const errorMessage = err.response?.data?.message || err.response?.data?.error || "Có lỗi xảy ra, vui lòng thử lại!";
        setRechargeError(errorMessage);
        toast.error(`❌ ${errorMessage}`, {
          position: "top-right",
          autoClose: 5000,
        });
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

  const editAddress = async (addressId, addressData) => {
    try {
      await API.put(`users/addresses/${addressId}/`, addressData);
      const res = await API.get("users/addresses/");
      setAddresses(res.data);
    } catch (err) {
      console.error("Lỗi chỉnh sửa địa chỉ:", err);
      throw err;
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      await API.delete(`users/addresses/${addressId}/`);
      const res = await API.get("users/addresses/");
      setAddresses(res.data);
    } catch (err) {
      console.error("Lỗi xóa địa chỉ:", err);
      throw err;
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
                editAddress={editAddress}
                deleteAddress={deleteAddress}
              />
            )}
            {activeTab === "password" && (
              <ChangePassword />
            )}

            {activeTab === "notification" && (
              <NotificationSettings />)}

            {activeTab === "voucher" && (
            <div style={{ fontSize: 16, marginBottom: 10, color: accentColor }}>
              <VoucherList />
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
