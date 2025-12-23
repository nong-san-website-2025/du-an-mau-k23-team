import React from "react";
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonRippleEffect,
} from "@ionic/react";
import { cartOutline, star } from "ionicons/icons";
import { Product } from "../../types/models";
import ProductImageComp from "./ProductImage";
import { intcomma } from "../../utils/formatPrice";

// --- CẤU HÌNH MÀU SẮC (Dùng cho các phần tử nhỏ bên trong) ---
const PRIMARY_COLOR = "#2E7D32"; // Xanh GreenFarm
const SUB_TEXT_COLOR = "#888888";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  onAddToCart?: (e: React.MouseEvent) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
  onAddToCart,
}) => {
  // --- 1. FORMAT TIỀN TỆ & CON SỐ ---

  const formatSold = (num?: number) => {
    if (!num) return "0";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  // --- 2. LOGIC LẤY ẢNH AN TOÀN ---
  const getProductImage = (p: Product) => {
    if (p.main_image?.image) return p.main_image.image;
    if (p.images && Array.isArray(p.images) && p.images.length > 0) {
      return p.images[0].image;
    }
    if (typeof p.image === "string" && p.image) return p.image;
    return undefined;
  };

  const safeImageSrc = getProductImage(product);

  // --- 3. RENDER GIAO DIỆN ---
  return (
    <IonCard
      button={true}
      onClick={onClick}
      // 👇 Class này quyết định giao diện đẹp (không còn border cứng)
      className="product-card-modern"
      style={{
        margin: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "visible", // Để shadow không bị cắt
        contain: "none",
        border: 8,
      }}
    >
      {/* === PHẦN ẢNH (Tỷ lệ 1:1) === */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "100%", // Tạo khung vuông
          background: "#f5f5f5",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <ProductImageComp
            src={safeImageSrc}
            alt={product.name}
            className="product-image"
          />
        </div>

        {/* Badge Giảm Giá */}
        {product.original_price && product.original_price > product.price && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              background: "rgba(255, 212, 0, 0.95)", // Vàng tươi
              color: "#d32f2f", // Đỏ đậm
              fontSize: "11px",
              fontWeight: "800",
              padding: "3px 8px",
              borderBottomLeftRadius: "0px",
              zIndex: 10,
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
            }}
          >
            -
            {Math.round(
              ((product.original_price - product.price) /
                product.original_price) *
                100
            )}
            %
          </div>
        )}

        {/* Badge Đặt Trước */}
        {product.preorder && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              background: "#FFA000",
              color: "#fff",
              fontSize: "10px",
              fontWeight: "bold",
              padding: "4px 8px",
              borderBottomRightRadius: "8px",
              zIndex: 10,
            }}
          >
            ĐẶT TRƯỚC
          </div>
        )}
      </div>

      {/* === PHẦN NỘI DUNG === */}
      <IonCardContent className="product-card-content">
        {/* Tên sản phẩm */}
        <h3 className="product-title">{product.name}</h3>

        {/* Rating & Đã bán */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "11px",
            color: SUB_TEXT_COLOR,
            marginBottom: "8px",
          }}
        >
          <IonIcon
            icon={star}
            style={{ color: "#FBC02D", fontSize: "12px", marginRight: "3px" }}
          />
          <span>
            {product.rating_average ? product.rating_average.toFixed(1) : "5.0"}
          </span>
          <span style={{ margin: "0 6px", opacity: 0.4 }}>|</span>
          <span>Đã bán {formatSold(product.ordered_quantity)}</span>
        </div>

        {/* Spacer để đẩy giá xuống đáy */}
        <div style={{ flexGrow: 1 }}></div>

        {/* Footer: Giá & Nút Mua */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "4px",
          }}
        >
          {/* Giá tiền */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                color: PRIMARY_COLOR,
                fontWeight: "700",
                fontSize: "16px",
                lineHeight: "1",
              }}
            >
              {intcomma(product.price)}
            </span>
          </div>

          {/* Nút thêm vào giỏ */}
          <IonButton
            fill="clear"
            className="btn-add-cart"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onAddToCart) onAddToCart(e);
            }}
          >
            <IonIcon icon={cartOutline} />
          </IonButton>
        </div>
      </IonCardContent>

      <IonRippleEffect type="unbounded"></IonRippleEffect>
    </IonCard>
  );
};

// Tối ưu render bằng React.memo
export default React.memo(ProductCard, (prev, next) => {
  return (
    prev.product.id === next.product.id &&
    prev.product.price === next.product.price &&
    prev.product.ordered_quantity === next.product.ordered_quantity &&
    prev.product.rating_average === next.product.rating_average
  );
});
