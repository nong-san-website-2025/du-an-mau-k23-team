import React from "react";
import { IonTabBar, IonTabButton, IonIcon, IonLabel } from "@ionic/react";
import {
  home,
  homeOutline,
  gridSharp,
  gridOutline,
  personSharp,
  personOutline,
  heartSharp,
  heartOutline,
  notificationsSharp,
  notificationsOutline,
} from "ionicons/icons";
import { useLocation } from "react-router-dom";

const TabNavigation: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <IonTabBar slot="bottom">
      <IonTabButton tab="tab1" href="/tab1">
        <IonIcon icon={currentPath === "/tab1" ? home : homeOutline} />
        <IonLabel>Trang chủ</IonLabel>
      </IonTabButton>

      <IonTabButton tab="tab2" href="/tab2">
        <IonIcon icon={currentPath === "/tab2" ? gridSharp : gridOutline} />
        <IonLabel>Danh mục</IonLabel>
      </IonTabButton>

      <IonTabButton tab="tab3" href="/tab3">
        <IonIcon icon={currentPath === "/tab3" ? heartSharp : heartOutline} />
        <IonLabel>Ưa thích</IonLabel>
      </IonTabButton>

      <IonTabButton tab="tab4" href="/tab4">
        <IonIcon icon={currentPath === "/tab4" ? notificationsSharp : notificationsOutline} />
        <IonLabel>Thông báo</IonLabel>
      </IonTabButton>

      <IonTabButton tab="tab5" href="/tab5">
        <IonIcon icon={currentPath === "/tab5" ? personSharp : personOutline} />
        <IonLabel>Tài khoản</IonLabel>
      </IonTabButton>
    </IonTabBar>
  );
};

export default TabNavigation;
