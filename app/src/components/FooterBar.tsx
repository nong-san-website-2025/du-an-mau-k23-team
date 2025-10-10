import React from "react";
import { IonFooter, IonToolbar, IonTitle } from "@ionic/react";

const FooterBar: React.FC = () => {
  return (
    <IonFooter>
      <IonToolbar>
        <IonTitle size="small">© 2025 My Ionic App</IonTitle>
      </IonToolbar>
    </IonFooter>
  );
};

export default FooterBar;
