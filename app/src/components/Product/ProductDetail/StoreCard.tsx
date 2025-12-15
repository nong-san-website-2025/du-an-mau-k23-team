import React from "react";
import { IonButton } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { resolveImageUrl } from "../../../utils/formatPrice";
import fallbackImageStore from "../../../assets/shop.png";
import { Store } from "../../../types/models";

const FALLBACK_IMAGE_STORE = fallbackImageStore;

interface StoreCardProps {
  // Dùng Partial<Store> để cho phép object thiếu vài field
  store: Partial<Store>; 
}

const StoreCard: React.FC<StoreCardProps> = ({ store }) => {
  const history = useHistory();

  // Kiểm tra id
  if (!store || !store.id) return null;

  // Logic fallback tên
  const displayName = store.store_name || store.name || "Cửa hàng";
  
  // Logic fallback ảnh:
  // Thêm "|| undefined" ở cuối để chuyển null thành undefined -> fix lỗi TS
  const rawImage = store.avatar || store.image || undefined;
  const displayAvatar = resolveImageUrl(rawImage) || FALLBACK_IMAGE_STORE;

  return (
    <div className="section-card">
      <div className="store-mini-card" onClick={() => history.push(`/store/${store.id}`)}>
        <img
          src={displayAvatar}
          alt={displayName}
          className="store-avatar"
          onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE_STORE; }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "bold", color: "#333" }}>{displayName}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>Nhà vườn uy tín</div>
        </div>
        <IonButton size="small" fill="outline" shape="round">Xem Shop</IonButton>
      </div>
    </div>
  );
};

export default React.memo(StoreCard);