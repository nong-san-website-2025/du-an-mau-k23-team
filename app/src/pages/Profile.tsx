// src/pages/Profile.tsx
import React from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
} from "@ionic/react";
import {
  settingsOutline,
  notificationsOutline,
  personOutline,
  logOutOutline,
} from "ionicons/icons";
import { useAuth } from "../context/AuthContext"; // 👈 Dùng context

const Profile: React.FC = () => {
  const heroHeight = "120px";
  const backgroundColor = "#4caf50";
  const { user, logout, loading } = useAuth(); // 👈 Lấy user và hàm logout

  React.useEffect(() => {
    alert(
      `Profile loaded. User: ${
        user ? user.username : "null"
      }, Loading: ${loading}`
    );
  }, [user, loading]);

  // 👇 Lấy chữ cái đầu của username (viết hoa)
  const getInitials = (username?: string): string => {
    if (!username) return "?";
    return username.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    // Sau logout, user = null → giao diện tự cập nhật
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonText>Đang tải thông tin...</IonText>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      {/* Hero background */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: heroHeight,
          background: backgroundColor,
          zIndex: 1,
        }}
      >
        {/* Toolbar icons */}
        <div
          style={{
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: "16px",
          }}
        >
          <IonButton
            style={{
              margin: "0",
              "--background": "transparent",
              "--box-shadow": "none",
            }}
          >
            <IonIcon icon={settingsOutline} size="large" color="light" />
          </IonButton>
          <IonButton
            style={{
              margin: "0",
              "--background": "transparent",
              "--box-shadow": "none",
            }}
          >
            <IonIcon icon={notificationsOutline} size="large" color="light" />
          </IonButton>
        </div>

        {/* Avatar & buttons */}
        <div
          style={{
            height: `calc(${heroHeight} - 40px)`,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
          }}
        >
          <IonGrid style={{ height: "100%" }}>
            <IonRow
              className="ion-align-items-center"
              style={{ height: "100%" }}
            >
              {/* Buttons: Login/Register or Logout */}
              <IonCol size="7">
                {user ? (
                  <IonButton
                    onClick={handleLogout}
                    style={{
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: "600",
                      height: "36px",
                      fontSize: "14px",
                      "--background": "rgba(255,255,255,0.2)",
                      "--color": "white",
                    }}
                  >
                    <IonIcon icon={logOutOutline} slot="start" />
                    Đăng xuất
                  </IonButton>
                ) : (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <IonButton
                      routerLink="/login"
                      style={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: "400",
                        height: "36px",
                        width: "120px",
                        fontSize: "14px",
                        "--background": "white",
                        "--color": backgroundColor,
                      }}
                    >
                      Đăng nhập
                    </IonButton>
                    <IonButton
                      fill="outline"
                      routerLink="/register"
                      style={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: "600",
                        height: "36px",
                        width: "120px",
                        fontSize: "14px",
                        "--color": "white",
                        "--border-color": "white",
                        "--background": "transparent",
                      }}
                    >
                      Đăng ký
                    </IonButton>
                  </div>
                )}
              </IonCol>

              {/* Avatar */}
              <IonCol size="5" className="ion-text-center">
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    background: user ? "white" : "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: "auto",
                    marginRight: "16px",
                    color: user ? backgroundColor : "white",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  {user ? (
                    getInitials(user.username)
                  ) : (
                    <IonIcon
                      icon={personOutline}
                      color="light"
                      style={{ fontSize: "24px" }}
                    />
                  )}
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>
      </div>

      {/* Scrollable content */}
      <IonContent
        style={{
          paddingTop: heroHeight,
        }}
        className="ion-padding"
      >
        {user ? (
          <div>
            <h2>Xin chào, {user.username}!</h2>
            <IonText color="medium">
              <p>Vai trò: {user.role}</p>
            </IonText>
            {/* Thêm: Lịch sử đơn hàng, cài đặt, v.v. */}
          </div>
        ) : (
          <IonText color="medium">
            Vui lòng đăng nhập để xem thông tin cá nhân.
          </IonText>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Profile;
