import React, { useState, useMemo, useCallback } from "react";
import useCategories from "../hooks/useCategories";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonSkeletonText,
  IonRippleEffect,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonButtons,
  IonButton,
} from "@ionic/react";
import { fileTrayOutline, refreshOutline, filterOutline } from "ionicons/icons";
import "../styles/Category.css";
import ProductImage from "../components/Product/ProductImage";

// --- THAY ĐỔI 1: Import Interface gốc từ file types chung ---
// Dùng "as CategoryModel" để không bị trùng tên với Component Category ở dưới
import { Category as CategoryModel } from "../types/models";

// --- THAY ĐỔI 2: Kế thừa (Extend) từ Global Type ---
// Lúc này CategoryItem sẽ có đủ: id, name, image (string|null), icon (string|null)
interface CategoryItem extends CategoryModel {
  itemCount?: number; // Chỉ cần khai báo thêm field riêng của UI
}

// Tách nhỏ Component Card để code gọn và dễ tái sử dụng
const CategoryCard: React.FC<{
  category: CategoryItem;
  onClick: (id: string | number) => void;
}> = React.memo(({ category, onClick }) => {
  
  // Logic xử lý ảnh an toàn: Ưu tiên image -> icon -> undefined (tránh null gây lỗi)
  const imageSource = category.image ?? category.icon ?? undefined;

  return (
    <div
      className="category-card ion-activatable ripple-parent"
      onClick={() => onClick(category.id)}
    >
      <div className="card-image-wrapper">
        {/* Component tự xử lý link ảnh, fallback lỗi, icon */}
        <ProductImage
          src={imageSource} 
          alt={category.name}
          className="real-image" // Class này giúp set position absolute
        />
        
        {/* Overlay gradient giúp text dễ đọc hơn */}
        <div className="image-overlay"></div>
      </div>
      
      <div className="category-info">
        <h3 className="category-name">{category.name}</h3>
        {category.itemCount !== undefined && (
          <span className="category-count">{category.itemCount} sản phẩm</span>
        )}
      </div>
      <IonRippleEffect type="bounded" className="custom-ripple" />
    </div>
  );
});

const Category: React.FC = () => {
  // Giả lập hàm refresh data
  // Ép kiểu categories về CategoryItem[] nếu hook trả về type khác, hoặc để tự động nếu hook đã chuẩn
  const { categories, refreshCategories } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const history = useHistory();

  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return categories;
    return categories.filter((cat) => cat.name.toLowerCase().includes(query));
  }, [categories, searchQuery]);

  const handleNavigate = useCallback(
    (id: string | number) => {
      history.push(`/category/${id}`);
    },
    [history]
  );

  const handleRefresh = async (event: CustomEvent) => {
    // Nếu hook useCategories có export hàm refresh thì gọi ở đây
    if (refreshCategories) await refreshCategories();
    // Timeout giả lập để UX mượt hơn (người dùng thấy spinner quay 1 chút)
    setTimeout(() => {
      event.detail.complete();
    }, 1000);
  };

  return (
    <IonPage>
      {/* Header Minimalist & Clean */}
      <IonHeader className="ion-no-border category-header">
        <IonToolbar>
          <IonTitle className="page-title">Khám Phá</IonTitle>
          <IonButtons slot="end">
            {/* Thêm nút Filter nếu sau này cần lọc sâu hơn */}
            <IonButton>
              <IonIcon icon={filterOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>

        <IonToolbar className="search-toolbar-wrapper">
          <IonSearchbar
            value={searchQuery}
            onIonChange={(e) => setSearchQuery(e.detail.value!)}
            placeholder="Tìm loại nông sản, hạt giống..."
            className="greenfarm-searchbar"
            inputMode="search"
            showClearButton="focus"
            animated
          />
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="category-bg">
        {/* Pull to Refresh - Tính năng bắt buộc cho App hiện đại */}
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon={refreshOutline}
            pullingText="Kéo để làm mới"
            refreshingSpinner="crescent"
          />
        </IonRefresher>

        <div className="content-padder">
          {/* Header nhỏ hiển thị số lượng kết quả - Tăng trải nghiệm UX */}
          {searchQuery && (
            <div className="search-result-label">
              Tìm thấy {filteredCategories.length} kết quả cho "{searchQuery}"
            </div>
          )}

          {categories.length === 0 ? (
            /* ===== SKELETON LOADING ===== */
            <IonGrid>
              <IonRow>
                {[...Array(6)].map((_, i) => (
                  <IonCol size="6" sizeMd="4" sizeLg="3" key={i}>
                    <div className="skeleton-card">
                      <IonSkeletonText animated className="sk-img" />
                      <IonSkeletonText
                        animated
                        className="sk-text"
                        style={{ width: "70%" }}
                      />
                    </div>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          ) : filteredCategories.length === 0 ? (
            /* ===== EMPTY STATE ===== */
            <div className="empty-state">
              <div className="empty-icon-circle">
                <IonIcon icon={fileTrayOutline} />
              </div>
              <h3>Không tìm thấy danh mục</h3>
              <p>Thử tìm kiếm với từ khóa khác xem sao nhé!</p>
            </div>
          ) : (
            /* ===== GRID DANH MỤC ===== */
            <IonGrid className="ion-no-padding">
              <IonRow>
                {/* Lưu ý: cast 'cat as CategoryItem' nếu hook trả về type thiếu itemCount 
                   nhưng ở đây vì extends nên TS sẽ tự hiểu là tương thích
                */}
                {filteredCategories.map((cat) => (
                  <IonCol
                    size="6"
                    sizeMd="4"
                    sizeLg="3"
                    key={cat.id}
                    className="category-col"
                  >
                    <CategoryCard category={cat} onClick={handleNavigate} />
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Category;