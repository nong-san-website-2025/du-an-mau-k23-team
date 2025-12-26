import React from "react";
import { IonTabBar, IonTabButton, IonIcon, IonLabel } from "@ionic/react";
import {
  home,
  homeOutline,
  gridSharp,
  gridOutline,
  personSharp,
  personOutline,
  // heartSharp, // Có thể xóa bỏ import này nếu không dùng nữa
  // heartOutline,
  notificationsSharp,
  notificationsOutline,
} from "ionicons/icons";
import { useLocation } from "react-router-dom";

const TabNavigation: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <IonTabBar slot="bottom">
      <IonTabButton tab="tab1" href="/home">
        <IonIcon icon={currentPath === "/home" ? home : homeOutline} />
        <IonLabel>Trang chủ</IonLabel>
      </IonTabButton>

      <IonTabButton tab="tab2" href="/category">
        <IonIcon icon={currentPath === "/category" ? gridSharp : gridOutline} />
        <IonLabel>Danh mục</IonLabel>
      </IonTabButton>

      {/* Tab 3 đã được loại bỏ tại đây */}

      <IonTabButton tab="tab4" href="/notification">
        <IonIcon icon={currentPath === "/notification" ? notificationsSharp : notificationsOutline} />
        <IonLabel>Thông báo</IonLabel>
      </IonTabButton>

      <IonTabButton tab="tab5" href="/profile">
        <IonIcon icon={currentPath === "/profile" ? personSharp : personOutline} />
        <IonLabel>Tài khoản</IonLabel>
      </IonTabButton>
    </IonTabBar>
  );
};

export default TabNavigation;