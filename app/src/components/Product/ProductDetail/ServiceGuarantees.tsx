import React from "react";
import { IonIcon } from "@ionic/react";
import { shieldCheckmarkOutline, returnUpBackOutline, carSportOutline } from "ionicons/icons";

const ServiceGuarantees: React.FC = () => {
  return (
    <div className="service-guarantees">
      <div className="service-item">
        <IonIcon icon={returnUpBackOutline} color="primary" />
        <span>7 ngày đổi trả</span>
      </div>
      <div className="service-item">
        <IonIcon icon={shieldCheckmarkOutline} color="primary" />
        <span>100% Chính hãng</span>
      </div>
      <div className="service-item">
        <IonIcon icon={carSportOutline} color="primary" />
        <span>Giao siêu tốc</span>
      </div>
    </div>
  );
};

export default ServiceGuarantees;