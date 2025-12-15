import React, { useState } from 'react';
import { IonImg, IonIcon } from '@ionic/react';
import { leafOutline } from 'ionicons/icons'; // Đổi icon cho hợp theme
import { resolveImageUrl } from '../../utils/formatPrice';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string; // Thêm cái này để dễ chỉnh CSS từ cha
  height?: string; // Chiều cao có thể tùy chỉnh nếu cần
}

const ProductImage: React.FC<ProductImageProps> = ({ src, alt, className }) => {
  const [error, setError] = useState(false);
  const resolvedSrc = resolveImageUrl(src);

  // Style chung cho cả ảnh và fallback để đảm bảo full khung cha
  const commonStyle: React.CSSProperties = {
    width: "100%",
    height: "100%", // Quan trọng: Luôn full chiều cao của khung chứa
    objectFit: "cover",
    display: "block" // Tránh khoảng trắng thừa dưới ảnh
  };

  if (!resolvedSrc || error) {
    return (
      <div 
        className={`fallback-container ${className || ''}`}
        style={{
          ...commonStyle,
          backgroundColor: "#f0f2f5",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#92949c",
        }}
      >
        {/* Dùng icon lá cây cho GreenFarm */}
        <IonIcon icon={leafOutline} style={{ fontSize: "40px", opacity: 0.6 }} />
      </div>
    );
  }

  return (
    <IonImg
      src={resolvedSrc}
      alt={alt}
      
      onIonError={() => setError(true)}
      className={className}
      style={commonStyle}
    />
  );
};

export default ProductImage;