// src/components/Product/ProductImage.tsx
import React, { useState } from 'react';
import { IonImg, IonIcon } from '@ionic/react';
import { leafOutline } from 'ionicons/icons'; 
import { resolveImageUrl } from '../../utils/formatPrice';

interface ProductImageProps {
  src?: string | null; // 👇 Cho phép nhận null để linh hoạt hơn (dù ProductCard đã chặn rồi)
  alt: string;
  className?: string;
  height?: string;
  style?: React.CSSProperties; // 👇 QUAN TRỌNG: Phải thêm dòng này để nhận style từ cha
}

const ProductImage: React.FC<ProductImageProps> = ({ 
  src, 
  alt, 
  className, 
  style // 👇 Nhận prop style
}) => {
  const [error, setError] = useState(false);
  
  // Xử lý src: Nếu là null/undefined hoặc chuỗi rỗng thì coi như lỗi luôn
  const resolvedSrc = src ? resolveImageUrl(src) : null;

  // Merge style mặc định với style được truyền vào
  const finalStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    ...style, // Ưu tiên style từ cha truyền xuống
  };

  // Logic hiển thị fallback (khi không có ảnh hoặc load lỗi)
  if (!resolvedSrc || error) {
    return (
      <div 
        className={`fallback-container ${className || ''}`}
        style={{
          ...finalStyle, // Vẫn giữ kích thước quy định
          backgroundColor: "#f0f2f5",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#92949c",
        }}
      >
        {/* Fallback Icon */}
        <IonIcon icon={leafOutline} style={{ fontSize: "32px", opacity: 0.5 }} />
      </div>
    );
  }

  return (
    <IonImg
      src={resolvedSrc}
      alt={alt}
      onIonError={() => setError(true)}
      className={className}
      style={finalStyle}
    />
  );
};

export default ProductImage;