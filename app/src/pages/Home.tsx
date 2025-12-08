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
  IonCardHeader,
  IonCardTitle,
  IonImg,
  IonText,
  IonSpinner,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/react";
import { cartOutline } from "ionicons/icons";
import { productApi } from "../api/productApi";
import { useCart } from "../context/CartContext";
import AppHeader from "../components/AppHeader";
import { useHistory } from "react-router-dom"; // 👈 thêm useHistory

interface Product {
  id: number;
  name: string;
  brand?: string;
  price: number;
  image?: string;
}

const Home: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { addToCart } = useCart();
  const history = useHistory(); // 👈 dùng để điều hướng

  const ITEMS_PER_LOAD = 10;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productApi.getAllProducts();
        console.log("Sản phẩm từ API:", data); // 🔍 kiểm tra dữ liệu

        setAllProducts(data);
        setVisibleProducts(data.slice(0, ITEMS_PER_LOAD));
        if (data.length <= ITEMS_PER_LOAD) setHasMore(false);
      } catch (err) {
        console.error(err);
        setError("Không thể tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const loadMore = async (e: CustomEvent<void>) => {
    await new Promise((resolve) => setTimeout(resolve, 700));

    const nextCount = visibleProducts.length + ITEMS_PER_LOAD;
    const nextProducts = allProducts.slice(0, nextCount);
    setVisibleProducts(nextProducts);

    if (nextProducts.length >= allProducts.length) {
      setHasMore(false);
    }

    (e.target as HTMLIonInfiniteScrollElement).complete();
  };

  const formatPriceVND = (price: string | number) => {
    const num = Number(price);
    if (isNaN(num)) return price;
    return num
      .toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      })
      .replace("₫", "")
      .trim();
  };

  return (
    <IonPage>
      <AppHeader />

      <IonContent className="ion-padding">
        {loading ? (
          <div className="ion-text-center" style={{ padding: "20px" }}>
            <IonSpinner name="crescent" />
          </div>
        ) : error ? (
          <IonText color="danger">{error}</IonText>
        ) : (
          <>
            <IonGrid>
              <IonRow>
                {visibleProducts.map((product) => (
                  <IonCol size="6" key={product.id}>
                    <IonCard
                      style={{
                        margin: "0",
                        borderRadius: "12px",
                        overflow: "hidden",
                      }}
                    >
                      {/* 👇 VÙNG ĐIỀU HƯỚNG: click vào đây → xem chi tiết */}
                      <div
                        onClick={() => history.push(`/product/${product.id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <IonImg
                          src={
                            product.image ||
                            `https://via.placeholder.com/300x200?text=${encodeURIComponent(
                              product.name
                            )}`
                          }
                          style={{ height: "150px", objectFit: "cover" }}
                          alt={product.name}
                        />
                        <IonCardHeader style={{ padding: "12px" }}>
                          <IonText
                            color="medium"
                            style={{ fontSize: "0.8rem" }}
                          >
                            {product.brand || "Thương hiệu"}
                          </IonText>
                          <IonCardTitle
                            style={{ fontSize: "1rem", fontWeight: "500" }}
                          >
                            {product.name}
                          </IonCardTitle>
                          <IonText
                            color="danger"
                            style={{ fontSize: "1.1rem", fontWeight: "bold" }}
                          >
                            {formatPriceVND(product.price)}đ
                          </IonText>
                        </IonCardHeader>
                      </div>

                      {/* 👇 NÚT "THÊM VÀO GIỎ" – NẰM NGOÀI VÙNG ĐIỀU HƯỚNG */}
                      <IonButton
                        expand="block"
                        color="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart({ ...product }, 1);
                        }}
                        style={{ margin: "0 12px 12px" }}
                      >
                        <IonIcon icon={cartOutline} slot="start" />
                        Thêm vào giỏ
                      </IonButton>
                    </IonCard>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
            <IonText color="dark">
              Dữ liệu: {JSON.stringify(visibleProducts)}
            </IonText>

            <IonInfiniteScroll
              onIonInfinite={loadMore}
              threshold="100px"
              disabled={!hasMore}
            >
              <IonInfiniteScrollContent
                loadingSpinner="dots"
                loadingText="Đang tải..."
              />
            </IonInfiniteScroll>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;
