import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Button,
  Spinner,
  Row,
  Col,
  Modal,
  ListGroup,
} from "react-bootstrap";
import { toast } from "react-toastify";
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
import MyVoucher from "../components/MyVoucher";
import { Helmet } from "react-helmet";

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
  const [newAddress, setNewAddress] = useState({
    recipient_name: "",
    phone: "",
    location: "",
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Wallet
  const [walletBalance, setWalletBalance] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeError, setRechargeError] = useState("");

  const [lastNotificationCheck, setLastNotificationCheck] = useState(
    Date.now()
  );

  // Follow stats + lists + modals
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingList, setFollowingList] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);

  /** -------------------- API Calls -------------------- **/

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get("users/me/");
      setUser(res.data);
      setForm(res.data);
      // Load follow stats and lists
      try {
        const followingRes = await API.get("sellers/my/following/");
        const following = Array.isArray(followingRes.data)
          ? followingRes.data
          : followingRes.data?.results || [];
        setFollowingList(following);
        setFollowingCount(following.length);
      } catch {}
      try {
        const followersRes = await API.get("sellers/my/followers/");
        const followers = Array.isArray(followersRes.data)
          ? followersRes.data
          : followersRes.data?.results || [];
        setFollowersList(followers);
        setFollowersCount(followers.length);
      } catch {
        setFollowersCount(0);
        setFollowersList([]);
      }
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
      console.error("Failed to refresh wallet balance:", err);
    }
  };

  const checkWalletNotifications = async () => {
    try {
      const res = await API.get(
        `/wallet/notifications/?since=${lastNotificationCheck}`
      );
      const notifications = res.data;

      notifications.forEach((notification) => {
        if (notification.type === "topup_approved") {
          toast.success(
            `✅ Nạp tiền thành công! Đã cộng ${notification.amount.toLocaleString("vi-VN")} ₫ vào ví.`,
            { autoClose: 6000 }
          );
          refreshWalletBalance();
        } else if (notification.type === "topup_rejected") {
          toast.error(
            `❌ Yêu cầu nạp tiền ${notification.amount.toLocaleString("vi-VN")} ₫ bị từ chối. ${notification.reason || ""}`,
            { autoClose: 6000 }
          );
        }
      });

      if (notifications.length > 0) {
        setLastNotificationCheck(Date.now());
      }
    } catch (err) {
      console.log("Notification check failed:", err);
    }
  };

  /** -------------------- Lifecycle -------------------- **/

  useEffect(() => {
    fetchProfile();
    const tabParam = searchParams.get("tab");
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

  // Open modals via events from child component buttons
  useEffect(() => {
    const openFollowing = () => setShowFollowingModal(true);
    const openFollowers = () => setShowFollowersModal(true);
    window.addEventListener("openFollowingModal", openFollowing);
    window.addEventListener("openFollowersModal", openFollowers);
    return () => {
      window.removeEventListener("openFollowingModal", openFollowing);
      window.removeEventListener("openFollowersModal", openFollowers);
    };
  }, []);

  /** -------------------- Handlers -------------------- **/

  const handleUnfollow = async (sellerId) => {
    const prevList = followingList;
    const prevCount = followingCount;
    // Optimistic update
    setFollowingList(prevList.filter((s) => s.id !== sellerId));
    setFollowingCount(Math.max(0, prevCount - 1));
    try {
      await API.delete(`sellers/${sellerId}/follow/`);
      toast.info("Đã hủy theo dõi");
    } catch (err) {
      // Revert on failure
      setFollowingList(prevList);
      setFollowingCount(prevCount);
      toast.error("Hủy theo dõi thất bại. Vui lòng thử lại!");
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar" && files && files[0])
      setForm((prev) => ({ ...prev, avatar: files[0] }));
    else setForm((prev) => ({ ...prev, [name]: value }));
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
        if (res.data?.username)
          localStorage.setItem("username", res.data.username);
      } catch {}
      // Broadcast a profile update event for live UI updates without reload
      try {
        window.dispatchEvent(
          new CustomEvent("userProfileUpdated", { detail: res.data })
        );
      } catch {}
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
        const msg =
          !amount || isNaN(amount)
            ? "Vui lòng nhập số tiền hợp lệ!"
            : amount < 10000
              ? "Số tiền nạp tối thiểu là 10.000 ₫."
              : "Số tiền nạp tối đa mỗi lần là 300.000.000 ₫.";
        setRechargeError(msg);
        toast.error(msg);
        return;
      }

      await API.post("/wallet/request_topup/", { amount });
      toast.info(
        `📝 Đã gửi yêu cầu nạp tiền ${amount.toLocaleString("vi-VN")} ₫. Vui lòng chờ xét duyệt!`
      );
      setRechargeAmount("");
      refreshWalletBalance();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Có lỗi xảy ra, vui lòng thử lại!";
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
      const redirect = new URLSearchParams(window.location.search).get(
        "redirect"
      );
      if (redirect === "checkout") navigate("/checkout");
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
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, is_default: a.id === id }))
    );
    try {
      await API.patch(`users/addresses/${id}/set_default/`);
      // Optional: revalidate in background to keep fresh data without blocking UI
      fetchAddresses();
      toast.success("✅ Đặt địa chỉ mặc định thành công!");
      const redirect = new URLSearchParams(window.location.search).get(
        "redirect"
      );
      if (redirect === "checkout") navigate("/checkout");
    } catch {
      // Revert on failure
      fetchAddresses();
      toast.error("❌ Không thể đặt địa chỉ mặc định!");
    }
  };

  /** -------------------- Render -------------------- **/

  if (loading)
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" style={{ color: mainColor }} />
        <div className="mt-3" style={{ color: mainColor, fontWeight: 600 }}>
          Đang tải thông tin cá nhân...
        </div>
      </Container>
    );

  if (!user || !form)
    return (
      <Container className="py-5 text-center">
        <Helmet>
          <title>Tài khoản của tôi</title>
          <meta name="description" content="Giỏ hàng" />
        </Helmet>
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

  return (
    <Container className="py-0">
      <Helmet>
        <title>Tài khoản của tôi</title>
        <meta name="description" content="Giỏ hàng" />
      </Helmet>
      <Row>
        <Col md={3}>
          <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </Col>
        <Col md={9}>
          <Card
            className="shadow border-0 p-3 mb-4"
            style={{ background: "#fff" }}
          >
            {activeTab === "profile" && (
              <>
                <ProfileInfo
                  form={{ ...form, followingCount, followersCount }}
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

                {/* Modals for following/followers */}
                <Modal
                  show={showFollowingModal}
                  onHide={() => setShowFollowingModal(false)}
                  centered
                  size="md"
                >
                  <Modal.Header closeButton>
                    <Modal.Title>Đang theo dõi</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <ListGroup>
                      {followingList.map((s) => (
                        <ListGroup.Item
                          key={s.id}
                          className="d-flex align-items-center"
                          style={{ padding: "8px 12px", gap: 8 }}
                        >
                          <div
                            className="d-flex align-items-center flex-grow-1 min-w-0"
                            style={{ gap: 10 }}
                          >
                            {s.image ? (
                              <img
                                src={s.image}
                                alt={s.store_name}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : null}
                            <div
                              className="fw-semibold text-truncate"
                              style={{ maxWidth: "100%" }}
                            >
                              {s.store_name ||
                                s.owner_username ||
                                s.user_username ||
                                `Shop #${s.id}`}
                            </div>
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="ms-2 px-2 py-1"
                            title="Hủy theo dõi"
                            onClick={() => handleUnfollow(s.id)}
                          >
                            ✕
                          </Button>
                        </ListGroup.Item>
                      ))}
                      {followingList.length === 0 && (
                        <div className="text-muted">
                          Bạn chưa theo dõi cửa hàng nào.
                        </div>
                      )}
                    </ListGroup>
                  </Modal.Body>
                </Modal>

                <Modal
                  show={showFollowersModal}
                  onHide={() => setShowFollowersModal(false)}
                  centered
                  size="md"
                >
                  <Modal.Header closeButton>
                    <Modal.Title>Người theo dõi</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <ListGroup>
                      {followersList.map((u) => (
                        <ListGroup.Item key={u.id}>
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.full_name || u.username}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                objectFit: "cover",
                                marginRight: 8,
                              }}
                            />
                          ) : null}
                          <strong>{u.full_name || u.username}</strong>
                        </ListGroup.Item>
                      ))}
                      {followersList.length === 0 && (
                        <div className="text-muted">
                          Chưa có ai theo dõi bạn.
                        </div>
                      )}
                    </ListGroup>
                  </Modal.Body>
                </Modal>
              </>
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
            {activeTab === "password" && <ChangePassword />}
            {activeTab === "notification" && <NotificationSettings />}
            {activeTab === "voucher" && <div style={{ fontSize: 16, marginBottom: 10, color: accentColor }}><VoucherList /></div>}
            {activeTab === "myvoucher" && <div style={{ fontSize: 16, marginBottom: 10, color: accentColor }}><MyVoucher /></div>}
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
