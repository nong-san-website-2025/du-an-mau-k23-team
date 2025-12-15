import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonSkeletonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonText,
  IonIcon,
  IonButton,
  useIonToast,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import { searchOutline, refreshOutline, cartOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";

// --- IMPORTS CUSTOM ---
import { productApi } from "../api/productApi";
import { useCart } from "../context/CartContext";
import AppHeader from "../components/AppHeader"; // Header chung của App
// 👇 Import Component ProductCard đã tách
import ProductCard from "../components/Product/ProductCard";
import { Product } from "../types/models"; // Lấy Product từ nguồn gốc

// --- SKELETON COMPONENT (Loading State) ---
// Giữ lại skeleton ở đây để Home tự quản lý trạng thái loading của grid
const ProductSkeleton: React.FC = () => (
  <IonCol size="6" size-md="4" size-lg="3" style={{ padding: "6px" }}>
    <IonCard
      className="ion-no-margin"
      style={{
        borderRadius: "16px",
        boxShadow: "none",
        border: "1px solid #f0f0f0",
      }}
    >
      <IonSkeletonText animated style={{ height: "0", paddingBottom: "100%", width: "100%" }} />
      <IonCardContent>
        <IonSkeletonText animated style={{ width: "80%", height: "20px", marginBottom: "8px" }} />
        <IonSkeletonText animated style={{ width: "40%", height: "24px" }} />
      </IonCardContent>
    </IonCard>
  </IonCol>
);

const Home: React.FC = () => {
  // --- STATE ---
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState(true);

  // --- HOOKS ---
  const { addToCart } = useCart();
  const history = useHistory();
  const [present] = useIonToast();

  const ITEMS_PER_LOAD = 12;

  // --- LOGIC: FETCH DATA ---
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await productApi.getAllProducts(); // API của bạn
      
      // Giả lập hoặc xử lý dữ liệu chuẩn
      setAllProducts(data);
      
      // Init view: Chỉ hiện 12 sản phẩm đầu tiên
      setDisplayedProducts(data.slice(0, ITEMS_PER_LOAD));
      if (data.length <= ITEMS_PER_LOAD) setHasMore(false);
      
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- LOGIC: SEARCH ---
  useEffect(() => {
    if (searchTerm.trim() === "") {
      // Nếu không tìm kiếm -> Reset về danh sách phân trang ban đầu
      setDisplayedProducts(allProducts.slice(0, ITEMS_PER_LOAD));
      setHasMore(allProducts.length > ITEMS_PER_LOAD);
    } else {
      // Nếu đang tìm kiếm -> Filter client-side
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerTerm) ||
          p.brand?.toLowerCase().includes(lowerTerm)
      );
      setDisplayedProducts(filtered);
      setHasMore(false); // Tắt infinite scroll khi đang search
    }
  }, [searchTerm, allProducts]);

  // --- LOGIC: INFINITE SCROLL ---
  const loadMore = (e: CustomEvent<void>) => {
    // Nếu đang search thì không load thêm
    if (searchTerm !== "") {
      (e.target as HTMLIonInfiniteScrollElement).complete();
      return;
    }

    // Giả lập delay mạng để thấy spinner quay
    setTimeout(() => {
      const currentLength = displayedProducts.length;
      const nextProducts = allProducts.slice(
        currentLength,
        currentLength + ITEMS_PER_LOAD
      );

      if (nextProducts.length > 0) {
        setDisplayedProducts([...displayedProducts, ...nextProducts]);
      } else {
        setHasMore(false);
      }
      (e.target as HTMLIonInfiniteScrollElement).complete();
    }, 500);
  };

  // --- LOGIC: ADD TO CART ---
  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Ngăn sự kiện click lan ra Card (tránh chuyển trang)
    addToCart({ ...product }, 1);

    present({
      message: `Đã thêm "${product.name}" vào giỏ!`,
      duration: 1500,
      position: "bottom",
      color: "success",
      icon: cartOutline,
      cssClass: "custom-toast", // Bạn có thể thêm class này vào global.css nếu muốn
    });
  };

  return (
    <IonPage id="home-page">
      {/* Header chung */}
      <AppHeader />

      {/* Header riêng của trang Home chứa thanh tìm kiếm */}
      <IonHeader collapse="condense" className="ion-no-border">
        <IonToolbar style={{ "--background": "#f7f9fc" }}>
          <IonSearchbar
            value={searchTerm}
            onIonInput={(e) => setSearchTerm(e.detail.value!)}
            placeholder="Tìm tên thuốc, phân bón..."
            searchIcon={searchOutline}
            className="ion-padding-horizontal custom-searchbar"
            style={{ 
                "--border-radius": "12px",
                "--box-shadow": "0 2px 8px rgba(0,0,0,0.05)"
            }}
          />
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        className="ion-padding-bottom"
        style={{ "--background": "#f7f9fc" }}
      >
        <IonGrid className="ion-no-padding ion-padding-top">
          
          {/* 1. TRẠNG THÁI LOADING */}
          {loading && (
            <IonRow className="ion-padding-horizontal">
              {[...Array(8)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </IonRow>
          )}

          {/* 2. TRẠNG THÁI LỖI */}
          {!loading && error && (
            <div
              className="ion-text-center ion-padding"
              style={{ marginTop: "60px" }}
            >
              <IonIcon
                icon={refreshOutline}
                style={{ fontSize: "64px", color: "#ccc", marginBottom: "16px" }}
              />
              <IonText color="medium">
                <p style={{ fontSize: "16px" }}>Không thể tải dữ liệu.</p>
              </IonText>
              <IonButton
                onClick={fetchProducts}
                color="dark"
                fill="outline"
                shape="round"
                size="small"
                style={{ marginTop: "16px" }}
              >
                Thử lại ngay
              </IonButton>
            </div>
          )}

          {/* 3. HIỂN THỊ DỮ LIỆU */}
          {!loading && !error && (
            <>
              {displayedProducts.length === 0 ? (
                <div className="ion-text-center ion-padding" style={{ marginTop: "40px" }}>
                  <IonText color="medium">
                    <p>Không tìm thấy sản phẩm nào phù hợp.</p>
                  </IonText>
                </div>
              ) : (
                <IonRow className="ion-padding-horizontal">
                  {displayedProducts.map((product) => (
                    <IonCol 
                      size="6" 
                      size-md="4" 
                      size-lg="3" 
                      key={product.id} 
                      style={{ padding: "6px" }}
                    >
                      {/* --- SỬ DỤNG COMPONENT ĐÃ TÁCH --- */}
                      <ProductCard
                        product={product}
                        onClick={() => history.push(`/product/${product.id}`)}
                        onAddToCart={(e) => handleAddToCart(e, product)}
                      />
                    </IonCol>
                  ))}
                </IonRow>
              )}
            </>
          )}
        </IonGrid>

        {/* INFINITE SCROLL */}
        <IonInfiniteScroll
          onIonInfinite={loadMore}
          threshold="100px"
          disabled={!hasMore}
        >
          <IonInfiniteScrollContent
            loadingSpinner="bubbles"
            loadingText="Đang tải thêm sản phẩm..."
          />
        </IonInfiniteScroll>
      </IonContent>
    </IonPage>
  );
};

export default Home;