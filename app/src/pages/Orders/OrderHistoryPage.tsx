/* src/pages/Orders/OrderHistoryPage.tsx */
import React, { useState } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonContent, IonSegment, IonSegmentButton, IonLabel, IonRefresher, IonRefresherContent
} from "@ionic/react";
import { RefresherEventDetail } from '@ionic/core';
import OrderList from "../../components/Orders/OrderList"; // Component con tách biệt
import "../../styles/Orders/OrderHistory.css"; // File CSS tùy chỉnh

const OrderHistoryPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState("pending");

  // Map các tab giống logic cũ của bạn
  const segments = [
    { value: "pending", label: "Chờ xác nhận" },
    { value: "shipping", label: "Vận chuyển" },
    { value: "delivered", label: "Đã giao" },
    { value: "completed", label: "Hoàn thành" },
    { value: "return", label: "Trả hàng" },
    { value: "cancelled", label: "Đã hủy" },
  ];

  // Xử lý Pull-to-refresh (Kéo xuống để load lại)
  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    // Logic refresh sẽ được trigger trong component con thông qua event bus hoặc context
    // Ở đây ta mô phỏng delay
    setTimeout(() => {
      event.detail.complete();
      window.dispatchEvent(new Event("refresh-orders")); // Bắn sự kiện global
    }, 1500);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>Đơn mua</IonTitle>
        </IonToolbar>
        
        {/* THANH TAB SCROLL NGANG (Chuẩn Mobile) */}
        <IonToolbar>
          <IonSegment 
            value={selectedTab} 
            onIonChange={(e) => setSelectedTab(e.detail.value as string)}
            scrollable={true} 
            mode="md" // Ép kiểu Material Design để tab nằm dưới đẹp hơn
          >
            {segments.map((seg) => (
              <IonSegmentButton key={seg.value} value={seg.value}>
                <IonLabel>{seg.label}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent color="light">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Render nội dung danh sách đơn hàng dựa trên tab */}
        <div className="order-list-container">
           <OrderList status={selectedTab} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default OrderHistoryPage;