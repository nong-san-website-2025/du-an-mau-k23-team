import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  IonPage,
  IonContent,
  IonSpinner,
  IonButton,
  useIonToast,
  useIonAlert,
} from "@ionic/react";
import { cartOutline, heartOutline } from "ionicons/icons";
import { useParams, useHistory } from "react-router-dom";

// --- HOOKS & CONTEXT ---
import { useCart } from "../../context/CartContext";
// Giả định bạn có AuthContext, nếu chưa hãy import hook lấy user của bạn vào đây
import { useAuth } from "../../context/AuthContext"; 
import { productApi } from "../../api/productApi";
import { reviewApi } from "../../api/reviewApi";
import AppHeader from "../../components/AppHeader";
import { Product, Store } from "../../types/models";

// --- COMPONENTS ---
import ProductHero from "./ProductDetail/ProductHero";
import ProductInfo from "./ProductDetail/ProductInfo";
import StoreCard from "./ProductDetail/StoreCard";
import ProductFooter from "./ProductDetail/ProductFooter";
import ServiceGuarantees from "./ProductDetail/ServiceGuarantees";
// 👇 IMPORT COMPONENT REVIEW MỚI (Giả sử bạn lưu file này là ReviewsSection.tsx)
import ReviewsSection, { ReviewData } from "./ProductDetail/ProductReviews";

import "../../styles/ProductDetail.css";

// --- INTERFACES ---
interface ProductDetailData extends Product {
  ordered_quantity?: number;
  expected_quantity?: number;
  estimated_quantity?: number;
  status: string;
  stock?: number;
}
interface WishlistItem {
  id: number;
  name: string;
  image?: string | null;
  price: number;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { addToCart } = useCart();
  
  // Lấy thông tin user (để biết review nào là của mình)
  // Nếu bạn chưa có useAuth, có thể tạm thay bằng: const user = JSON.parse(localStorage.getItem('user') || 'null');
  const { user } = useAuth(); 

  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  // --- STATE ---
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // 👇 THAY ĐỔI: Lưu mảng reviews thay vì chỉ đếm số lượng
  const [reviews, setReviews] = useState<ReviewData[]>([]);

  // --- HELPER LẤY ẢNH ---
  const getProductImage = useCallback((p: ProductDetailData | null): string | undefined => {
    if (!p) return undefined;
    if (p.main_image && typeof p.main_image === 'object' && p.main_image.image) return p.main_image.image;
    if (p.images && Array.isArray(p.images) && p.images.length > 0) return p.images[0].image;
    return typeof p.image === 'string' ? p.image : undefined;
  }, []);

  // --- COMPUTED LOGIC ---
  const isPreorder = useMemo(() => {
    if (!product) return false;
    const s = (product.status || "").toLowerCase().trim();
    const stock = product.inventory_qty ?? product.stock ?? 0;
    return s.includes("coming_soon") || s.includes("sắp") || stock <= 0;
  }, [product]);

  const safeStock = useMemo(() => {
     if (!product) return 0;
     return product.inventory_qty ?? product.stock ?? 0;
  }, [product]);

  const isOutOfStock = safeStock <= 0;

  // 👇 LOGIC TÌM REVIEW CỦA TÔI
  const myReview = useMemo(() => {
    if (!user || !reviews.length) return null;
    // Giả sử API trả về user_id hoặc username để so sánh
    // Cần đảm bảo logic so sánh đúng với dữ liệu backend của bạn (id vs id hoặc username vs username)
    return reviews.find(r => String(r.id) === String(user.id) || r.user_name === user.username) || null;
  }, [reviews, user]);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const pid = Number(id);
        if (isNaN(pid)) throw new Error("ID không hợp lệ");
        
        const [prodData, reviewData] = await Promise.all([
          productApi.getProduct(pid),
          reviewApi.getReviews(pid).catch(() => []),
        ]);
        
        const detailData = prodData as ProductDetailData;
        
        if (detailData.store && typeof detailData.store === "object") {
          const s = detailData.store as Store; 
          if (!s.store_name && s.name) detailData.store = { ...s, store_name: s.name };
        }
        
        setProduct(detailData);

        // 👇 CẬP NHẬT: Lưu danh sách reviews
        if (Array.isArray(reviewData)) {
            setReviews(reviewData as ReviewData[]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Lỗi tải trang");
      } finally { setLoading(false); }
    };
    
    try {
        const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
        setIsFavorite(list.some((item: WishlistItem) => String(item.id) === String(id)));
    } catch {}

    fetchData();
  }, [id]);

  // --- HANDLERS (Giữ nguyên) ---
  const handleToggleFavorite = () => {
    if (!product) return;
    const listJson = localStorage.getItem("wishlist");
    let list: WishlistItem[] = listJson ? JSON.parse(listJson) : [];
    
    if (isFavorite) {
      list = list.filter((item) => String(item.id) !== String(product.id));
      presentToast({ message: "Đã bỏ thích", duration: 1000, color: "medium" });
      setIsFavorite(false);
    } else {
      list.push({ id: product.id, name: product.name, image: getProductImage(product), price: product.price });
      presentToast({ message: "Đã thích", duration: 1000, color: "success", icon: heartOutline });
      setIsFavorite(true);
    }
    localStorage.setItem("wishlist", JSON.stringify(list));
  };

  const handleAddToCartFromFooter = async (qty: number) => {
    if (!product) return;
    if (isPreorder) {
        const maxQty = product.expected_quantity || 0;
        const ordered = product.ordered_quantity || 0;
        const remaining = Math.max(maxQty - ordered, 0);
        
        if (remaining <= 0) return presentAlert({ header: "Hết hàng", message: "Đã hết suất đặt trước!", buttons: ["OK"]});
        if (qty > remaining) return presentAlert({ header: "Thông báo", message: `Chỉ còn ${remaining} suất!`, buttons: ["OK"]});
    }
    try {
      await addToCart(product, qty);
      presentToast({
          message: `Đã thêm ${qty} sản phẩm vào giỏ!`,
          duration: 2000, color: "success", position: "bottom", icon: cartOutline
      });
    } catch (err) {
      presentToast({ message: "Lỗi thêm giỏ hàng", color: "danger" });
    }
  };

  const handleBuyNow = async () => {
      if (!product) return;
      try {
          await addToCart(product, 1);
          history.push("/cart");
      } catch (e) {
          presentToast({ message: "Lỗi xử lý mua ngay", color: "danger" });
      }
  };

  if (loading) return <IonPage><AppHeader showBack /><IonContent className="ion-text-center ion-padding"><IonSpinner style={{marginTop: 40}} color="primary"/></IonContent></IonPage>;
  if (error || !product) return <IonPage><AppHeader showBack /><IonContent className="ion-text-center ion-padding"><p>{error}</p><IonButton routerLink="/home">Về trang chủ</IonButton></IonContent></IonPage>;

  return (
    <IonPage id="product-detail-page">
      <AppHeader showBack title="Chi tiết sản phẩm" showSearch={true} />

      <IonContent fullscreen className="product-content">
        <ProductHero
          image={getProductImage(product)} 
          name={product.name}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
        />

        <ProductInfo
          product={product}
          reviewsCount={reviews.length} // 👇 Lấy độ dài mảng reviews
          isPreorder={isPreorder}
        />

        <ServiceGuarantees />

        {product.store && typeof product.store === 'object' && (
           <StoreCard store={product.store as Store} />
        )}

        <div className="section-card detail-section">
          <h3 className="section-title">Mô tả sản phẩm</h3>
          <p className="desc-text">{product.description || "Chưa có mô tả chi tiết."}</p>
        </div>

        {/* 👇 CHÈN COMPONENT REVIEWS MỚI VÀO ĐÂY */}
        <ReviewsSection 
            user={user} 
            reviews={reviews} 
            myReview={myReview} 
        />
        
        <div style={{ height: "100px" }}></div>
      </IonContent>

      <ProductFooter
        productImage={getProductImage(product)}
        price={product.price}
        stock={safeStock}
        isPreorder={isPreorder}
        isOutOfStock={isOutOfStock}
        onAddToCart={handleAddToCartFromFooter}
        onBuyNow={handleBuyNow}
      />
    </IonPage>
  );
};

export default ProductDetail;