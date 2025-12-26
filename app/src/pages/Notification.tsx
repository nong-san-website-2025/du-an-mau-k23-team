import React, { useState, useMemo } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonIcon,
  IonThumbnail,
  IonSegment,
  IonSegmentButton,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  RefresherEventDetail
} from '@ionic/react';
import { 
  pricetagOutline, 
  notificationsOutline, 
  checkmarkDoneOutline, 
  trashOutline,
  cubeOutline
} from 'ionicons/icons';
import '../styles/Notification.css'; // File CSS tuỳ chỉnh

// --- Types & Interfaces ---
type NotificationType = 'order' | 'promo' | 'system';

interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  image?: string; // Dùng ảnh sản phẩm nếu có
}

// --- Mock Data (Giả lập API) ---
const MOCK_DATA: NotificationItem[] = [
  {
    id: 1,
    type: 'order',
    title: 'Giao hàng thành công',
    description: 'Đơn hàng #DH9328 của bạn đã được giao thành công. Hãy đánh giá sản phẩm nhé!',
    timestamp: '10:30 AM',
    isRead: false,
  },
  {
    id: 2,
    type: 'promo',
    title: 'Siêu Sale Giữa Tháng!',
    description: 'Giảm giá lên đến 50% cho các mặt hàng nông sản tươi sạch. Săn ngay!',
    timestamp: '09:15 AM',
    isRead: false,
  },
  {
    id: 3,
    type: 'system',
    title: 'Bảo trì hệ thống',
    description: 'Hệ thống sẽ bảo trì từ 00:00 đến 02:00 ngày mai để nâng cấp trải nghiệm.',
    timestamp: 'Hôm qua',
    isRead: true,
  },
  {
    id: 4,
    type: 'order',
    title: 'Đơn hàng đang vận chuyển',
    description: 'Đơn hàng #DH1102 đã đến trạm kho Cần Thơ.',
    timestamp: 'Hôm qua',
    isRead: true,
  },
  {
    id: 5,
    type: 'promo',
    title: 'Voucher tặng bạn',
    description: 'Bạn nhận được voucher giảm 20k phí vận chuyển.',
    timestamp: '20/12/2024',
    isRead: true,
  }
];

const NotificationPage: React.FC = () => {
  const [activeSegment, setActiveSegment] = useState<string>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_DATA);

  // --- Logic xử lý ---
  
  // Lọc thông báo theo tab
  const filteredNotifications = useMemo(() => {
    if (activeSegment === 'all') return notifications;
    return notifications.filter(n => n.type === activeSegment);
  }, [activeSegment, notifications]);

  // Đánh dấu đã đọc
  const handleMarkAsRead = (id: number) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );
    setNotifications(updated);
  };

  // Xóa thông báo
  const handleDelete = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Pull to refresh (Giả lập load lại API)
  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    setTimeout(() => {
      // Logic gọi API ở đây
      event.detail.complete();
    }, 1500);
  };

  // Helper render icon theo loại
  const renderIcon = (type: NotificationType) => {
    switch (type) {
      case 'order': return { icon: cubeOutline, color: 'primary' }; // Màu xanh chủ đạo
      case 'promo': return { icon: pricetagOutline, color: 'warning' };
      default: return { icon: notificationsOutline, color: 'medium' };
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>Thông báo</IonTitle>
          <IonButton slot="end" fill="clear" color="primary">
            <IonIcon icon={checkmarkDoneOutline} slot="icon-only" />
          </IonButton>
        </IonToolbar>

        {/* Thanh phân loại Tab */}
        <IonToolbar>
          <IonSegment 
            value={activeSegment} 
            onIonChange={e => setActiveSegment(e.detail.value as string)}
            mode="md"
            className="custom-segment"
          >
            <IonSegmentButton value="all">
              <IonLabel>Tất cả</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="order">
              <IonLabel>Đơn hàng</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="promo">
              <IonLabel>Khuyến mãi</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding-top custom-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent pullingText="Kéo để làm mới..." refreshingSpinner="circles" />
        </IonRefresher>

        {filteredNotifications.length === 0 ? (
          // Empty State (Khi không có dữ liệu)
          <div className="empty-state">
            <IonIcon icon={notificationsOutline} className="empty-icon" />
            <p>Không có thông báo nào ở mục này</p>
          </div>
        ) : (
          <IonList lines="full">
            {filteredNotifications.map(item => {
              const { icon, color } = renderIcon(item.type);
              
              return (
                <IonItemSliding key={item.id}>
                  <IonItem 
                    button 
                    detail={false} 
                    onClick={() => handleMarkAsRead(item.id)}
                    className={!item.isRead ? 'item-unread' : ''}
                  >
                    {/* Icon đại diện bên trái */}
                    <IonThumbnail slot="start" className={`noti-thumb bg-${color}`}>
                      <IonIcon icon={icon} />
                    </IonThumbnail>

                    <IonLabel className="ion-text-wrap">
                      <div className="noti-header">
                        <h3 className="noti-title">{item.title}</h3>
                        <IonNote className="noti-time">{item.timestamp}</IonNote>
                      </div>
                      <p className="noti-desc">{item.description}</p>
                    </IonLabel>

                    {/* Dấu chấm đỏ nếu chưa đọc */}
                    {!item.isRead && <div className="unread-dot"></div>}
                  </IonItem>

                  {/* Hành động vuốt (Swipe Actions) */}
                  <IonItemOptions side="end">
                    <IonItemOption color="danger" onClick={() => handleDelete(item.id)}>
                      <IonIcon slot="icon-only" icon={trashOutline} />
                    </IonItemOption>
                  </IonItemOptions>
                </IonItemSliding>
              );
            })}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default NotificationPage;