import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonButton,
  IonIcon,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSearchbar,
  IonSkeletonText,
  IonHeader,
  IonToolbar,
  useIonToast,
  IonBadge,
} from "@ionic/react";
import { cartOutline, searchOutline, refreshOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { productApi } from "../api/productApi";
import { useCart } from "../context/CartContext";
import AppHeader from "../components/AppHeader"; // Giả sử bạn đã có component này
import ProductImage from "../components/ProductImage";
import { intcomma } from "../utils/formatPrice";

// --- TYPE DEFINITIONS ---
interface Product {
  id: number;
  name: string;
  brand?: string;
  price: number;
  image?: string;
  unit?: string; // Ví dụ: bao, chai, gói
}

// 1. Skeleton Component: Hiển thị khi đang tải
const ProductSkeleton: React.FC = () => (
  <IonCol size="6" size-md="4" size-lg="3">
    <IonCard
      className="ion-no-margin"
      style={{
        borderRadius: "12px",
        boxShadow: "none",
        border: "1px solid #f0f0f0",
      }}
    >
      <IonSkeletonText animated style={{ height: "150px", width: "100%" }} />
      <IonCardContent>
        <IonSkeletonText animated style={{ width: "60%", height: "20px" }} />
        <IonSkeletonText
          animated
          style={{ width: "40%", height: "20px", marginTop: "10px" }}
        />
        <IonSkeletonText
          animated
          style={{
            width: "100%",
            height: "40px",
            marginTop: "15px",
            borderRadius: "8px",
          }}
        />
      </IonCardContent>
    </IonCard>
  </IonCol>
);

// 2. Product Card Component: Card sản phẩm hoàn chỉnh
interface ProductCardProps {
  product: Product;
  onClick: () => void;
  onAddToCart: (e: React.MouseEvent) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
  onAddToCart,
}) => (
  <IonCol size="6" size-md="4" size-lg="3" style={{ padding: "6px" }}>
    <IonCard
      button={true}
      onClick={onClick}
      className="ion-activatable ripple-parent"
      style={{
        margin: "0",
        borderRadius: "16px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)", // Bóng nhẹ, hiện đại
      }}
    >
      {/* Vùng hình ảnh */}
      <div style={{ position: "relative" }}>
        <ProductImage src={product.image} alt={product.name} height="160px" />

        {/* Badge thương hiệu (giữ nguyên) */}
        {product.brand && (
          <IonBadge
            color="light"
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              opacity: 0.9,
            }}
          >
            {product.brand}
          </IonBadge>
        )}
      </div>

      {/* Vùng thông tin */}
      <div
        style={{
          padding: "12px",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <IonText color="dark">
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "600",
              margin: "0 0 4px",
              display: "-webkit-box",
              WebkitLineClamp: 2, // Giới hạn 2 dòng tên cho gọn
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.name}
          </h3>
        </IonText>

        <div style={{ marginTop: "auto", paddingTop: "8px" }}>
          <IonText style={{ color: "#4caf50" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0 }}>
              {intcomma(product.price)}
              <span style={{ textDecoration: "underline", paddingLeft: 6 }}>đ</span>
            </h2>
          </IonText>
          {product.unit && (
            <IonText color="medium" style={{ fontSize: "0.8rem" }}>
              /{product.unit}
            </IonText>
          )}
        </div>
      </div>

      {/* Nút Mua Hàng To Rõ */}
      <div style={{ padding: "0 8px 12px" }}>
        <IonButton
          expand="block"
          color="success"
          shape="round" // Bo tròn mềm mại
          strong={true}
          onClick={onAddToCart}
          style={{ height: "45px", "--box-shadow": "none" }} // Tăng chiều cao để dễ bấm
        >
          <IonIcon icon={cartOutline} slot="start" />
          Chọn Mua
        </IonButton>
      </div>
    </IonCard>
  </IonCol>
);

// --- MAIN PAGE ---
const Home: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState(true);

  const { addToCart } = useCart();
  const history = useHistory();
  const [present] = useIonToast();

  const ITEMS_PER_LOAD = 12; // Số chẵn chia hết cho 2 (cột) đẹp hơn

  // Hàm tải dữ liệu
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await productApi.getAllProducts();
      setAllProducts(data);
      // Init view
      setDisplayedProducts(data.slice(0, ITEMS_PER_LOAD));
      if (data.length <= ITEMS_PER_LOAD) setHasMore(false);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Xử lý tìm kiếm (Client-side filtering cho mượt)
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setDisplayedProducts(allProducts.slice(0, ITEMS_PER_LOAD));
      setHasMore(allProducts.length > ITEMS_PER_LOAD);
    } else {
      const filtered = allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setDisplayedProducts(filtered);
      setHasMore(false); // Khi search thì hiện hết, tắt infinite scroll tạm thời
    }
  }, [searchTerm, allProducts]);

  // Infinite Scroll Logic
  const loadMore = (e: CustomEvent<void>) => {
    if (searchTerm !== "") {
      (e.target as HTMLIonInfiniteScrollElement).complete();
      return;
    }

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

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Chặn click vào card
    addToCart({ ...product }, 1);

    // Toast phản hồi thân thiện
    present({
      message: `Đã thêm "${product.name}" vào giỏ!`,
      duration: 1500,
      position: "bottom",
      color: "success",
      icon: cartOutline,
    });
  };

  return (
    <IonPage id="home-page">
      <AppHeader />

      {/* Thanh tìm kiếm dính (Sticky) */}
      <IonHeader collapse="condense" className="ion-no-border">
        <IonToolbar>
          <IonSearchbar
            value={searchTerm}
            onIonInput={(e) => setSearchTerm(e.detail.value!)}
            placeholder="Tìm tên thuốc, phân bón..."
            searchIcon={searchOutline}
            className="ion-padding-horizontal"
            style={{ "--border-radius": "20px" }}
          />
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        className="ion-padding-bottom"
        style={{ "--background": "#f7f9fc" }}
      >
        {" "}
        {/* Màu nền nhẹ dịu mắt */}
        {/* Refresh kéo xuống để tải lại */}
        <div className="ion-padding-horizontal">
          {/* Nếu cần Refresher thì thêm IonRefresher vào đây */}
        </div>
        <IonGrid className="ion-no-padding ion-padding-top">
          {/* TRẠNG THÁI LOADING: Hiện khung xương */}
          {loading && (
            <IonRow className="ion-padding-horizontal">
              {[...Array(6)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </IonRow>
          )}

          {/* TRẠNG THÁI LỖI: Nút thử lại */}
          {!loading && error && (
            <div
              className="ion-text-center ion-padding"
              style={{ marginTop: "50px" }}
            >
              <IonIcon
                icon={refreshOutline}
                style={{ fontSize: "64px", color: "#ccc" }}
              />
              <IonText color="medium">
                <p>Mạng chập chờn hoặc có lỗi xảy ra.</p>
              </IonText>
              <IonButton
                onClick={fetchProducts}
                color="dark"
                fill="outline"
                shape="round"
              >
                Thử tải lại
              </IonButton>
            </div>
          )}

          {/* TRẠNG THÁI CÓ DỮ LIỆU */}
          {!loading && !error && (
            <>
              {displayedProducts.length === 0 ? (
                <div className="ion-text-center ion-padding">
                  <IonText color="medium">
                    <p>Không tìm thấy sản phẩm nào.</p>
                  </IonText>
                </div>
              ) : (
                <IonRow className="ion-padding-horizontal">
                  {displayedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => history.push(`/product/${product.id}`)}
                      onAddToCart={(e) => handleAddToCart(e, product)}
                    />
                  ))}
                </IonRow>
              )}
            </>
          )}
        </IonGrid>
        <IonInfiniteScroll
          onIonInfinite={loadMore}
          threshold="100px"
          disabled={!hasMore}
        >
          <IonInfiniteScrollContent
            loadingSpinner="dots"
            loadingText="Đang tải thêm sản phẩm..."
          />
        </IonInfiniteScroll>
      </IonContent>
    </IonPage>
  );
};

export default Home;
