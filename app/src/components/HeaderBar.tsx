import React from "react";
import { IonHeader, IonToolbar, IonTitle } from "@ionic/react";

interface HeaderBarProps {
  title: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ title }) => {
  return (
    <IonHeader style={{
  }}>
      <IonToolbar>
        <IonTitle>{title}</IonTitle>
      </IonToolbar>
    </IonHeader>
  );
};

export default HeaderBar;
