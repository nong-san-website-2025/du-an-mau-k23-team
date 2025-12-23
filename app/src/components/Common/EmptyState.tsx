import React from 'react';
import { IonText, IonIcon } from '@ionic/react';
import { searchOutline } from 'ionicons/icons'; // Hoặc icon nào bạn thích

interface EmptyStateProps {
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message = "Không tìm thấy dữ liệu." }) => {
  return (
    <div
      className="ion-text-center ion-padding"
      style={{ marginTop: "40px" }}
    >
      <IonIcon 
        icon={searchOutline} 
        style={{ fontSize: "48px", color: "#e0e0e0", marginBottom: "10px" }} 
      />
      <IonText color="medium">
        <p>{message}</p>
      </IonText>
    </div>
  );
};

export default EmptyState;