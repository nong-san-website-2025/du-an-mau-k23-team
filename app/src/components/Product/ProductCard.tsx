import React from "react";
import {
  IonCard,
  IonCardContent,
  // Đã xóa IonButton ở đây để hết lỗi 1
  IonIcon,
  IonRippleEffect,
  IonText,
} from "@ionic/react";
import { cartOutline, star } from "ionicons/icons";
import { Product } from "../../types/models";
import ProductImageComp from "./ProductImage";
import { intcomma } from "../../utils/formatPrice";

const PRIMARY_COLOR = "#2E7D32"; // Xanh GreenFarm

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
  // --- SỬA LỖI 2: Chỉ định rõ kiểu trả về là string hoặc undefined (không được null) ---
  const getProductImage = (p: Product): string | undefined => {
    // Ưu tiên 1: main_image là Object (như Detail)
    if (
      p.main_image &&
      typeof p.main_image === "object" &&
      p.main_image.image
    ) {
      return p.main_image.image;
    }

    // Ưu tiên 2: main_image là String (URL trực tiếp - thường gặp ở List)
    if (p.main_image && typeof p.main_image === "string") {
      return p.main_image;
    }

    // Ưu tiên 3: Mảng images
    if (p.images && Array.isArray(p.images) && p.images.length > 0) {
      return p.images[0].image;
    }

    // Ưu tiên 4: Trường image gốc (nếu có)
    if (p.image && typeof p.image === "string") {
      return p.image;
    }

    return undefined;
  };
  // Tính phần trăm giảm giá
  const discountPercent =
    product.original_price && product.original_price > product.price
      ? Math.round(
          ((product.original_price - product.price) / product.original_price) *
            100
        )
      : 0;

  return (
    <IonCard
      button={true}
      onClick={onClick}
      className="product-card-hover"
      style={{
        margin: "0",
        width: "100%",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* 1. ẢNH SẢN PHẨM */}
      <div style={{ position: "relative", width: "100%", paddingTop: "100%" }}>
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
            src={getProductImage(product)} // Giờ hàm này an toàn rồi
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {discountPercent > 0 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              background: "#FFD600",
              color: "#D50000",
              fontWeight: "800",
              fontSize: "11px",
              padding: "2px 6px",
              borderBottomLeftRadius: "8px",
            }}
          >
            -{discountPercent}%
          </div>
        )}
      </div>

      {/* 2. NỘI DUNG */}
      <IonCardContent
        style={{
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: "500",
            color: "#333",
            lineHeight: "1.4em",
            height: "2.8em",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            marginBottom: "4px",
          }}
        >
          {product.name}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "10px",
            color: "#888",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginRight: "8px",
            }}
          >
            <IonIcon
              icon={star}
              style={{ color: "#FFC107", fontSize: "10px", marginRight: "2px" }}
            />
            <span>
              {/* Chuyển đổi chuỗi "0.0" thành số, nếu không có thì mặc định là 0 hoặc 5 tùy bạn */}
              {product.rating
                ? parseFloat(product.rating).toFixed(1)
                : product.rating_average
                ? product.rating_average.toFixed(1)
                : "0.0"}
            </span>
          </div>
          <span>Đã bán {product.sold || product.sold_count || 0}</span>
        </div>

        <div style={{ marginTop: "auto" }}></div>

        {/* 3. FOOTER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "4px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <IonText
              style={{
                color: PRIMARY_COLOR,
                fontWeight: "700",
                fontSize: "15px",
              }}
            >
              {intcomma(product.price)}₫
            </IonText>
            {discountPercent > 0 && (
              <IonText
                style={{
                  textDecoration: "line-through",
                  color: "#bbb",
                  fontSize: "10px",
                }}
              >
                {intcomma(product.original_price)}₫
              </IonText>
            )}
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              // --- SỬA LỖI 3: Viết rõ ràng if thay vì && ---
              if (onAddToCart) {
                onAddToCart(e);
              }
            }}
            style={{
              background: PRIMARY_COLOR,
              color: "#fff",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 5px rgba(46, 125, 50, 0.4)",
              cursor: "pointer",
            }}
          >
            <IonIcon icon={cartOutline} style={{ fontSize: "16px" }} />
          </div>
        </div>
      </IonCardContent>

      <IonRippleEffect type="unbounded"></IonRippleEffect>
    </IonCard>
  );
};

export default React.memo(ProductCard);
