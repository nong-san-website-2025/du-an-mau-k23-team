import React from 'react';
import { IonIcon, IonText, IonButton } from '@ionic/react';
import { refreshOutline } from 'ionicons/icons';

interface ErrorViewProps {
  onRetry: () => void;
  message?: string;
}

const ErrorView: React.FC<ErrorViewProps> = ({ onRetry, message = "Không thể tải dữ liệu." }) => {
  return (
    <div
      className="ion-text-center ion-padding"
      style={{ marginTop: "60px", display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <IonIcon
        icon={refreshOutline}
        style={{ fontSize: "64px", color: "#ccc", marginBottom: "16px" }}
      />
      <IonText color="medium">
        <p style={{ fontSize: "16px" }}>{message}</p>
      </IonText>
      <IonButton
        onClick={onRetry}
        color="dark"
        fill="outline"
        shape="round"
        size="small"
        style={{ marginTop: "16px" }}
      >
        Thử lại ngay
      </IonButton>
    </div>
  );
};

export default ErrorView;