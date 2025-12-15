import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonSkeletonText,
  IonIcon,
} from "@ionic/react";

import { useParams, useHistory } from "react-router-dom";
import { productApi } from "../../api/productApi";
import { Category } from "../../types/models";
import useSubcategories from "../../hooks/useSubcategories";
import { chevronForwardOutline } from "ionicons/icons";

const SubCategory: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [categoryName, setCategoryName] = useState("");
  const { subcategories, loading, error } = useSubcategories(categoryId);
  const history = useHistory(); // 👈 dùng hook

  useEffect(() => {
    const fetchCategoryName = async () => {
      try {
        const cats = await productApi.getCategories();
        const currentCat = cats.find(
          (c: Category) => String(c.id) === categoryId
        );
        setCategoryName(currentCat?.name || "Danh mục");
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
      }
    };
    fetchCategoryName();
  }, [categoryId]);

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar color="light">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/category" />
          </IonButtons>
          <IonTitle style={{ fontWeight: 700 }}>{categoryName}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          "--background": "#f9fafb",
          "--padding-start": "16px",
          "--padding-end": "16px",
        }}
      >
        {loading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <IonItem
                lines="none"
                key={i}
                style={{
                  margin: "8px 0",
                  borderRadius: "12px",
                  backgroundColor: "#fff",
                }}
              >
                <IonSkeletonText
                  animated
                  style={{ width: "60%", height: "18px" }}
                />
              </IonItem>
            ))}
          </>
        ) : error ? (
          <div
            style={{ textAlign: "center", marginTop: "50px", color: "#888" }}
          >
            {error}
          </div>
        ) : subcategories.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              marginTop: "50px",
              color: "#888",
              fontSize: "15px",
            }}
          >
            Không có danh mục con nào.
          </div>
        ) : (
          <IonList lines="none" style={{ padding: "8px 0" }}>
            {subcategories.map((sub) => (
              <IonItem
                button
                key={sub.id}
                onClick={() => history.push(`/subcategory/${sub.id}/products`)}
                style={{
                  "--background": "#ffffff",
                  borderRadius: "12px",
                  margin: "0px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                  padding: "4px 0px",
                }}
              >
                <IonLabel
                  style={{
                    textAlign: "left",
                    fontWeight: 500,
                    fontSize: "16px",
                    color: "#1f1f1f",
                  }}
                >
                  {sub.name}
                </IonLabel>
                <IonIcon
                  icon={chevronForwardOutline}
                  style={{ color: "#888", fontSize: "20px" }}
                  slot="end"
                />
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SubCategory;
