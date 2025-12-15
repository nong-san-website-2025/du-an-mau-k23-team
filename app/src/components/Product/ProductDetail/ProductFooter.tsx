import React from "react";
import { IonFooter, IonGrid, IonRow, IonCol, IonButton, IonIcon } from "@ionic/react";
import { chatbubbleEllipsesOutline, removeOutline, addOutline } from "ionicons/icons";

interface ProductFooterProps {
  quantity: number;
  isPreorder: boolean;
  isOutOfStock: boolean;
  onChangeQuantity: (delta: number) => void;
  onBuyAction: () => void;
}

const ProductFooter: React.FC<ProductFooterProps> = ({
  quantity,
  isPreorder,
  isOutOfStock,
  onChangeQuantity,
  onBuyAction,
}) => {
  return (
    <IonFooter>
      <div className="footer-bar">
        <IonGrid className="ion-no-padding">
          <IonRow>
            <IonCol size="2" style={{ display: "flex", alignItems: "center" }}>
              <IonButton fill="outline" color="medium" className="btn-main" style={{ width: "100%" }}>
                <IonIcon icon={chatbubbleEllipsesOutline} slot="icon-only" />
              </IonButton>
            </IonCol>

            <IonCol size="4" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", background: "#f0f0f0", borderRadius: "8px", padding: "4px" }}>
                <IonIcon icon={removeOutline} onClick={() => onChangeQuantity(-1)} style={{ padding: "8px" }} />
                <span style={{ fontWeight: "bold", margin: "0 8px", fontSize: "16px" }}>{quantity}</span>
                <IonIcon icon={addOutline} onClick={() => onChangeQuantity(1)} style={{ padding: "8px" }} />
              </div>
            </IonCol>

            <IonCol size="6">
              <IonButton
                expand="block"
                color={isPreorder ? "warning" : "primary"}
                className="btn-main"
                onClick={onBuyAction}
                disabled={!isPreorder && isOutOfStock}
              >
                {!isPreorder && isOutOfStock ? "HẾT HÀNG" : isPreorder ? "ĐẶT TRƯỚC" : "MUA NGAY"}
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </div>
    </IonFooter>
  );
};

export default ProductFooter;