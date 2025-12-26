import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { leafOutline } from 'ionicons/icons'; 
import { resolveImageUrl } from '../../utils/formatPrice';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  // --- FIX LỖI: Thêm khai báo height và width ---
  height?: string | number;
  width?: string | number;
}

const ProductImage: React.FC<ProductImageProps> = ({ 
  src, 
  alt, 
  className, 
  style,
  height, // Lấy height từ props
  width   // Lấy width từ props
}) => {
  const [error, setError] = useState(false);
  
  // Xử lý src
  const resolvedSrc = src ? resolveImageUrl(src) : null;

  // Style chung
  const finalStyle: React.CSSProperties = {
    // Ưu tiên dùng width/height từ props truyền vào, nếu không có thì mặc định 100%
    width: width || "100%",
    height: height || "100%",
    objectFit: "cover", 
    display: "block",
    ...style, 
  };

  // Fallback khi lỗi hoặc không có ảnh
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

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      onError={() => setError(true)}
      className={className}
      style={finalStyle}
      loading="lazy"
    />
  );
};

export default ProductImage;