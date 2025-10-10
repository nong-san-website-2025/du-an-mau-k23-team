import React from "react";
import useCategories from "../hooks/useCategories";
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonSkeletonText,
  IonText,
} from "@ionic/react";

const Tab2: React.FC = () => {
  const categories = useCategories();

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding" style={{ backgroundColor: "#f8f9fa" }}>
        <IonText color="black">
          <h2 style={{ fontWeight: 700, marginBottom: 0, textAlign: "center" }}>
            Danh Mục
          </h2>
        </IonText>

        {categories.length === 0 ? (
          // Hiển thị hiệu ứng loading thân thiện
          <IonGrid>
            <IonRow>
              {[...Array(6)].map((_, i) => (
                <IonCol size="6" key={i}>
                  <IonCard style={{ borderRadius: "8px" }}>
                    <IonSkeletonText animated style={{ width: "100%", height: "120px" }} />
                    <IonCardHeader>
                      <IonSkeletonText animated style={{ width: "70%" }} />
                    </IonCardHeader>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        ) : (
          // Hiển thị danh mục thật
          <IonGrid>
            <IonRow>
              {categories.map((cat) => (
                <IonCol size="6" key={cat.id}>
                  <IonCard
                    button
                    onClick={() => console.log("Xem danh mục:", cat.name)}
                    style={{
                      borderRadius: "4px",
                      overflow: "hidden",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "120px",
                        background: `url(${cat.image}) center/cover no-repeat`,
                      }}
                    ></div>
                    <IonCardHeader style={{ textAlign: "center", padding: "8px" }}>
                      <IonCardTitle
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "#2e7d32",
                        }}
                      >
                        {cat.name}
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

export default Tab2;
