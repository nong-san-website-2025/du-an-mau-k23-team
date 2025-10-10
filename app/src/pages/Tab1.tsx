import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonSearchbar,
  IonButtons,
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
import { chatbubbleOutline, cartOutline } from "ionicons/icons";
import { productApi } from "../api/productApi";
import { useCart } from "../context/CartContext";

interface Product {
  id: number;
  name: string;
  brand?: string;
  price: number;
  image?: string;
}

const Tab1: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { addToCart, cartItemCount } = useCart();

  const ITEMS_PER_LOAD = 10; // 👈 số sản phẩm load mỗi lần

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productApi.getAllProducts();

        if (!Array.isArray(data)) {
          throw new Error("API không trả về danh sách sản phẩm hợp lệ");
        }

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

  // Khi cuộn xuống gần cuối => load thêm 10 sản phẩm nữa
  const loadMore = async (e: CustomEvent<void>) => {
    await new Promise((resolve) => setTimeout(resolve, 700)); // delay nhẹ cho UX

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
      <IonHeader>
        <IonToolbar style={{ "--background": "#4caf50" }}>
          <IonSearchbar placeholder="Search" showClearButton="focus" />
          <IonButtons slot="end">
            <IonButton>
              <IonIcon icon={chatbubbleOutline} color="light" size="large" />
            </IonButton>
            <IonButton routerLink="/cart" style={{ position: "relative" }}>
              <IonIcon icon={cartOutline} color="light" size="large" />
              {cartItemCount > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "red",
                    color: "white",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    fontSize: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                  }}
                >
                  {cartItemCount > 9 ? "9+" : cartItemCount}
                </div>
              )}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

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
                        <IonText color="medium" style={{ fontSize: "0.8rem" }}>
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
                        <IonButton
                          expand="block"
                          color="success"
                          onClick={() => {
                            // 👇 Loại bỏ brand nếu không cần thiết trong context
                            const { ...productForCart } = product;
                            addToCart(productForCart, 1);
                          }}
                        >
                          <IonIcon icon={cartOutline} slot="start" />
                          Thêm vào giỏ
                        </IonButton>
                      </IonCardHeader>
                    </IonCard>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>

            {/* Infinite Scroll */}
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

export default Tab1;
