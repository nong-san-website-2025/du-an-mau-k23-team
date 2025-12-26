import React from "react";
import { IonButton, IonAvatar } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { Store } from "../../../types/models";
import fallbackImageStore from "../../../assets/shop.png"; // Giả sử path

const StoreCard: React.FC<{ store: Partial<Store> }> = ({ store }) => {
  const history = useHistory();
  if (!store || !store.id) return null;

  return (
    <div className="section-card store-card-wrapper">
      <div className="store-info-row">
        <IonAvatar className="store-avatar">
            <img src={store.avatar || fallbackImageStore} alt="store" />
        </IonAvatar>
        <div className="store-meta">
          <h4 className="store-name">{store.store_name || store.name}</h4>
          <span className="store-status">Online 5 phút trước</span>
          <div className="store-location">TP. Hồ Chí Minh</div>
        </div>
        <IonButton size="small" fill="outline" color="primary" onClick={() => history.push(`/store/${store.id}`)}>
          Xem Shop
        </IonButton>
      </div>
    </div>
  );
};
export default React.memo(StoreCard);