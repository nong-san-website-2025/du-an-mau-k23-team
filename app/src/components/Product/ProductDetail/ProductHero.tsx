import React from "react";
import { IonButton, IonIcon } from "@ionic/react";
import { heart, heartOutline } from "ionicons/icons";
import ProductImage from "../../../components/Product/ProductImage";
import "../../../styles/ProductDetail.css"; // Đảm bảo đã import CSS

interface ProductHeroProps {
  image?: string | null;
  name: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const ProductHero: React.FC<ProductHeroProps> = ({
  image,
  name,
  isFavorite,
  onToggleFavorite,
}) => {
  return (
    <div className="hero-image-wrapper">
      {/* Ảnh sản phẩm */}
      <ProductImage 
        src={image || undefined} 
        alt={name} 
        height="350px" 
      />

      {/* Nút tim nổi */}
      <IonButton
        shape="round"
        className="fav-btn-floating"
        onClick={(e) => {
          e.stopPropagation(); // Chặn sự kiện click lan ra ngoài
          onToggleFavorite();
        }}
      >
        <IonIcon 
            icon={isFavorite ? heart : heartOutline} 
            slot="icon-only" 
            style={{ 
                color: isFavorite ? "#ff3b30" : "#666", // Đỏ khi thích, Xám khi chưa
                fontSize: "24px"
            }}
        />
      </IonButton>
    </div>
  );
};

export default React.memo(ProductHero);