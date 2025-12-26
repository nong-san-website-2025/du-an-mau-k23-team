/* src/components/Orders/OrderDetail.tsx */
import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonFooter,
  useIonViewWillEnter,
  IonSpinner,
  useIonToast,
  useIonAlert,
} from "@ionic/react";
import { useParams } from "react-router";
import {
  checkmarkCircle,
  timeOutline,
  cubeOutline,
  locationOutline,
  storefrontOutline,
  callOutline,
  cardOutline,
  documentTextOutline,
  bicycleOutline,
  alertCircleOutline
} from "ionicons/icons";
import { API } from "../../api/api";
import { intcomma } from "../../utils/formatPrice";
import "../../styles/Orders/OrderDetail.css"; // CSS đã cấu hình màu #2E7D32

// Import Types chuẩn từ models.ts
import { Order } from "../../types/models";

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Hooks UI
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  // --- FETCH DATA ---
  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const res = (await API.get(`orders/${id}/`)) as any;
      
      const data = res.data ? res.data : res;
      setOrder(data);
    } catch (error) {
      console.error("Lỗi lấy chi tiết đơn:", error);
    } finally {
      setLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    fetchOrderDetail();
  });

  // --- ACTIONS HANDLERS ---
  const handleCancelOrder = () => {
    presentAlert({
      header: "Hủy đơn hàng",
      message: "Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.",
      buttons: [
        { text: "Không", role: "cancel", cssClass: "secondary" },
        {
          text: "Đồng ý Hủy",
          role: "destructive",
          handler: async () => {
            try {
              await API.post(`orders/${id}/cancel/`, {});
              presentToast({
                message: "Đã hủy đơn hàng thành công",
                duration: 2000,
                color: "success", // Mặc định success của Ionic là xanh lá, khá khớp
                icon: checkmarkCircle
              });
              fetchOrderDetail();
            } catch (error) {
              console.error(error);
              presentToast({
                message: "Lỗi: Không thể hủy đơn hàng lúc này",
                duration: 2000,
                color: "danger",
                icon: alertCircleOutline
              });
            }
          },
        },
      ],
    });
  };

  const handleConfirmReceived = () => {
    presentAlert({
      header: "Đã nhận hàng?",
      message: "Xác nhận bạn đã nhận được hàng đầy đủ và nguyên vẹn?",
      buttons: [
        { text: "Chưa", role: "cancel" },
        {
          text: "Xác nhận",
          role: "confirm", // Role confirm sẽ dùng màu primary (#2E7D32)
          handler: async () => {
            try {
              await API.post(`orders/${id}/complete/`, {}); 
              presentToast({
                message: "Cảm ơn bạn đã mua hàng!",
                duration: 2000,
                color: "success",
                icon: checkmarkCircle
              });
              fetchOrderDetail();
            } catch (error) {
              console.error(error);
              presentToast({
                message: "Lỗi kết nối",
                duration: 2000,
                color: "danger"
              });
            }
          },
        },
      ],
    });
  };

  // --- LOGIC TIMELINE ---
  const getTimelineStep = (status: string) => {
    const steps = ["pending", "confirmed", "shipping", "completed"];
    if (status === "delivered") return 4; 
    return steps.indexOf(status) + 1;
  };

  const currentStep = order ? getTimelineStep(order.status) : 0;

  const timelineSteps = [
    { label: "Đặt hàng thành công", date: order?.created_at, icon: timeOutline },
    { label: "Đã xác nhận", date: order?.confirmed_at, icon: documentTextOutline },
    { label: "Đang giao hàng", date: order?.shipped_at, icon: bicycleOutline }, 
    { label: "Hoàn thành", date: order?.completed_at, icon: checkmarkCircle },
  ];

  // --- RENDER LOADING ---
  if (loading) {
    return (
      <IonPage>
        <IonHeader><IonToolbar><IonTitle>Đang tải...</IonTitle></IonToolbar></IonHeader>
        <IonContent className="ion-text-center ion-padding">
            <IonSpinner name="crescent" color="primary" style={{ marginTop: 20 }} />
        </IonContent>
      </IonPage>
    );
  }

  // --- RENDER NOT FOUND ---
  if (!order) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start"><IonBackButton defaultHref="/orders" /></IonButtons>
            <IonTitle>Không tìm thấy</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">Không tìm thấy đơn hàng này.</IonContent>
      </IonPage>
    );
  }

  // --- RENDER MAIN CONTENT ---
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            {/* Back Button sẽ tự nhận màu Primary (#2E7D32) do CSS */}
            <IonBackButton defaultHref="/orders" text="Trở lại" />
          </IonButtons>
          <IonTitle>Chi tiết đơn #{order.id}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="order-detail-page">
        {/* 1. TIMELINE SECTION */}
        {order.status === 'cancelled' || order.status === 'returned' || order.status === 'refunded' ? (
             <div className="info-section" style={{ background: '#ffebee', border: '1px solid #ef9a9a' }}>
                 <div style={{ color: '#c62828', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
                     <IonIcon icon={cubeOutline} /> 
                     {order.status === 'returned' ? "Đơn hàng đã Trả/Hoàn tiền" : "Đơn hàng đã bị hủy"}
                 </div>
             </div>
        ) : (
            <div className="timeline-container">
            {timelineSteps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep - 1;
                
                return (
                <div key={index} className={`timeline-step ${isCompleted ? "completed" : ""}`}>
                    <div className="step-icon">
                    <IonIcon
                        icon={step.icon}
                        // CSS sẽ lo việc tô màu, nhưng ta set inline style để chắc chắn
                        style={{
                            color: isCompleted ? "var(--ion-color-primary)" : "#bdbdbd",
                            fontSize: isCompleted || isCurrent ? "24px" : "20px",
                        }}
                    />
                    </div>
                    <div className="step-content">
                    <div className="step-title" style={{ color: isCompleted ? "#2E7D32" : "#999" }}>
                        {step.label}
                    </div>
                    {step.date && (
                        <div className="step-date">
                             {new Date(step.date).toLocaleString('vi-VN')}
                        </div>
                    )}
                    </div>
                </div>
                );
            })}
            </div>
        )}

        {/* 2. THÔNG TIN NGƯỜI NHẬN */}
        <div className="info-section">
          <div className="section-title">
            {/* color="primary" sẽ ăn theo biến CSS #2E7D32 */}
            <IonIcon icon={locationOutline} color="primary" />
            Địa chỉ nhận hàng
          </div>
          <div style={{ paddingLeft: 4 }}>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>
                {order.customer_name || "Khách hàng"}
            </div>
            <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: 4 }}>
                {order.customer_phone}
            </div>
            <div style={{ color: '#333', lineHeight: '1.4' }}>
                {order.address}
            </div>
            {order.note && (
                <div style={{ marginTop: 8, padding: 8, background: '#f9f9f9', fontSize: '0.85rem', border: '1px dashed #ddd', borderRadius: 4 }}>
                    <span style={{fontWeight: 600}}>Ghi chú:</span> {order.note}
                </div>
            )}
          </div>
        </div>

        {/* 3. THÔNG TIN CỬA HÀNG */}
        <div className="info-section">
          <div className="section-title">
            <IonIcon icon={storefrontOutline} color="primary" />
            Thông tin cửa hàng
          </div>
          <div className="info-row">
            <span className="info-label">Cửa hàng:</span>
            <span className="info-value">{order.shop_name}</span>
          </div>
          <div className="info-row">
             <span className="info-label">Liên hệ:</span>
             <a href={`tel:${order.shop_phone}`} style={{ textDecoration: 'none', color: '#2E7D32', display: 'flex', alignItems: 'center', gap: 4 }}>
                 <IonIcon icon={callOutline} style={{ fontSize: 14 }} /> 
                 {order.shop_phone || "Đang cập nhật"}
             </a>
          </div>
        </div>

        {/* 4. DANH SÁCH SẢN PHẨM */}
        <div className="info-section">
            <div className="section-title">
                <IonIcon icon={cubeOutline} color="primary" />
                Sản phẩm ({order.items?.length || 0})
            </div>
            {order.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
                    <img 
                        src={item.product_image || "https://via.placeholder.com/60"} 
                        alt={item.product_name}
                        style={{ width: 60, height: 60, borderRadius: 6, objectFit: 'cover', background: '#f0f0f0' }} 
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.3, marginBottom: 4 }}>
                            {item.product_name}
                        </div>
                        {item.variant_name && (
                            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 4 }}>
                                Phân loại: {item.variant_name}
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#888', fontSize: '0.85rem' }}>x{item.quantity}</span>
                            <span style={{ fontWeight: 600 }}>{intcomma(Number(item.price))}₫</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* 5. THANH TOÁN & TỔNG KẾT */}
        <div className="info-section">
            <div className="section-title">
                <IonIcon icon={cardOutline} color="primary" />
                Thanh toán
            </div>
            <div className="info-row">
                <span className="info-label">Phương thức:</span>
                <span className="info-value" style={{ textTransform: 'uppercase' }}>
                    {order.payment_method || "COD"}
                </span>
            </div>
            <div className="info-row">
                <span className="info-label">Trạng thái:</span>
                <span className="info-value">
                    {order.payment_status_display || (order.payment_status === 'paid' ? "Đã thanh toán" : "Chưa thanh toán")}
                </span>
            </div>

            <div style={{ borderTop: '1px dashed #ddd', margin: '12px 0' }}></div>
            
            <div className="summary-row">
                <span style={{ color: '#666' }}>Tạm tính</span>
                <span>{intcomma(Number(order.total_price) - Number(order.shipping_fee || 0))}₫</span>
            </div>
            <div className="summary-row">
                <span style={{ color: '#666' }}>Phí vận chuyển</span>
                <span>{intcomma(Number(order.shipping_fee || 0))}₫</span>
            </div>
            {Number(order.discount_amount) > 0 && (
                <div className="summary-row">
                    <span style={{ color: '#666' }}>Giảm giá</span>
                    {/* Đã chỉnh màu giảm giá thành #2E7D32 */}
                    <span style={{ color: '#2E7D32', fontWeight: 600 }}>-{intcomma(Number(order.discount_amount))}₫</span>
                </div>
            )}
            
            <div className="summary-row" style={{ marginTop: 12, alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Thành tiền</span>
                {/* CSS .final-total đã dùng var(--ion-color-primary) nên màu sẽ là #2E7D32 */}
                <span className="final-total">{intcomma(Number(order.total_price))}₫</span>
            </div>
        </div>
      </IonContent>

      {/* FOOTER ACTIONS */}
      <IonFooter>
         <IonToolbar className="ion-padding-horizontal">
            {order.status === 'pending' && (
                <IonButton 
                    expand="block" 
                    color="danger" 
                    fill="outline"
                    onClick={handleCancelOrder}
                >
                    Hủy đơn hàng
                </IonButton>
            )}
            {order.status === 'delivered' && (
                <IonButton 
                    expand="block" 
                    color="primary" // Sẽ ra màu #2E7D32
                    onClick={handleConfirmReceived}
                >
                    Xác nhận đã nhận hàng
                </IonButton>
            )}
            
            {(order.status === 'completed' || order.status === 'cancelled') && (
                 <IonButton expand="block" fill="outline" routerLink={`/product/${order.items?.[0]?.id}`}>
                     Mua lại
                 </IonButton>
            )}
         </IonToolbar>
      </IonFooter>

    </IonPage>
  );
};

export default OrderDetail;