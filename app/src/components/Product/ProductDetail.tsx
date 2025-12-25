import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  IonPage,
  IonContent,
  IonSpinner,
  IonButton,
  IonIcon,
  useIonToast,
  useIonAlert,
} from "@ionic/react";
import { warningOutline, cartOutline, heart } from "ionicons/icons";
import { useParams, useHistory } from "react-router-dom"; // Thêm useHistory

// --- HOOKS & API ---
import { useCart } from "../../context/CartContext";
import { productApi } from "../../api/productApi";
import { reviewApi } from "../../api/reviewApi";
import AppHeader from "../../components/AppHeader";

// --- TYPES ---
import { Product, Store } from "../../types/models";

// --- IMPORT COMPONENTS ---
import ProductHero from "./ProductDetail/ProductHero";
import ProductInfo from "./ProductDetail/ProductInfo";
import StoreCard from "./ProductDetail/StoreCard";
import ProductFooter from "./ProductDetail/ProductFooter"; // Footer mới

import "../../styles/ProductDetail.css";

// Interface mở rộng
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
  const history = useHistory(); // Hook chuyển trang
  const { addToCart } = useCart();
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  // --- STATE ---
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // NOTE: Đã xóa state `quantity` vì footer tự quản lý trong Modal
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviewsCount, setReviewsCount] = useState(0);

  // --- 🔥 HÀM LẤY ẢNH ---
  const getProductImage = useCallback((p: ProductDetailData | null): string | undefined => {
    if (!p) return undefined;
    if (p.main_image && typeof p.main_image === 'object' && p.main_image.image) return p.main_image.image;
    if (p.images && Array.isArray(p.images) && p.images.length > 0) return p.images[0].image;
    if (typeof p.image === 'string' && p.image) return p.image;
    return undefined;
  }, []);

  // --- COMPUTED LOGIC ---
  const isPreorder = useMemo(() => {
    if (!product) return false;
    const s = (product.status || "").toLowerCase().trim();
    const stock = product.inventory_qty ?? product.stock ?? 0;
    return s.includes("coming_soon") || s.includes("sắp") || stock <= 0;
  }, [product]);

  // Tính toán tồn kho an toàn để truyền xuống Footer
  const safeStock = useMemo(() => {
     if (!product) return 0;
     return product.inventory_qty ?? product.stock ?? 0;
  }, [product]);

  const isOutOfStock = safeStock <= 0;

  // --- EFFECTS ---
  useEffect(() => {
    const checkFavorite = () => {
      try {
        const listJson = localStorage.getItem("wishlist");
        const list: WishlistItem[] = listJson ? JSON.parse(listJson) : [];
        setIsFavorite(list.some((item) => String(item.id) === String(id)));
      } catch {
        setIsFavorite(false);
      }
    };

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
        if (Array.isArray(reviewData)) setReviewsCount(reviewData.length);
        
      } catch (err: unknown) {
        let msg = "Lỗi tải trang";
        if (err instanceof Error) msg = err.message;
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    checkFavorite();
  }, [id]);

  // --- HANDLERS ---
  const handleToggleFavorite = useCallback(() => {
    if (!product) return;
    try {
      const listJson = localStorage.getItem("wishlist");
      let list: WishlistItem[] = listJson ? JSON.parse(listJson) : [];
      
      if (isFavorite) {
        list = list.filter((item) => String(item.id) !== String(product.id));
        presentToast({ message: "Đã xóa khỏi yêu thích", duration: 1500, color: "medium" });
        setIsFavorite(false);
      } else {
        list.push({
          id: product.id,
          name: product.name,
          image: getProductImage(product),
          price: product.price,
        });
        presentToast({ message: "Đã thích", duration: 1500, color: "success", icon: heart });
        setIsFavorite(true);
      }
      localStorage.setItem("wishlist", JSON.stringify(list));
    } catch (e) { console.error(e); }
  }, [product, isFavorite, presentToast, getProductImage]);

  // --- 🛒 NEW HANDLER: THÊM VÀO GIỎ TỪ MODAL ---
  const handleAddToCartFromFooter = async (qtyFromModal: number) => {
    if (!product) return;

    // Logic kiểm tra Pre-order (tái sử dụng logic cũ)
    if (isPreorder) {
      const maxQty = product.expected_quantity || product.estimated_quantity || 0;
      const ordered = product.ordered_quantity || 0;
      const remaining = Math.max(maxQty - ordered, 0);

      if (remaining <= 0) return presentAlert({
        header: "Thông báo", message: "Sản phẩm đã hết suất đặt trước!", buttons: ["OK"]
      });
      
      if (qtyFromModal > remaining) return presentAlert({
        header: "Thông báo", message: `Chỉ còn ${remaining} suất!`, buttons: ["OK"]
      });
    }

    try {
      await addToCart(product, qtyFromModal);
      presentToast({
        message: isPreorder ? `Đã đặt trước ${qtyFromModal} sản phẩm!` : `Đã thêm ${qtyFromModal} vào giỏ!`,
        duration: 2000,
        color: "success",
        position: "bottom",
        icon: cartOutline,
      });
    } catch (err) {
      console.error(err); 
      presentToast({ message: "Lỗi thêm vào giỏ hàng", color: "danger", duration: 2000 });
    }
  };

  // --- 🚀 NEW HANDLER: MUA NGAY (DIRECT CHECKOUT) ---
  const handleBuyNow = async () => {
    if (!product) return;
    
    // Mua ngay thường là số lượng 1, hoặc bạn có thể mở modal nếu muốn.
    // Ở đây mình làm luồng nhanh: Thêm 1 cái -> Chuyển sang Giỏ hàng
    try {
        await addToCart(product, 1);
        
        // Cách 1: Chuyển hướng router
        // history.push("/cart"); 
        
        // Cách 2: Switch Tab (Vì Tab Cart thường nằm trên TabBar chính)
        const cartTab = document.getElementById("tab-button-tab2"); // ID của Tab 2 (Giỏ hàng)
        if(cartTab) {
            cartTab.click();
        } else {
            // Fallback nếu không tìm thấy tab
             history.push("/cart");
        }
        
    } catch (err) {
        presentToast({ message: "Lỗi xử lý mua ngay", color: "danger" });
    }
  };

  // --- RENDER LOADING / ERROR ---
  if (loading) return (
      <IonPage><AppHeader showBack /><IonContent className="ion-text-center ion-padding"><IonSpinner name="crescent" style={{ marginTop: "50px" }} /></IonContent></IonPage>
  );

  if (error || !product) return (
      <IonPage><AppHeader showBack /><IonContent className="ion-text-center ion-padding"><IonIcon icon={warningOutline} size="large" color="warning" /><p>{error}</p><IonButton routerLink="/home" fill="outline">Về trang chủ</IonButton></IonContent></IonPage>
  );

  // --- RENDER CHÍNH ---
  return (
    <IonPage>
      <AppHeader showBack title="Chi tiết sản phẩm" showSearch={false} />

      <IonContent>
        <ProductHero
          image={getProductImage(product)} 
          name={product.name}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
        />

        <ProductInfo
          product={product}
          reviewsCount={reviewsCount}
          isPreorder={isPreorder}
        />

        {product.store && typeof product.store === 'object' && (
           <StoreCard store={product.store as Store} />
        )}

        <div className="section-card">
          <h3 style={{ fontSize: "18px", fontWeight: "bold", marginTop: 0 }}>Thông tin chi tiết</h3>
          <p className="desc-text">{product.description || "Chưa có mô tả."}</p>
        </div>
      </IonContent>

      {/* --- FOOTER MỚI --- */}
      <ProductFooter
        productImage={getProductImage(product)} // Truyền ảnh vào modal
        price={product.price}                   // Truyền giá vào modal
        stock={safeStock}                       // Tồn kho an toàn
        isPreorder={isPreorder}
        isOutOfStock={isOutOfStock}
        
        // Hứng sự kiện từ Modal
        onAddToCart={handleAddToCartFromFooter}
        
        // Hứng sự kiện Mua Ngay
        onBuyNow={handleBuyNow}
      />
    </IonPage>
  );
};

export default ProductDetail;