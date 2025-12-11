import React from "react";
import {
  IonToolbar,
  IonSearchbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonHeader,
  IonBackButton,
  IonBadge,
  IonTitle,
} from "@ionic/react";
import { chatbubbleEllipsesOutline, cartOutline, searchOutline } from "ionicons/icons";
import { useCart } from "../context/CartContext";
import { useHistory } from "react-router-dom";
import "../styles/AppHeader.css"; // Import file CSS riêng

interface AppHeaderProps {
  showSearch?: boolean;
  showBack?: boolean;
  defaultHref?: string;
  title?: string; // Thêm prop Title nếu không show Search
  className?: string; // Cho phép custom class từ ngoài
}

const AppHeader: React.FC<AppHeaderProps> = ({
  showSearch = true,
  showBack = false,
  defaultHref = "/",
  title = "",
  className = "",
}) => {
  const { cartItemCount } = useCart();
  const history = useHistory();

  const handleCartClick = () => {
    history.push("/cart");
  };

  return (
    <IonHeader className={`main-header ion-no-border ${className}`}>
      <IonToolbar className="main-toolbar">
        {/* === Left Section === */}
        <IonButtons slot="start">
          {showBack && (
            <IonBackButton
              defaultHref={defaultHref}
              className="custom-back-btn"
              text="" // UX hiện đại thường ẩn text "Back", chỉ để icon
            />
          )}
        </IonButtons>

        {/* === Center Section (Title or Search) === */}
        {showSearch ? (
          <IonSearchbar
            placeholder="Tìm kiếm sản phẩm..."
            inputMode="search"
            showClearButton="focus"
            className="custom-searchbar"
            searchIcon={searchOutline}
          />
        ) : (
          <IonTitle className="header-title">{title}</IonTitle>
        )}

        {/* === Right Section === */}
        <IonButtons slot="end" className="action-buttons">
          <IonButton className="icon-btn">
            <IonIcon icon={chatbubbleEllipsesOutline} />
          </IonButton>

          <IonButton onClick={handleCartClick} className="icon-btn cart-btn">
            <IonIcon icon={cartOutline} />
            {cartItemCount > 0 && (
              <IonBadge color="danger" className="cart-badge">
                {cartItemCount > 9 ? "9+" : cartItemCount}
              </IonBadge>
            )}
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default AppHeader;