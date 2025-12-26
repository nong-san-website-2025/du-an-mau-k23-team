// src/components/Product/ProductImage.tsx
import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { leafOutline } from 'ionicons/icons'; 
import { resolveImageUrl } from '../../utils/formatPrice';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

const ProductImage: React.FC<ProductImageProps> = ({ 
  src, 
  alt, 
  className, 
  style 
}) => {
  const [error, setError] = useState(false);
  
  // Xử lý src
  const resolvedSrc = src ? resolveImageUrl(src) : null;

  // Style chung
  const finalStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover", // Đảm bảo ảnh không bị méo trong khung vuông
    display: "block",
    ...style, 
  };

  // Nếu không có src hoặc load lỗi -> Hiện Fallback
  if (!resolvedSrc || error) {
    return (
      <div 
        className={`fallback-container ${className || ''}`}
        style={{
          ...finalStyle,
          backgroundColor: "#f0f2f5",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#92949c",
        }}
      >
        <IonIcon icon={leafOutline} style={{ fontSize: "32px", opacity: 0.5 }} />
      </div>
    );
  }

  // 🔥 THAY ĐỔI QUAN TRỌNG: Dùng thẻ <img> thường thay vì IonImg
  // Lý do: Thẻ img hoạt động tốt hơn với position: absolute và object-fit
  return (
    <img
      src={resolvedSrc}
      alt={alt}
      onError={() => setError(true)}
      className={className}
      style={finalStyle}
      loading="lazy" // Vẫn giữ lazy load của trình duyệt
    />
  );
};

export default ProductImage;