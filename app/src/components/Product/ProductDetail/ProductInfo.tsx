import React from "react";
import { IonIcon, IonChip, IonProgressBar, IonText } from "@ionic/react";
import { star, timeOutline, checkmarkCircle, alertCircleOutline, cubeOutline } from "ionicons/icons";
import { intcomma } from "../../../utils/formatPrice";
import { Product } from "../../../types/models"; 

interface ProductInfoProps {
  product: Product;
  reviewsCount: number;
  isPreorder: boolean;
  // Đã xóa props quantity và onQuantityChange
}

const ProductInfo: React.FC<ProductInfoProps> = ({ product, reviewsCount, isPreorder }) => {
  const stock = product.inventory_qty ?? product.stock ?? 0;
  
  // Render Pre-order bar
  const renderPreorderStatus = () => {
    const total = product.expected_quantity || product.estimated_quantity || 100;
    const ordered = product.ordered_quantity || 0;
    const percent = total > 0 ? Math.min(ordered / total, 1) : 0;

    return (
      <div className="preorder-container">
        <div className="preorder-header">
          <span className="text-orange"><IonIcon icon={timeOutline} /> Hàng đặt trước</span>
          <span className="text-xs">{ordered}/{total} đã đặt</span>
        </div>
        <IonProgressBar value={percent} className="custom-progress" />
      </div>
    );
  };

  return (
    <div className="section-card product-info-card">
      {/* 1. Giá tiền */}
      <div className="price-row">
        <span className="main-price">{intcomma(product.price)}₫</span>
        {isPreorder && <IonChip color="warning" className="mini-chip">Pre-order</IonChip>}
      </div>

      {/* 2. Tên sản phẩm */}
      <h1 className="product-name">{product.name}</h1>
      
      {/* 3. Rating & Sold */}
      <div className="meta-row">
        <div className="rating-box">
          <IonIcon icon={star} color="warning" />
          <span className="rating-num">4.8</span>
          <span className="divider">|</span>
          <span className="review-count">{reviewsCount} đánh giá</span>
        </div>
        <span className="sold-count">Đã bán {product.sold_qty || 0}</span>
      </div>

      <div className="divider-line"></div>

      {/* 4. CHỈ HIỂN THỊ SỐ LƯỢNG (TEXT) - KHÔNG CÓ NÚT BẤM */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
          {isPreorder ? (
             <div className="stock-status-text text-orange">
                <IonIcon icon={timeOutline} /> Thời gian giao hàng dự kiến: 7-10 ngày
             </div>
          ) : (
             <div className={`stock-status-text ${stock <= 10 ? 'text-red' : 'text-green'}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                <IonIcon icon={stock > 0 ? checkmarkCircle : alertCircleOutline} />
                {stock > 0 ? (
                    <span>Tình trạng: <span style={{ fontWeight: 'bold' }}>Còn {stock} sản phẩm</span></span>
                ) : (
                    <span>Tình trạng: <span style={{ fontWeight: 'bold' }}>Hết hàng</span></span>
                )}
             </div>
          )}
      </div>

      {isPreorder && renderPreorderStatus()}
    </div>
  );
};

export default ProductInfo;