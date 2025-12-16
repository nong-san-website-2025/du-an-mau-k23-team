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
import { useParams } from "react-router-dom";

// --- HOOKS & API ---
import { useCart } from "../../context/CartContext";
import { productApi } from "../../api/productApi";
import { reviewApi } from "../../api/reviewApi";
import AppHeader from "../../components/AppHeader";

// --- TYPES ---
// Lưu ý: Đảm bảo interface Product trong models.ts đã có field main_image
import { Product, Store } from "../../types/models";

// --- IMPORT COMPONENTS ---
import ProductHero from "./ProductDetail/ProductHero";
import ProductInfo from "./ProductDetail/ProductInfo";
import StoreCard from "./ProductDetail/StoreCard";
import ProductFooter from "./ProductDetail/ProductFooter";

import "../../styles/ProductDetail.css";

// Interface mở rộng cho chi tiết sản phẩm
interface ProductDetailData extends Product {
  ordered_quantity?: number;
  expected_quantity?: number;
  estimated_quantity?: number;
  status: string;
  stock?: number;
}

// Interface cho Item trong danh sách yêu thích
interface WishlistItem {
  id: number;
  name: string;
  image?: string | null;
  price: number;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  // --- STATE ---
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviewsCount, setReviewsCount] = useState(0);

  // --- 🔥 HÀM LẤY ẢNH (NO ANY) ---
  const getProductImage = useCallback((p: ProductDetailData | null): string | undefined => {
    if (!p) return undefined;

    // 1. Ưu tiên lấy từ main_image (đã khai báo trong interface Product)
    if (p.main_image && typeof p.main_image === 'object' && p.main_image.image) {
        return p.main_image.image;
    }
    
    // 2. Nếu không, lấy ảnh đầu tiên trong mảng images
    if (p.images && Array.isArray(p.images) && p.images.length > 0) {
      return p.images[0].image;
    }

    // 3. Cuối cùng mới check trường 'image' string
    if (typeof p.image === 'string' && p.image) {
      return p.image;
    }

    return undefined;
  }, []);
  // ------------------------------------

  // Computed Logic: Kiểm tra đặt trước hoặc hết hàng
  const isPreorder = useMemo(() => {
    if (!product) return false;
    const s = (product.status || "").toLowerCase().trim();
    // Ưu tiên inventory_qty, fallback sang stock
    const stock = product.inventory_qty ?? product.stock ?? 0;
    return s.includes("coming_soon") || s.includes("sắp") || stock <= 0;
  }, [product]);

  const stockVal = product ? (product.inventory_qty ?? product.stock ?? 0) : 0;
  const isOutOfStock = stockVal <= 0;

  // --- EFFECTS ---
  useEffect(() => {
    // Kiểm tra trạng thái yêu thích từ LocalStorage
    const checkFavorite = () => {
      try {
        const listJson = localStorage.getItem("wishlist");
        const list: WishlistItem[] = listJson ? JSON.parse(listJson) : [];
        setIsFavorite(list.some((item) => String(item.id) === String(id)));
      } catch {
        setIsFavorite(false);
      }
    };

    // Tải dữ liệu từ API
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const pid = Number(id);
        if (isNaN(pid)) throw new Error("ID không hợp lệ");

        // Gọi API song song: Lấy Product + Reviews
        const [prodData, reviewData] = await Promise.all([
          productApi.getProduct(pid),
          reviewApi.getReviews(pid).catch(() => []),
        ]);

        const detailData = prodData as ProductDetailData;

        // Chuẩn hóa dữ liệu Store (tránh lỗi readonly prop)
        if (detailData.store && typeof detailData.store === "object") {
          const s = detailData.store as Store; 
          if (!s.store_name && s.name) {
             // Clone ra object mới để gán store_name
             detailData.store = { ...s, store_name: s.name };
          }
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
        // Xóa khỏi danh sách
        list = list.filter((item) => String(item.id) !== String(product.id));
        presentToast({ message: "Đã xóa khỏi yêu thích", duration: 1500, color: "medium" });
        setIsFavorite(false);
      } else {
        // Thêm vào danh sách (Lưu URL ảnh chuẩn)
        list.push({
          id: product.id,
          name: product.name,
          image: getProductImage(product), // Dùng hàm lấy ảnh chuẩn
          price: product.price,
        });
        presentToast({ message: "Đã thích", duration: 1500, color: "success", icon: heart });
        setIsFavorite(true);
      }
      localStorage.setItem("wishlist", JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  }, [product, isFavorite, presentToast, getProductImage]);

  const handleChangeQuantity = useCallback((delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  }, []);

  const handleBuyAction = async () => {
    if (!product) return;

    if (isPreorder) {
      const maxQty = product.expected_quantity || product.estimated_quantity || 0;
      const ordered = product.ordered_quantity || 0;
      const remaining = Math.max(maxQty - ordered, 0);

      // Alert hiển thị khi hết suất
      if (remaining <= 0) return presentAlert({
        header: "Thông báo",
        message: "Sản phẩm đã hết suất đặt trước!",
        buttons: ["OK"]
      });
      
      if (quantity > remaining) return presentAlert({
        header: "Thông báo",
        message: `Chỉ còn ${remaining} suất!`,
        buttons: ["OK"]
      });
    }

    try {
      await addToCart(product, quantity);
      presentToast({
        message: isPreorder ? `Đã đặt trước ${quantity} sản phẩm!` : `Đã thêm ${quantity} vào giỏ!`,
        duration: 2000,
        color: "success",
        position: "bottom",
        icon: cartOutline,
      });
      setQuantity(1);
    } catch (err) {
      console.error(err); 
      presentToast({ message: "Lỗi thêm vào giỏ hàng", color: "danger", duration: 2000 });
    }
  };

  // --- RENDER LOADING / ERROR ---
  if (loading) {
    return (
      <IonPage>
        <AppHeader showBack />
        <IonContent className="ion-text-center ion-padding">
          <IonSpinner name="crescent" style={{ marginTop: "50px" }} />
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
          <p>{error}</p>
          <IonButton routerLink="/home" fill="outline">
            Về trang chủ
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  // --- RENDER CHÍNH ---
  return (
    <IonPage>
      <AppHeader showBack title="Chi tiết sản phẩm" showSearch={false} />

      <IonContent>
        {/* Truyền URL ảnh đã xử lý vào Hero */}
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

        {/* Kiểm tra Store tồn tại và là object */}
        {product.store && typeof product.store === 'object' && (
           <StoreCard store={product.store as Store} />
        )}

        <div className="section-card">
          <h3 style={{ fontSize: "18px", fontWeight: "bold", marginTop: 0 }}>
            Thông tin chi tiết
          </h3>
          <p className="desc-text">{product.description || "Chưa có mô tả."}</p>
        </div>

      </IonContent>

      <ProductFooter
        quantity={quantity}
        isPreorder={isPreorder}
        isOutOfStock={isOutOfStock}
        onChangeQuantity={handleChangeQuantity}
        onBuyAction={handleBuyAction}
      />
    </IonPage>
  );
};

export default ProductDetail;