// CartPage.tsx
import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonImg,
  IonButton,
  IonText,
  IonSpinner,
  IonIcon,
  IonAlert, // 👈 Thay IonModal bằng IonAlert
} from "@ionic/react";
import { removeOutline, addOutline, removeCircleOutline } from "ionicons/icons";
import { useCart } from "../context/CartContext";

const CartPage: React.FC = () => {
  const { cartItems, loading, updateQuantity, removeFromCart } = useCart();

  // 👇 Chỉ cần 1 state: product ID đang chờ xác nhận xóa
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<
    number | null
  >(null);

  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleClearCart = () => {
    cartItems.forEach((item) => {
      removeFromCart(item.product.id);
    });
  };

  const handleDecrement = (productId: number, currentQty: number) => {
    if (currentQty <= 1) {
      setConfirmDeleteProductId(productId); // 👈 Mở alert
    } else {
      updateQuantity(productId, currentQty - 1);
    }
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteProductId !== null) {
      removeFromCart(confirmDeleteProductId);
    }
    setConfirmDeleteProductId(null); // 👈 Đóng alert
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="ion-text-center">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="ion-padding">
        {cartItems.length === 0 ? (
          <IonText color="medium">
            <p className="ion-text-center">Giỏ hàng đang trống</p>
          </IonText>
        ) : (
          <>
            <IonList>
              {cartItems.map((item) => (
                <IonItem key={item.product.id}>
                  <IonImg
                    src={item.product.image || "https://via.placeholder.com/70"}
                    alt={item.product.name}
                    style={{
                      width: "70px",
                      height: "70px",
                      borderRadius: "8px",
                      objectFit: "cover",
                      marginRight: "10px",
                    }}
                  />
                  <IonLabel>
                    <h2>{item.product.name}</h2>
                    <p>{item.product.price.toLocaleString("vi-VN")}₫</p>
                  </IonLabel>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <IonButton
                      size="small"
                      fill="outline"
                      color="medium"
                      onClick={() =>
                        handleDecrement(item.product.id, item.quantity)
                      }
                    >
                      <IonIcon icon={removeOutline} />
                    </IonButton>

                    <span
                      style={{
                        minWidth: "30px",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {item.quantity}
                    </span>

                    <IonButton
                      size="small"
                      fill="outline"
                      color="medium"
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                    >
                      <IonIcon icon={addOutline} />
                    </IonButton>
                  </div>
                </IonItem>
              ))}
            </IonList>

            <div className="ion-padding">
              <div className="ion-text-right">
                <IonText color="dark">
                  <h2>
                    Tổng cộng: <strong>{total.toLocaleString("vi-VN")}₫</strong>
                  </h2>
                </IonText>
              </div>

              <IonButton
                expand="block"
                color="danger"
                fill="outline"
                onClick={handleClearCart}
                style={{ marginTop: "12px" }}
              >
                <IonIcon icon={removeCircleOutline} slot="start" />
                Xóa tất cả
              </IonButton>

              <IonButton
                expand="block"
                color="success"
                style={{ marginTop: "12px" }}
              >
                Thanh toán
              </IonButton>
            </div>
          </>
        )}

        {/* 👇 DÙNG IONALERT — popup nhỏ, nền mờ, thấy được giỏ hàng */}
        <IonAlert
          isOpen={confirmDeleteProductId !== null}
          onDidDismiss={() => setConfirmDeleteProductId(null)}
          header="Xác nhận xóa"
          // 👇 Thêm subHeader nếu muốn (tùy chọn)
          // subHeader="Thao tác này không thể hoàn tác"
          message="Sản phẩm sẽ bị xóa khỏi giỏ hàng của bạn."
          cssClass="custom-alert" // 👈 Thêm class để custom
          buttons={[
            {
              text: "Hủy",
              role: "cancel",
              cssClass: "alert-button-cancel", // 👈 custom nút
              handler: () => setConfirmDeleteProductId(null),
            },
            {
              text: "Xóa",
              cssClass: "alert-button-confirm", // 👈 custom nút
              handler: handleConfirmDelete,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default CartPage;
