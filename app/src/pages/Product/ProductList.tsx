import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonImg,
  IonText,
  IonButton,
  IonIcon,
  IonSpinner,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/react";
import { cartOutline } from "ionicons/icons";
import { useParams } from "react-router-dom";
import { productApi } from "../../api/productApi";
import { Product } from "../../types/models";
import { useCart } from "../../context/CartContext";

const ProductList: React.FC = () => {
  const { subcategoryId } = useParams<{ subcategoryId: string }>();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { addToCart } = useCart();

  const ITEMS_PER_LOAD = 10;

  // Hàm format giá VND
  const formatPriceVND = (price: number) => {
    return price
      .toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      })
      .replace("₫", "")
      .trim();
  };

  useEffect(() => {
    const fetchProducts = async () => {
      if (!subcategoryId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await productApi.getProductsBySubcategory(Number(subcategoryId));

        if (!Array.isArray(data)) {
          throw new Error("Dữ liệu sản phẩm không hợp lệ");
        }

        setAllProducts(data);
        setVisibleProducts(data.slice(0, ITEMS_PER_LOAD));
        setHasMore(data.length > ITEMS_PER_LOAD);
      } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
        setError("Không thể tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [subcategoryId]);

  const loadMore = async (e: CustomEvent<void>) => {
    await new Promise((resolve) => setTimeout(resolve, 500)); // delay nhẹ

    const nextCount = visibleProducts.length + ITEMS_PER_LOAD;
    const nextProducts = allProducts.slice(0, nextCount);
    setVisibleProducts(nextProducts);

    if (nextProducts.length >= allProducts.length) {
      setHasMore(false);
    }

    (e.target as HTMLIonInfiniteScrollElement).complete();
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="light">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/category" />
          </IonButtons>
          <IonTitle>Sản phẩm</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading ? (
          <div className="ion-text-center" style={{ padding: "40px" }}>
            <IonSpinner name="crescent" />
          </div>
        ) : error ? (
          <IonText color="danger" style={{ display: "block", textAlign: "center", padding: "20px" }}>
            {error}
          </IonText>
        ) : allProducts.length === 0 ? (
          <IonText color="medium" style={{ display: "block", textAlign: "center", padding: "40px" }}>
            Không có sản phẩm nào.
          </IonText>
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
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                      }}
                    >
                      <IonImg
                        src={
                          product.image ||
                          `https://via.placeholder.com/300x200?text=${encodeURIComponent(product.name)}`
                        }
                        style={{ height: "150px", objectFit: "cover" }}
                        alt={product.name}
                      />
                      <IonCardHeader style={{ padding: "12px" }}>
                        <IonText color="medium" style={{ fontSize: "0.8rem" }}>
                          {product.brand || "Thương hiệu"}
                        </IonText>
                        <IonCardTitle
                          style={{
                            fontSize: "1rem",
                            fontWeight: "500",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
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
                          onClick={() => addToCart(product, 1)}
                          style={{ marginTop: "8px" }}
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

            <IonInfiniteScroll
              onIonInfinite={loadMore}
              threshold="100px"
              disabled={!hasMore}
            >
              <IonInfiniteScrollContent
                loadingSpinner="dots"
                loadingText="Đang tải thêm..."
              />
            </IonInfiniteScroll>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ProductList;