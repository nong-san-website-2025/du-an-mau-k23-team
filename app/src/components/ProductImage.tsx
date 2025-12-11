import React, { useState } from 'react';
import { IonImg, IonIcon, IonText } from '@ionic/react';
import { cubeOutline } from 'ionicons/icons'; // Icon Hộp và Túi

interface ProductImageProps {
  src?: string;
  alt: string;
  height?: string; // Cho phép tùy chỉnh chiều cao
}

const ProductImage: React.FC<ProductImageProps> = ({ src, alt, height = "160px" }) => {
  const [error, setError] = useState(false);

  // Logic: Nếu không có src HOẶC đã xảy ra lỗi tải ảnh -> Hiện Icon Fallback
  if (!src || error) {
    return (
      <div 
        style={{
          height: height,
          width: "100%",
          backgroundColor: "#f0f2f5", // Màu xám nhẹ sạch sẽ
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#92949c", // Màu icon xám trung tính
          borderRadius: "12px 12px 0 0", // Bo góc trên cho khớp với Card
        }}
      >
        {/* Bạn có thể đổi cubeOutline thành bagHandleOutline nếu thích hình túi */}
        <IonIcon icon={cubeOutline} style={{ fontSize: "48px", marginBottom: "8px" }} />
        
        <IonText style={{ fontSize: "0.8rem", fontWeight: "500" }}>
          Sản phẩm
        </IonText>
      </div>
    );
  }

  return (
    <IonImg
      src={src}
      alt={alt}
      onIonError={() => setError(true)} // Bắt sự kiện lỗi
      style={{
        height: height,
        width: "100%",
        objectFit: "cover",
        backgroundColor: "#f4f5f8",
      }}
    />
  );
};

export default ProductImage;