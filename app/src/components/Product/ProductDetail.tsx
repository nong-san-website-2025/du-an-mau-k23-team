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
import { useParams } from "react-router-dom"; // Bỏ useHistory nếu không dùng

// --- HOOKS & API ---
import { useCart } from "../../context/CartContext";
import { productApi } from "../../api/productApi";
import { reviewApi } from "../../api/reviewApi";
import AppHeader from "../../components/AppHeader";

// --- TYPES ---
import { Product, Store } from "../../types/models"; // Import thêm Store

// --- IMPORT COMPONENTS ---
import ProductHero from "./ProductDetail/ProductHero";
import ProductInfo from "./ProductDetail/ProductInfo";
import StoreCard from "./ProductDetail/StoreCard";
import ProductFooter from "./ProductDetail/ProductFooter";

import "../../styles/ProductDetail.css";

// Interface mở rộng
interface ProductDetailData extends Product {
  ordered_quantity?: number;
  expected_quantity?: number;
  estimated_quantity?: number;
  status: string;
  // Bổ sung các field có thể thiếu trong Product gốc
  stock?: number; 
}

// Interface cho Wishlist Item (để tránh any)
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

  // State
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviewsCount, setReviewsCount] = useState(0);
  // const [relatedProducts, setRelatedProducts] = useState<Product[]>([]); // Tạm ẩn nếu chưa dùng

  // Computed Logic
  const isPreorder = useMemo(() => {
    if (!product) return false;
    const s = (product.status || "").toLowerCase().trim();
    // Ưu tiên inventory_qty, fallback sang stock
    const stock = product.inventory_qty ?? product.stock ?? 0;
    return s.includes("coming_soon") || s.includes("sắp") || stock <= 0;
  }, [product]);

  const stockVal = product ? (product.inventory_qty ?? product.stock ?? 0) : 0;
  const isOutOfStock = stockVal <= 0;

  // Effects
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

        // Gọi API song song
        const [prodData, reviewData] = await Promise.all([
          productApi.getProduct(pid),
          reviewApi.getReviews(pid).catch(() => []),
          // productApi.getAllProducts().catch(() => []), // Tạm ẩn related
        ]);

        // Ép kiểu an toàn
        const detailData = prodData as ProductDetailData;

        // Logic fix store name
        if (detailData.store && typeof detailData.store === "object") {
          const s = detailData.store as Store; // Ép kiểu về Store
          if (!s.store_name && s.name) {
             // TypeScript không cho sửa trực tiếp prop readonly, nên clone ra
             detailData.store = { ...s, store_name: s.name };
          }
        }

        setProduct(detailData);
        if (Array.isArray(reviewData)) setReviewsCount(reviewData.length);
        
        // if (Array.isArray(relatedData)) {
        //   setRelatedProducts(relatedData.filter((p) => p.id !== pid).slice(0, 5));
        // }

      } catch (err: unknown) {
        // Xử lý lỗi unknown chuẩn TypeScript
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

  // Handlers
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
          image: product.image,
          price: product.price,
        });
        presentToast({ message: "Đã thích", duration: 1500, color: "success", icon: heart });
        setIsFavorite(true);
      }
      localStorage.setItem("wishlist", JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  }, [product, isFavorite, presentToast]);

  const handleChangeQuantity = useCallback((delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  }, []);

  const handleBuyAction = async () => {
    if (!product) return;

    if (isPreorder) {
      const maxQty = product.expected_quantity || product.estimated_quantity || 0;
      const ordered = product.ordered_quantity || 0;
      const remaining = Math.max(maxQty - ordered, 0);

      // Sửa lỗi AlertButton: Truyền object thay vì string
      if (remaining <= 0) return presentAlert("Sản phẩm đã hết suất đặt trước!", [{ text: "OK" }]);
      if (quantity > remaining) return presentAlert(`Chỉ còn ${remaining} suất!`, [{ text: "OK" }]);
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
      // Biến err chưa dùng -> bỏ qua hoặc log
      console.error(err); 
      presentToast({ message: "Lỗi thêm vào giỏ hàng", color: "danger", duration: 2000 });
    }
  };

  // Render Loading/Error
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

  return (
    <IonPage>
      <AppHeader showBack title="Chi tiết sản phẩm" showSearch={false} />

      <IonContent>
        {/* 1. HERO IMAGE */}
        <ProductHero
          image={product.image}
          name={product.name}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* 2. MAIN INFO */}
        <ProductInfo
          product={product}
          reviewsCount={reviewsCount}
          isPreorder={isPreorder}
        />

        {/* 3. STORE INFO */}
        {/* Chỉ render nếu store là object hợp lệ để tránh lỗi Type */}
        {product.store && typeof product.store === 'object' && (
           <StoreCard store={product.store as Store} />
        )}

        {/* 4. DESCRIPTION */}
        <div className="section-card">
          <h3 style={{ fontSize: "18px", fontWeight: "bold", marginTop: 0 }}>
            Thông tin chi tiết
          </h3>
          <p className="desc-text">{product.description || "Chưa có mô tả."}</p>
        </div>

      </IonContent>

      {/* 6. FOOTER ACTION */}
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