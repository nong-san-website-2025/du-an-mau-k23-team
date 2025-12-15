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
  IonText,
  IonSpinner,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/react";
import { useParams, useHistory } from "react-router-dom";
import { productApi } from "../../api/productApi";
import { Product } from "../../types/models"; // ✅ Dùng Product chung
import { useCart } from "../../context/CartContext";
import ProductCard from "./ProductCard";

const ProductList: React.FC = () => {
  const { subcategoryId } = useParams<{ subcategoryId: string }>();
  const history = useHistory();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // ✅ addToCart giờ đã nhận đúng kiểu Product
  const { addToCart } = useCart(); 

  const ITEMS_PER_LOAD = 10;

  useEffect(() => {
    const fetchProducts = async () => {
      if (!subcategoryId) return;
      try {
        setLoading(true);
        setError(null);
        
        const data = await productApi.getProductsBySubcategory(
          Number(subcategoryId)
        );

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
    // Delay nhẹ để tạo cảm giác loading mượt mà
    await new Promise((resolve) => setTimeout(resolve, 500));

    const nextCount = visibleProducts.length + ITEMS_PER_LOAD;
    const nextProducts = allProducts.slice(0, nextCount);
    setVisibleProducts(nextProducts);

    if (nextProducts.length >= allProducts.length) {
      setHasMore(false);
    }

    (e.target as HTMLIonInfiniteScrollElement).complete();
  };

  // 👇 SỬA LẠI HÀM NÀY: Ngắn gọn, không cần 'as any', không cần convert image
  const handleAddToCart = (product: Product) => (e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn click vào Card
    addToCart(product, 1);
  };

  const handleProductClick = (productId: number) => () => {
    history.push(`/product/${productId}`);
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
          <IonText
            color="danger"
            style={{ display: "block", textAlign: "center", padding: "20px" }}
          >
            {error}
          </IonText>
        ) : allProducts.length === 0 ? (
          <IonText
            color="medium"
            style={{ display: "block", textAlign: "center", padding: "40px" }}
          >
            Không có sản phẩm nào.
          </IonText>
        ) : (
          <>
            <IonGrid>
              <IonRow className="ion-align-items-stretch">
                {visibleProducts.map((product) => (
                  <IonCol
                    size="6"
                    key={product.id}
                    className="ion-padding-bottom"
                  >
                    <ProductCard
                      product={product}
                      onClick={handleProductClick(product.id)}
                      onAddToCart={handleAddToCart(product)}
                    />
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