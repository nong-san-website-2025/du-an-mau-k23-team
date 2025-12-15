import React from "react";
import { IonButton, IonIcon } from "@ionic/react";
import { heart, heartOutline } from "ionicons/icons";
import ProductImage from "../../../components/Product/ProductImage";

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
      <ProductImage 
        src={image || undefined} 
        alt={name} 
        height="350px" 
      />
      <IonButton
        shape="round"
        className="fav-btn-floating"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
      >
        <IonIcon icon={isFavorite ? heart : heartOutline} slot="icon-only" />
      </IonButton>
    </div>
  );
};

export default React.memo(ProductHero);