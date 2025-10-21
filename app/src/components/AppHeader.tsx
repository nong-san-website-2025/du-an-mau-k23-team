// src/components/AppHeader.tsx
import React from "react";
import {
  IonToolbar,
  IonSearchbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonHeader,
  IonBackButton,
} from "@ionic/react";
import { chatbubbleOutline, cartOutline } from "ionicons/icons";
import { useCart } from "../context/CartContext";
import { useHistory } from "react-router-dom";

interface AppHeaderProps {
  showSearch?: boolean; // Hiển thị thanh tìm kiếm? (mặc định: true)
  showBack?: boolean;   // Hiển thị nút Back? (mặc định: false)
  defaultHref?: string; // Đường dẫn mặc định khi nhấn back (chỉ dùng nếu showBack=true)
  backgroundColor?: string;
  
}

const AppHeader: React.FC<AppHeaderProps> = ({
  showSearch = true,
  showBack = false,
  defaultHref = "/",
  backgroundColor = "#4caf50",
}) => {
  const { cartItemCount } = useCart();
  const history = useHistory();

  const handleCartClick = () => {
    history.push("/cart");
  };

  return (
    <IonHeader>
      <IonToolbar style={{ "--background": backgroundColor }}>
        {/* Nút Back (nếu cần) */}
        {showBack && (
          <IonButtons slot="start">
            <IonBackButton
              defaultHref={defaultHref}
              color="light"
              text=""
            />
          </IonButtons>
        )}

        {/* Thanh tìm kiếm */}
        {showSearch && (
          <IonSearchbar
            placeholder="Search"
            showClearButton="focus"
            // onIonInput / onIonChange có thể thêm sau
          />
        )}

        {/* Nút chat & giỏ hàng */}
        <IonButtons slot="end">
          <IonButton>
            <IonIcon icon={chatbubbleOutline} color="light" size="large" />
          </IonButton>
          <IonButton onClick={handleCartClick} style={{ position: "relative" }}>
            <IonIcon icon={cartOutline} color="light" size="large" />
            {cartItemCount > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "red",
                  color: "white",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  fontSize: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                }}
              >
                {cartItemCount > 9 ? "9+" : cartItemCount}
              </div>
            )}
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default AppHeader;