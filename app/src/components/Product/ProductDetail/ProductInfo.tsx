import React from "react";
import { IonIcon, IonText, IonProgressBar } from "@ionic/react";
import { star, warningOutline, flame, cubeOutline, checkmarkCircle } from "ionicons/icons";
import { intcomma } from "../../../utils/formatPrice";
import { Product } from "../../../types/models"; 

interface ProductInfoProps {
  product: Product;
  reviewsCount: number;
  isPreorder: boolean;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ product, reviewsCount, isPreorder }) => {
  // Logic lấy stock: Ưu tiên inventory_qty chuẩn Model, fallback sang stock
  const stock = product.inventory_qty ?? product.stock ?? 0;
  
  // Render Badge
  const renderBadge = () => {
    if (isPreorder) {
      return (
        <div className="status-badge preorder">
          <IonIcon icon={warningOutline} style={{ marginRight: 4, verticalAlign: "text-bottom" }} />
          Hàng sắp về
        </div>
      );
    }
    return <div className="status-badge stock">Đang bán</div>;
  };

  // Render Stock Logic
  const renderStockInfo = () => {
    // Logic cho hàng đặt trước
    if (isPreorder) {
      // KHÔNG CẦN "as any" NỮA VÌ MODEL ĐÃ CÓ FIELD NÀY
      const total = product.expected_quantity || product.estimated_quantity || 100;
      const ordered = product.ordered_quantity || 0;
      const percent = total > 0 ? Math.min(ordered / total, 1) : 0;

      return (
        <div className="preorder-box" style={{ marginTop: "16px", background: "#fff8e1", padding: "12px", borderRadius: "8px", border: "1px solid #ffe082" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "14px", fontWeight: "bold", color: "#f57f17" }}>
            <span>Đã đặt trước</span>
            <span>{ordered} / {total}</span>
          </div>
          <IonProgressBar value={percent} color="warning" style={{ height: "8px", borderRadius: "4px" }} />
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Nhanh tay đặt ngay, số lượng có hạn!</div>
        </div>
      );
    }

    // Logic cho hàng có sẵn
    const isLowStock = stock <= 10;
    return (
      <div style={{ marginTop: "12px", padding: "8px 12px", background: isLowStock ? "#ffebee" : "#e8f5e9", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
        <IonIcon icon={isLowStock ? flame : cubeOutline} color={isLowStock ? "danger" : "success"} size="small" />
        <div style={{ flex: 1 }}>
          <IonText color="dark" style={{ fontSize: "13px", display: "block" }}>Tình trạng kho:</IonText>
          <IonText color={isLowStock ? "danger" : "success"} style={{ fontWeight: "bold", fontSize: "15px" }}>
            {isLowStock ? `Sắp hết! Chỉ còn ${stock}` : `Sẵn hàng (${stock})`}
          </IonText>
        </div>
        {!isLowStock && <IonIcon icon={checkmarkCircle} color="success" />}
      </div>
    );
  };

  return (
    <div className="section-card" style={{ marginTop: 0, paddingTop: "32px" }}>
      {renderBadge()}
      <h1 className="product-name-large">{product.name}</h1>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="product-price-large">
          {intcomma(product.price)} đ
          <span style={{ fontSize: "14px", color: "#888", fontWeight: "normal" }}> /{product.unit || "cái"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", color: "#fdd835" }}>
          <IonIcon icon={star} />
          <IonText color="dark" style={{ fontWeight: "bold", marginLeft: 4 }}>4.8</IonText>
          <IonText color="medium" style={{ fontSize: "12px", marginLeft: 4 }}>({reviewsCount})</IonText>
        </div>
      </div>

      {renderStockInfo()}
    </div>
  );
};

export default ProductInfo;