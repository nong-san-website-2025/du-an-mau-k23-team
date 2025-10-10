// src/pages/Tab5.tsx
import React from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import {
  settingsOutline,
  notificationsOutline,
  personOutline,
} from "ionicons/icons";

const Tab5: React.FC = () => {
  const heroHeight = "120px"; // 👈 Chiều cao vùng nền (toolbar + khoảng trống + hàng nút)
  const backgroundColor = "#4caf50";

  return (
    <IonPage>
      {/* 👇 Lớp nền hero cố định */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: heroHeight,
          background: backgroundColor,
          zIndex: 1, // dưới nội dung
        }}
      >
        {/* Toolbar giả */}
        <div
          style={{
            height: "40px", // chiều cao toolbar mặc định của Ionic
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: "16px",
            
          }}
        >
          <IonButton style={{ margin: "0", background: backgroundColor , "--background": "transparent", "--box-shadow": "none"}}>
            <IonIcon icon={settingsOutline} size="large" color="light" />
          </IonButton>
          <IonButton style={{ margin: "0", background: backgroundColor , "--background": "transparent", "--box-shadow": "none"  }}>
            <IonIcon icon={notificationsOutline} size="large"  color="light" />
          </IonButton>
        </div>

        {/* Hàng nút & avatar */}
        <div
          style={{
            height: `calc(${heroHeight} - 56px)`,
            display: "flex",
            alignItems: "center",
            padding: "0px",
          }}
        >
          <IonGrid style={{ height: "100%" }}>
            <IonRow className="ion-align-items-center" style={{ height: "100%" }}>
              {/* Nút */}
              <IonCol size="7">
                <div style={{ display: "flex", gap: "0px" }}>
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
              </IonCol>

              {/* Avatar */}
              <IonCol size="5" className="ion-text-center">
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: "100px",
                  }}
                >
                  <IonIcon
                    icon={personOutline}
                    color="light"
                    style={{ fontSize: "24px" }}
                  />
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>
      </div>

      {/* 👇 Nội dung cuộn được, nằm dưới hero */}
      <IonContent
        style={{
          paddingTop: heroHeight, // 👈 Đẩy nội dung xuống dưới hero
        }}
        className="ion-padding"
      >
        {/* Phần nội dung dưới (nếu có) — hiện tại để trống */}
        <div style={{ color: "#333" }}>
          {/* Bạn có thể thêm phần "Lịch sử đơn hàng", "Ưu đãi", v.v. ở đây */}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab5;