import React, { useState, useEffect, useMemo } from "react";
import {
  IonPage,
  IonContent,
  IonImg,
  IonButton,
  IonIcon,
  IonFooter,
  IonText,
  IonSpinner,
  IonChip,
  useIonToast,
  useIonAlert,
  IonGrid,
  IonRow,
  IonCol,
  IonProgressBar, // Import thêm thanh tiến trình
} from "@ionic/react";
import {
  cartOutline,
  heart,
  heartOutline,
  chatbubbleEllipsesOutline,
  addOutline,
  removeOutline,
  warningOutline,
  star,
  cubeOutline, // Icon hộp
  flame, // Icon lửa cho hàng sắp hết
  checkmarkCircle,
} from "ionicons/icons";
import { useParams, useHistory } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { productApi } from "../../api/productApi";
import { reviewApi } from "../../api/reviewApi";
import { intcomma } from "../../utils/formatPrice";
import AppHeader from "../../components/AppHeader";
import "../../styles/ProductDetail.css";

import fallbackImage from "../../assets/open-box.png";
import fallbackImageStore from "../../assets/shop.png";

// --- CẤU HÌNH ẢNH MẶC ĐỊNH (Hình cái thùng 3D) ---
const FALLBACK_IMAGE = fallbackImage;
const FALLBACK_IMAGE_STORE = fallbackImageStore;


// --- TYPES ---
interface Store {
  id: number;
  name: string;
  avatar?: string;
  status: string;
}

interface ProductDetailData {
  id: number;
  name: string;
  price: number;
  discounted_price?: number;
  image?: string;
  description?: string;
  status: string;
  stock: number;
  unit?: string;
  brand?: string;
  location?: string;
  store?: Store;
  ordered_quantity?: number;
  expected_quantity?: number;
  estimated_quantity?: number;
  category?: number;
  subcategory?: number;
}

interface Review {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
}

interface WishlistItem {
  id: number;
  name: string;
  image?: string;
  price: number;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { addToCart } = useCart();
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  // State
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<ProductDetailData[]>(
    []
  );

  // Computed Logic
  const isPreorder = useMemo(() => {
    if (!product) return false;
    const s = (product.status || "").toLowerCase().trim();
    return s.includes("coming_soon") || s.includes("sắp") || product.stock <= 0;
  }, [product]);

  const finalPrice = product?.discounted_price ?? product?.price ?? 0;

  // Effects
  useEffect(() => {
    const checkFavorite = () => {
      try {
        const listJson = localStorage.getItem("wishlist");
        const list: WishlistItem[] = listJson ? JSON.parse(listJson) : [];
        const fav = list.some((item) => String(item.id) === String(id));
        setIsFavorite(fav);
      } catch {
        setIsFavorite(false);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const pid = Number(id);
        if (isNaN(pid)) throw new Error("ID sản phẩm không hợp lệ");

        const [prodData, reviewData, relatedData] = await Promise.all([
          productApi.getProduct(pid),
          reviewApi.getReviews(pid).catch(() => []),
          productApi.getAllProducts().catch(() => []),
        ]);

        const detailData = prodData as unknown as ProductDetailData;

        const isProductApproved = detailData.status === "approved";
        if (!isProductApproved && !detailData.status?.includes("coming")) {
          throw new Error("Sản phẩm chưa được duyệt hoặc đã bị ẩn.");
        }

        setProduct(detailData);

        if (Array.isArray(reviewData)) {
          setReviews(reviewData);
        }

        if (Array.isArray(relatedData)) {
          const relatedList = relatedData as unknown as ProductDetailData[];
          setRelatedProducts(
            relatedList.filter((p) => p.id !== pid).slice(0, 5)
          );
        }
      } catch (err: unknown) {
        let message = "Không thể tải sản phẩm";
        if (err instanceof Error) {
          message = err.message;
        }
        console.error("Lỗi tải trang:", err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    checkFavorite();
  }, [id]);

  // Handlers
  const handleToggleFavorite = () => {
    if (!product) return;
    try {
      const listJson = localStorage.getItem("wishlist");
      let list: WishlistItem[] = listJson ? JSON.parse(listJson) : [];

      if (isFavorite) {
        list = list.filter((item) => String(item.id) !== String(product.id));
        localStorage.setItem("wishlist", JSON.stringify(list));
        setIsFavorite(false);
        presentToast({
          message: "Đã xóa khỏi yêu thích",
          duration: 1500,
          color: "medium",
        });
      } else {
        const item: WishlistItem = {
          id: product.id,
          name: product.name,
          image: product.image,
          price: finalPrice,
        };
        list.push(item);
        localStorage.setItem("wishlist", JSON.stringify(list));
        setIsFavorite(true);
        presentToast({
          message: "Đã lưu vào yêu thích",
          duration: 1500,
          color: "success",
          icon: heart,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeQuantity = (delta: number) => {
    const newVal = quantity + delta;
    if (newVal >= 1) setQuantity(newVal);
  };

  const handleBuyAction = async () => {
    if (!product) return;

    if (isPreorder) {
      const maxQty =
        product.expected_quantity || product.estimated_quantity || 0;
      const ordered = product.ordered_quantity || 0;
      const remaining = Math.max(maxQty - ordered, 0);

      if (remaining <= 0) {
        presentAlert({
          header: "Thông báo",
          message: "Sản phẩm đã hết suất đặt trước!",
          buttons: ["OK"],
        });
        return;
      }
      if (quantity > remaining) {
        presentAlert({
          header: "Cảnh báo",
          message: `Chỉ còn ${remaining} suất đặt trước!`,
          buttons: ["OK"],
        });
        return;
      }
    }

    try {
      await addToCart(product, quantity);
      presentToast({
        message: isPreorder
          ? `Đã đặt trước ${quantity} sản phẩm!`
          : `Đã thêm ${quantity} sản phẩm vào giỏ!`,
        duration: 2000,
        color: "success",
        position: "bottom",
        icon: cartOutline,
      });
      setQuantity(1);
    } catch (err: unknown) {
      console.error("Lỗi Add to Cart:", err);
      presentToast({
        message: "Lỗi thêm vào giỏ hàng",
        color: "danger",
        duration: 2000,
      });
    }
  };

  // --- Render Functions (Tách UI Stock ra cho gọn) ---
  const renderStockInfo = () => {
    if (!product) return null;

    // 1. Giao diện cho Hàng Đặt Trước (Preorder)
    if (isPreorder) {
      const total =
        product.expected_quantity || product.estimated_quantity || 100;
      const ordered = product.ordered_quantity || 0;
      const percent = Math.min(ordered / total, 1);

      return (
        <div
          style={{
            marginTop: "16px",
            background: "#fff8e1",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ffe082",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "6px",
              fontSize: "14px",
              fontWeight: "bold",
              color: "#f57f17",
            }}
          >
            <span>Đã đặt trước</span>
            <span>
              {ordered} / {total}
            </span>
          </div>
          <IonProgressBar
            value={percent}
            color="warning"
            style={{ height: "8px", borderRadius: "4px" }}
          ></IonProgressBar>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            Nhanh tay đặt ngay, số lượng có hạn!
          </div>
        </div>
      );
    }

    // 2. Giao diện cho Hàng Sẵn Có (In Stock)
    const isLowStock = product.stock <= 10;

    return (
      <div
        style={{
          marginTop: "12px",
          padding: "8px 12px",
          background: isLowStock ? "#ffebee" : "#e8f5e9", // Đỏ nhạt hoặc Xanh nhạt
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <IonIcon
          icon={isLowStock ? flame : cubeOutline}
          color={isLowStock ? "danger" : "success"}
          size="small"
        />
        <div style={{ flex: 1 }}>
          <IonText color="dark" style={{ fontSize: "13px", display: "block" }}>
            Tình trạng kho:
          </IonText>
          <IonText
            color={isLowStock ? "danger" : "success"}
            style={{ fontWeight: "bold", fontSize: "15px" }}
          >
            {isLowStock
              ? `Sắp hết! Chỉ còn ${product.stock}`
              : `Sẵn hàng (${product.stock})`}
          </IonText>
        </div>
        {/* Nếu còn nhiều hàng, hiện icon check cho uy tín */}
        {!isLowStock && <IonIcon icon={checkmarkCircle} color="success" />}
      </div>
    );
  };

  // --- Main Render ---
  if (loading) {
    return (
      <IonPage>
        <AppHeader showBack />
        <IonContent className="ion-text-center ion-padding">
          <IonSpinner name="crescent" style={{ marginTop: "50px" }} />
          <p>Đang tìm thông tin sản phẩm...</p>
        </IonContent>
      </IonPage>
    );
  }

  if (error || !product) {
    return (
      <IonPage>
        <AppHeader showBack />
        <IonContent className="ion-text-center ion-padding">
          <IonIcon icon={warningOutline} size="large" color="warning" />
          <h3>Không tìm thấy sản phẩm</h3>
          <p>{error}</p>
          <IonButton routerLink="/home" fill="outline">
            Về trang chủ
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <AppHeader showBack title="Chi tiết sản phẩm" showSearch={false} />

      <IonContent>
        {/* Hero Image - Xử lý fallback image */}
        <div className="hero-image-wrapper">
          <IonImg
            src={product.image || FALLBACK_IMAGE}
            className="hero-img"
            alt={product.name}
            // SỬA LỖI 1: Khai báo 'e' và định kiểu CustomEvent
            onIonError={(e: CustomEvent) => {
              const target = e.target as HTMLImageElement;
              target.src = FALLBACK_IMAGE;
            }}
            style={{ objectFit: "contain" }}
          />
          <IonButton
            shape="round"
            className="fav-btn-floating"
            onClick={handleToggleFavorite}
          >
            <IonIcon
              icon={isFavorite ? heart : heartOutline}
              slot="icon-only"
            />
          </IonButton>
        </div>

        {/* Main Info */}
        <div
          className="section-card"
          style={{ marginTop: "0", paddingTop: "32px" }}
        >
          {isPreorder ? (
            <div className="status-badge preorder">
              <IonIcon
                icon={warningOutline}
                style={{ marginRight: 4, verticalAlign: "text-bottom" }}
              />
              Hàng sắp về
            </div>
          ) : (
            <div className="status-badge stock">Đang bán</div>
          )}

          <h1 className="product-name-large">{product.name}</h1>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div className="product-price-large">
              {intcomma(finalPrice)} đ
              <span
                style={{
                  fontSize: "14px",
                  color: "#888",
                  fontWeight: "normal",
                }}
              >
                {" "}
                /{product.unit || "cái"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: "#fdd835",
              }}
            >
              <IonIcon icon={star} />
              <IonText
                color="dark"
                style={{ fontWeight: "bold", marginLeft: 4 }}
              >
                4.8
              </IonText>
              <IonText
                color="medium"
                style={{ fontSize: "12px", marginLeft: 4 }}
              >
                ({reviews.length})
              </IonText>
            </div>
          </div>

          {/* === HIỂN THỊ STOCK UI Ở ĐÂY === */}
          {renderStockInfo()}
        </div>

        {/* Store Info */}
        {product.store && (
          <div className="section-card">
            <div
              className="store-mini-card"
              onClick={() => history.push(`/store/${product.store?.id}`)}
            >
              <img
                src={product.store.avatar ||  FALLBACK_IMAGE_STORE}
                alt="Store"
                className="store-avatar"
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", color: "#333" }}>
                  {product.store.name}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Nhà vườn uy tín
                </div>
              </div>
              <IonButton size="small" fill="outline" shape="round">
                Xem Shop
              </IonButton>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="section-card">
          <h3 style={{ fontSize: "18px", fontWeight: "bold", marginTop: 0 }}>
            Thông tin chi tiết
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <IonChip outline color="dark">
              Thương hiệu: {product.brand || "N/A"}
            </IonChip>
            <IonChip outline color="dark">
              Vị trí: {product.location || "Toàn quốc"}
            </IonChip>
          </div>
          <IonText className="desc-text">
            {product.description || "Người bán chưa cung cấp mô tả chi tiết."}
          </IonText>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="section-card">
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginTop: 0 }}>
              Sản phẩm bà con cũng xem
            </h3>
            <div className="related-scroll">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  className="related-item"
                  onClick={() => history.push(`/product/${rel.id}`)}
                >
                  <img
                    src={rel.image || FALLBACK_IMAGE}
                    // SỬA LỖI 2: Dùng type chuẩn của React thay vì 'any'
                    onError={(
                      e: React.SyntheticEvent<HTMLImageElement, Event>
                    ) => {
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                    style={{
                      width: "140px",
                      height: "140px",
                      objectFit: "contain",
                      borderRadius: "8px",
                      border: "1px solid #f0f0f0",
                    }}
                    alt={rel.name}
                  />
                  <div
                    style={{
                      fontSize: "14px",
                      marginTop: "4px",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {rel.name}
                  </div>
                  <div style={{ color: "#d32f2f", fontWeight: "bold" }}>
                    {intcomma(rel.price)}đ
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </IonContent>

      <IonFooter>
        <div className="footer-bar">
          <IonGrid className="ion-no-padding">
            <IonRow>
              <IonCol
                size="2"
                style={{ display: "flex", alignItems: "center" }}
              >
                <IonButton
                  fill="outline"
                  color="medium"
                  className="btn-main"
                  style={{ width: "100%" }}
                >
                  <IonIcon icon={chatbubbleEllipsesOutline} slot="icon-only" />
                </IonButton>
              </IonCol>

              <IonCol
                size="4"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#f0f0f0",
                    borderRadius: "8px",
                    padding: "4px",
                  }}
                >
                  <IonIcon
                    icon={removeOutline}
                    onClick={() => handleChangeQuantity(-1)}
                    style={{ padding: "8px" }}
                  />
                  <span
                    style={{
                      fontWeight: "bold",
                      margin: "0 8px",
                      fontSize: "16px",
                    }}
                  >
                    {quantity}
                  </span>
                  <IonIcon
                    icon={addOutline}
                    onClick={() => handleChangeQuantity(1)}
                    style={{ padding: "8px" }}
                  />
                </div>
              </IonCol>

              <IonCol size="6">
                <IonButton
                  expand="block"
                  color={isPreorder ? "warning" : "primary"}
                  className="btn-main"
                  onClick={handleBuyAction}
                  // Disable nút nếu hết hàng thường (không phải preorder)
                  disabled={!isPreorder && product.stock <= 0}
                >
                  {!isPreorder && product.stock <= 0
                    ? "HẾT HÀNG"
                    : isPreorder
                    ? "ĐẶT TRƯỚC"
                    : "MUA NGAY"}
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>
      </IonFooter>
    </IonPage>
  );
};

export default ProductDetail;
