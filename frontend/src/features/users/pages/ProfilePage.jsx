// src/pages/ProfilePage.jsx
import React from "react";
import { Container, Card, Button, Spinner, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

// Import Hằng số
import { MAIN_COLOR, ACCENT_COLOR } from "../constants/profileConstants";

// Import Custom Hooks
import useProfileData from "../hooks/useProfileData";
import useAddressLogic from "../hooks/useAddressLogic";
import useWalletLogic from "../hooks/useWalletLogic";

// Import Components
import ProfileSidebar from "../components/ProfileSidebar";
import ProfileInfo from "../components/ProfileInfo";
import AddressList from "../components/AddressList";
import WalletTab from "../components/WalletTab";
import ChangePassword from "../components/ChangePassword";
import NotificationSettings from "../components/NotificationSettings";
import VoucherList from "../components/VoucherList";
import MyVoucher from "../components/MyVoucher";
import Rewards from "../../points/pages/Rewards";
import { FollowingModal, FollowersModal } from "../components/ProfileFollowModals";


function ProfilePage() {
  const navigate = useNavigate();

  // Custom Hooks
  const {
    activeTab,
    setActiveTab,
    user,
    loading,
    editMode,
    setEditMode,
    form,
    setForm,
    saving,
    error,
    handleChange,
    handleSave,
    followingCount,
    followersCount,
    followingList,
    followersList,
    showFollowingModal,
    setShowFollowingModal,
    showFollowersModal,
    setShowFollowersModal,
    handleUnfollow,
  } = useProfileData();

  const {
    addresses,
    showAddressForm,
    setShowAddressForm,
    newAddress,
    setNewAddress,
    addAddress,
    editAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAddressLogic(activeTab, navigate);

  const {
    walletBalance,
    loadingWallet,
    rechargeAmount,
    setRechargeAmount,
    rechargeLoading,
    rechargeError,
    handleRecharge,
  } = useWalletLogic(activeTab);

  /** -------------------- Render -------------------- **/

  if (loading)
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" style={{ color: MAIN_COLOR }} />
        <div className="mt-3" style={{ color: MAIN_COLOR, fontWeight: 600 }}>
          Đang tải thông tin cá nhân...
        </div>
      </Container>
    );

  if (!user || !form)
    return (
      <Container className="py-5 text-center">
        <Helmet>
          <title>Tài khoản của tôi</title>
          <meta name="description" content="Thông tin tài khoản" />
        </Helmet>
        <h2 className="mb-2 fw-bold" style={{ color: MAIN_COLOR }}>
          Không tìm thấy thông tin người dùng
        </h2>
        <Button
          href="/"
          style={{
            background: MAIN_COLOR,
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
    <Container className="py-3">
      <Helmet>
        <title>Tài khoản của tôi</title>
        <meta name="description" content={`Trang cá nhân của ${user.username}`} />
      </Helmet>
      <Row>
        <Col md={3}>
          <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </Col>
        <Col md={9}>
          <Card
            className="shadow border-0 p-2 mb-3"
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
                  onOpenFollowingModal={() => setShowFollowingModal(true)}
                  onOpenFollowersModal={() => setShowFollowersModal(true)}
                />

                {/* Modals for following/followers (Sử dụng component tách riêng) */}
                <FollowingModal
                  show={showFollowingModal}
                  onHide={() => setShowFollowingModal(false)}
                  followingList={followingList}
                  handleUnfollow={handleUnfollow}
                />
                <FollowersModal
                  show={showFollowersModal}
                  onHide={() => setShowFollowersModal(false)}
                  followersList={followersList}
                />
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
            {activeTab === "voucher" && (
              <div
                style={{ fontSize: 16, marginBottom: 10, color: ACCENT_COLOR }}
              >
                <VoucherList />
              </div>
            )}
            {activeTab === "myvoucher" && (
              <div
                style={{ fontSize: 16, marginBottom: 10, color: ACCENT_COLOR }}
              >
                <MyVoucher />
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