import React, { useState } from "react";
import useCategories from "../hooks/useCategories";
import { useHistory } from "react-router-dom";

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonSkeletonText,
} from "@ionic/react";
import { searchOutline } from "ionicons/icons";

const Category: React.FC = () => {
  const categories = useCategories(); // Custom hook lấy danh mục
  const [searchQuery, setSearchQuery] = useState("");
  const history = useHistory();

  // Lọc danh mục theo từ khóa
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <IonPage>
      {/* ===== HEADER ===== */}
      <IonHeader translucent={true}>
        <IonToolbar color="light">
          <IonTitle style={{ fontWeight: 700 }}>Danh Mục</IonTitle>
          <IonButtons slot="end">
            <IonButton>
              <IonIcon icon={searchOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* ===== CONTENT ===== */}
      <IonContent
        fullscreen
        style={{
          "--background": "#f9fafb",
          padding: "12px",
        }}
      >
        {/* ===== SEARCH BAR ===== */}
        <IonSearchbar
          value={searchQuery}
          onIonChange={(e) => setSearchQuery(e.detail.value!)}
          placeholder="Tìm danh mục hoặc sản phẩm..."
          debounce={200}
          style={{
            "--background": "#ffffff",
            "--border-radius": "12px",
            "--box-shadow": "0 1px 4px rgba(0,0,0,0.08)",
            marginBottom: "12px",
          }}
        />

        {/* ===== HIỂN THỊ NỘI DUNG ===== */}
        {categories.length === 0 ? (
          // === Loading Skeleton (khi đang tải danh mục) ===
          <IonGrid>
            <IonRow>
              {[...Array(6)].map((_, i) => (
                <IonCol size="6" key={i}>
                  <IonCard
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      backgroundColor: "#fff",
                    }}
                  >
                    <IonSkeletonText
                      animated
                      style={{
                        width: "100%",
                        height: "120px",
                        borderRadius: "12px 12px 0 0",
                      }}
                    />
                    <IonCardHeader>
                      <IonSkeletonText
                        animated
                        style={{ width: "60%", height: "14px" }}
                      />
                    </IonCardHeader>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        ) : filteredCategories.length === 0 ? (
          // === Trường hợp không tìm thấy danh mục ===
          <div
            style={{
              textAlign: "center",
              marginTop: "50px",
              color: "#888",
              fontSize: "15px",
            }}
          >
            Không tìm thấy danh mục nào.
          </div>
        ) : (
          // === Hiển thị danh mục thật ===
          <IonGrid>
            <IonRow>
              {filteredCategories.map((cat) => (
                <IonCol size="6" key={cat.id}>
                  <IonCard
                    button
                    onClick={() => history.push(`/category/${cat.id}`)}
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      transition: "transform 0.15s ease",
                    }}
                    onMouseDown={(e) =>
                      (e.currentTarget.style.transform = "scale(0.97)")
                    }
                    onMouseUp={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "120px",
                        background:
                          cat.image || cat.icon
                            ? `url(${
                                cat.image || cat.icon
                              }) center/cover no-repeat`
                            : "#e0e0e0",
                      }}
                    ></div>

                    <IonCardHeader
                      style={{ textAlign: "center", padding: "8px 4px" }}
                    >
                      <IonCardTitle
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#2e7d32",
                          lineHeight: 1.3,
                        }}
                      >
                        {cat.name.length > 25
                          ? cat.name.substring(0, 25) + "..."
                          : cat.name}
                      </IonCardTitle>
                    </IonCardHeader>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Category;
