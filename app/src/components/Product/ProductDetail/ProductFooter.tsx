import React, { useState, useEffect } from "react";
import {
  IonFooter,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  IonModal,
  IonContent,
  IonImg,
  IonText,
  IonNote,
  IonToast // Thêm Toast để báo lỗi nếu cần
} from "@ionic/react";
import { 
  chatbubbleEllipsesOutline, 
  cartOutline, 
  closeOutline, 
  removeOutline, 
  addOutline,
  checkmarkCircleOutline 
} from "ionicons/icons";

interface ProductFooterProps {
  productImage?: string;
  price?: number;
  stock: number;         
  isPreorder: boolean;
  isOutOfStock: boolean;
  onAddToCart: (quantity: number) => void;
  onBuyNow: () => void;
}

const ProductFooter: React.FC<ProductFooterProps> = ({
  productImage,
  price,
  stock, // <--- Cần đảm bảo cái này luôn > 0 thì mới tăng số lượng được
  isPreorder,
  isOutOfStock,
  onAddToCart,
  onBuyNow,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalQty, setModalQty] = useState(1);

  // Debug: Kiểm tra xem stock nhận vào là bao nhiêu
  useEffect(() => {
    console.log("Footer Received Stock:", stock);
  }, [stock]);

  const handleOpenCartModal = () => {
    setModalQty(1);
    setShowModal(true);
  };

  const handleChangeModalQty = (delta: number) => {
    const newQty = modalQty + delta;
    
    // Logic an toàn: Nếu stock lỗi (undefined/null), cho phép mua tối đa 10 cái để test
    const safeStock = stock && stock > 0 ? stock : 10; 

    if (newQty >= 1 && newQty <= safeStock) {
      setModalQty(newQty);
    }
  };

  const handleConfirmAddToCart = () => {
    console.log("Confirm adding:", modalQty);
    onAddToCart(modalQty); // Gọi hàm từ cha
    setShowModal(false);   // Đóng modal
  };

  const formatPrice = (p?: number) => 
    p ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p) : "0đ";

  // Tính toán logic disable nút +
  // Nếu stock = 0 hoặc undefined, tạm thời coi như còn hàng (để tránh bug UI) trừ khi isOutOfStock = true
  const maxLimit = stock && stock > 0 ? stock : 999; 

  return (
    <>
      <IonFooter className="ion-no-border">
        <div style={{ background: "#fff", boxShadow: "0 -4px 16px rgba(0,0,0,0.08)", padding: "8px 0", paddingBottom: "var(--ion-safe-area-bottom, 0)" }}>
          <IonGrid className="ion-no-padding">
            <IonRow className="ion-padding-horizontal ion-align-items-center">
              
              {/* Nút Chat */}
              <IonCol size="2.5">
                <IonButton fill="outline" style={{ height: "44px", width: "100%", margin: 0, "--border-radius": "8px", "--border-color": "#e0e0e0", "--background": "#ffffff", "--color": "#2e7d32" }}>
                  <IonIcon icon={chatbubbleEllipsesOutline} size="large" />
                </IonButton>
              </IonCol>

              {/* Nút Mở Modal Thêm Giỏ */}
              <IonCol size="4.5" style={{ paddingLeft: "8px" }}>
                <IonButton 
                    expand="block" 
                    onClick={handleOpenCartModal} 
                    disabled={isOutOfStock}
                    style={{ height: "44px", margin: 0, "--border-radius": "8px", "--background": "#e8f5e9", "--color": "#2e7d32", fontWeight: "700", fontSize: "13px", boxShadow: "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: "1.1" }}>
                    <IonIcon icon={cartOutline} style={{ fontSize: "18px", marginBottom: "2px" }} />
                  </div>
                </IonButton>
              </IonCol>

              {/* Nút Mua Ngay */}
              <IonCol size="5" style={{ paddingLeft: "8px" }}>
                <IonButton 
                    expand="block" 
                    onClick={onBuyNow} 
                    disabled={isOutOfStock}
                    style={{ height: "44px", margin: 0, "--border-radius": "8px", "--background": isPreorder ? "#ed6c02" : "#2e7d32", fontWeight: "700", fontSize: "13px", boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)" }}>
                  {isPreorder ? "ĐẶT TRƯỚC" : "MUA NGAY"}
                </IonButton>
              </IonCol>

            </IonRow>
          </IonGrid>
        </div>
      </IonFooter>

      {/* --- MODAL --- */}
      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} initialBreakpoint={0.5} breakpoints={[0, 0.5]}>
        <IonContent className="ion-padding">
          <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "20px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid #eee", marginRight: "16px" }}>
               <IonImg src={productImage || "https://via.placeholder.com/150"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                     <IonText color="danger" style={{ fontSize: "18px", fontWeight: "bold" }}>{formatPrice(price)}</IonText>
                     <IonIcon icon={closeOutline} onClick={() => setShowModal(false)} style={{ fontSize: "24px" }} />
                </div>
                <IonNote>Kho: {stock || "Đang cập nhật"}</IonNote>
            </div>
          </div>

          <div style={{ height: "1px", background: "#eee", marginBottom: "20px" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <IonText style={{ fontWeight: "600" }}>Số lượng</IonText>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: "8px" }}>
                  <IonButton fill="clear" color="medium" onClick={() => handleChangeModalQty(-1)} disabled={modalQty <= 1}>
                      <IonIcon icon={removeOutline} />
                  </IonButton>
                  <span style={{ width: "40px", textAlign: "center", fontWeight: "bold", fontSize: "16px" }}>{modalQty}</span>
                  <IonButton fill="clear" color="medium" onClick={() => handleChangeModalQty(1)} disabled={modalQty >= maxLimit}>
                      <IonIcon icon={addOutline} />
                  </IonButton>
              </div>
          </div>

          <IonButton expand="block" onClick={handleConfirmAddToCart} style={{ "--background": "#2e7d32", "--border-radius": "8px", height: "48px", fontWeight: "bold" }}>
             <IonIcon icon={checkmarkCircleOutline} slot="start" />
             XÁC NHẬN THÊM
          </IonButton>
        </IonContent>
      </IonModal>
    </>
  );
};

export default ProductFooter;