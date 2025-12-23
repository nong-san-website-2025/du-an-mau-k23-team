// src/pages/Home.tsx
import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonGrid,
  IonSearchbar,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  // Đã xóa useIonToast
} from "@ionic/react";
import { searchOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";

// Hooks & Context
import { useCart } from "../context/CartContext";
import { useProductCatalog } from "../hooks/useProductCatalog";
import { useDebounce } from "../hooks/useDebounce";

// Components
import AppHeader from "../components/AppHeader";
import ProductList from "../components/Home/ProductList";
import ProductSkeletonGrid from "../components/Home/ProductSkeletonGrid";
import ErrorView from "../components/Common/ErrorView";
import EmptyState from "../components/Common/EmptyState";
import { Product } from "../types/models";

const Home: React.FC = () => {
  // 1. Logic tách biệt
  const { products, loading, error, hasMore, refetch, search, loadMore } = useProductCatalog();
  const { addToCart } = useCart(); // addToCart này đã bao gồm Toast
  const history = useHistory();

  // 2. Search State UI
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  useEffect(() => {
    search(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // 3. Handlers
  const handleLoadMore = (e: CustomEvent<void>) => {
    loadMore();
    (e.target as HTMLIonInfiniteScrollElement).complete();
  };

  const handleProductClick = (id: number) => history.push(`/product/${id}`);

  // 👇 CHỈNH SỬA: Gọn gàng hơn, không cần Toast thủ công
  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Vẫn giữ để không bị chuyển trang khi bấm nút mua
    
    // Gọi hàm từ Context, Context tự lo việc hiện Toast "Đã thêm vào giỏ..."
    await addToCart(product, 1); 
  };

  // 4. Render Content
  const renderContent = () => {
    if (loading && products.length === 0) return <ProductSkeletonGrid count={8} />;
    if (error) return <ErrorView onRetry={refetch} />;
    if (!loading && products.length === 0) return <EmptyState message="Không tìm thấy sản phẩm nào." />;
    
    return (
      <ProductList 
        products={products} 
        onClick={handleProductClick} 
        onAddToCart={handleAddToCart}
      />
    );
  };

  return (
    <IonPage id="home-page">
      <AppHeader />
      
      <IonHeader collapse="condense" className="ion-no-border">
        <IonToolbar style={{ "--background": "#f7f9fc" }}>
          <IonSearchbar
            value={searchTerm}
            onIonInput={(e) => setSearchTerm(e.detail.value!)}
            placeholder="Tìm kiếm sản phẩm..."
            searchIcon={searchOutline}
            className="custom-searchbar"
          />
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding-bottom app-bg">
        <IonGrid className="ion-no-padding ion-padding-top">
          {renderContent()}
        </IonGrid>

        <IonInfiniteScroll onIonInfinite={handleLoadMore} disabled={!hasMore} threshold="100px">
          <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Đang tải thêm..." />
        </IonInfiniteScroll>
      </IonContent>
    </IonPage>
  );
};

export default Home;