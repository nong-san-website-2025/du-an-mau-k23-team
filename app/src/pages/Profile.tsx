  import React from "react";
  import {
    IonPage,
    IonContent,
    IonButton,
    IonIcon,
    IonText,
    IonSpinner,
    IonAvatar,
    IonItem,
    IonLabel,
    IonList,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonBadge,
    useIonRouter,
  } from "@ionic/react";
  import {
    settingsOutline,
    notificationsOutline,
    logOutOutline,
    personOutline,
    walletOutline,
    cubeOutline,
    starOutline,
    ticketOutline,
    locationOutline,
    callOutline,
    mailOutline,
    helpCircleOutline,
    chevronForwardOutline,
    shieldCheckmarkOutline,
    timeOutline,
  } from "ionicons/icons";
  import { useAuth } from "../context/AuthContext";
  import "../styles/Profile.css";

  const Profile: React.FC = () => {
    const { user, logout, loading } = useAuth();
    const router = useIonRouter();

    const getInitials = (username?: string): string => {
      return username ? username.charAt(0).toUpperCase() : "?";
    };

    const handleLogout = async () => {
      // Thực tế nên có Alert xác nhận ở đây
      await logout();
      router.push("/login", "root", "replace");
    };

    if (loading) {
      return (
        <IonPage>
          <IonContent className="ion-text-center ion-padding">
            <div className="center-loading">
              <IonSpinner name="crescent" color="success" />
              <p>Đang tải dữ liệu...</p>
            </div>
          </IonContent>
        </IonPage>
      );
    }

    // --- SUB-COMPONENTS ---

    // 1. Header cho Khách (Chưa đăng nhập)
    const GuestHeader = () => (
      <div className="profile-header guest-mode">
        <div className="header-content ion-text-center">
          <div className="guest-avatar-box">
            <IonIcon icon={personOutline} />
          </div>
          <h2>Chào mừng bạn!</h2>
          <p className="sub-text">Đăng nhập để tích điểm và theo dõi đơn hàng</p>

          <div className="auth-actions">
            {/* Nút Đăng nhập (Màu trắng, chữ xanh) */}
            <IonButton
              routerLink="/login"
              color="light"
              expand="block"
              className="action-btn login-btn"
            >
              Đăng nhập
            </IonButton>

            {/* Nút Đăng ký (Viền trắng, nền trong suốt) */}
            <IonButton
              routerLink="/register"
              fill="outline"
              color="light"
              expand="block"
              className="action-btn register-btn"
            >
              Đăng ký
            </IonButton>
          </div>
        </div>
      </div>
    );

    // 2. Header cho User (Đã đăng nhập)
    const UserHeader = () => (
      <div className="profile-header">
        <div className="header-top-bar">
          <IonText color="light" className="header-title">
            Hồ sơ
          </IonText>
          <div className="header-icons">
            <IonButton fill="clear" color="light" className="icon-btn">
              <IonIcon icon={notificationsOutline} />
              <IonBadge color="danger" className="noti-badge">
                3
              </IonBadge>
            </IonButton>
            <IonButton fill="clear" color="light" className="icon-btn">
              <IonIcon icon={settingsOutline} />
            </IonButton>
          </div>
        </div>

        <div className="user-card-info">
          <div className="avatar-section">
            <IonAvatar className="main-avatar">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" />
              ) : (
                <span>{getInitials(user?.username)}</span>
              )}
            </IonAvatar>
            {user?.role === "seller" && (
              <div className="badge-role seller">
                <IonIcon icon={shieldCheckmarkOutline} /> Seller
              </div>
            )}
          </div>

          <div className="text-section">
            <h2 className="fullname">{user?.first_name || user?.username}</h2>
            <div className="membership-tag">
              <IonIcon icon={starOutline} /> Thành viên Bạc
            </div>
          </div>
        </div>
      </div>
    );

    // 3. Order Status Bar (Đơn hàng)
    const OrderStatusBar = () => (
      <IonCard className="order-status-card">
        <IonCardContent className="no-padding">
          <div className="card-title">
            <span>Đơn mua</span>
            <IonButton fill="clear" size="small" color="medium">
              Xem lịch sử <IonIcon icon={chevronForwardOutline} slot="end" />
            </IonButton>
          </div>
          <IonGrid>
            <IonRow className="ion-text-center">
              <IonCol>
                <div className="status-icon-wrapper warning">
                  <IonIcon icon={walletOutline} />
                  <IonBadge color="danger" className="count-badge">
                    1
                  </IonBadge>
                </div>
                <IonLabel>Chờ TT</IonLabel>
              </IonCol>
              <IonCol>
                <div className="status-icon-wrapper primary">
                  <IonIcon icon={cubeOutline} />
                </div>
                <IonLabel>Vận chuyển</IonLabel>
              </IonCol>
              <IonCol>
                <div className="status-icon-wrapper success">
                  <IonIcon icon={starOutline} />
                </div>
                <IonLabel>Đánh giá</IonLabel>
              </IonCol>
              <IonCol>
                <div className="status-icon-wrapper danger">
                  <IonIcon icon={timeOutline} />{" "}
                  {/* Đổi icon thành Lịch sử/Trả hàng tuỳ ý */}
                </div>
                <IonLabel>Trả hàng</IonLabel>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>
    );

    return (
      <IonPage className="profile-page">
        <IonContent fullscreen scrollY={false}>
          {/* HEADER AREA */}
          {user ? <UserHeader /> : <GuestHeader />}

          {/* BODY AREA */}
          <div className="profile-body-container">
            {user && <OrderStatusBar />}

            {/* Menu Group 1: Tài khoản */}
            {user && (
              <div className="menu-group">
                <IonList inset={true} lines="full">
                  <IonItem button detail={true} className="menu-item">
                    <div className="menu-icon blue-bg" slot="start">
                      <IonIcon icon={mailOutline} />
                    </div>
                    <IonLabel>
                      <h3>Email</h3>
                      <p>{user.email}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem button detail={true} className="menu-item">
                    <div className="menu-icon green-bg" slot="start">
                      <IonIcon icon={callOutline} />
                    </div>
                    <IonLabel>
                      <h3>Số điện thoại</h3>
                      <p>{user.phone_number || "Liên kết ngay"}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem
                    button
                    routerLink="/address-book"
                    detail={true}
                    className="menu-item"
                  >
                    <div className="menu-icon orange-bg" slot="start">
                      <IonIcon icon={locationOutline} />
                    </div>
                    <IonLabel>Sổ địa chỉ</IonLabel>
                  </IonItem>
                  <IonItem button detail={true} className="menu-item">
                    <div className="menu-icon red-bg" slot="start">
                      <IonIcon icon={ticketOutline} />
                    </div>
                    <IonLabel>Kho Voucher</IonLabel>
                  </IonItem>
                </IonList>
              </div>
            )}

            {/* Menu Group 2: Cài đặt & Hỗ trợ */}
            <div className="menu-group">
              <IonList inset={true} lines="full">
                <IonItem button detail={true} className="menu-item">
                  <div className="menu-icon gray-bg" slot="start">
                    <IonIcon icon={helpCircleOutline} />
                  </div>
                  <IonLabel>Trung tâm hỗ trợ</IonLabel>
                </IonItem>
                <IonItem button detail={true} className="menu-item">
                  <div className="menu-icon dark-bg" slot="start">
                    <IonIcon icon={settingsOutline} />
                  </div>
                  <IonLabel>Cài đặt tài khoản</IonLabel>
                </IonItem>

                {user && (
                  <IonItem
                    button
                    onClick={handleLogout}
                    detail={false}
                    lines="none"
                    className="menu-item logout-item"
                  >
                    <div
                      className="menu-icon"
                      slot="start"
                      style={{ background: "transparent" }}
                    >
                      <IonIcon icon={logOutOutline} color="danger" />
                    </div>
                    <IonLabel color="danger" style={{ fontWeight: 600 }}>
                      Đăng xuất
                    </IonLabel>
                  </IonItem>
                )}
              </IonList>
            </div>

            <div className="app-version">
              <p>GreenFarm v1.0.0</p>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  };

  export default Profile;
