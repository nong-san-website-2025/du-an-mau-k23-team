/* src/pages/Orders/components/OrderList.tsx */
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  IonButton,
  IonIcon,
  IonSkeletonText,
  useIonToast,
  useIonAlert,
} from "@ionic/react";
import { storefrontOutline, imageOutline, cubeOutline } from "ionicons/icons";
import { API } from "../../api/api";
import { intcomma } from "../../utils/formatPrice";
import "../../styles/Orders/OrderList.css"; // Đảm bảo bạn đã tạo file CSS này

// Import types
import { Order, OrderStatus } from "../../types/models";

interface StatusConfig {
  className: string; // Đổi từ color sang className để dùng CSS custom
  label: string;
}

const OrderList: React.FC<{ status: string }> = ({ status }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();
  // Lưu ý: state imgError toàn cục sẽ làm ảnh hưởng tất cả ảnh nếu 1 ảnh lỗi.
  // Tuy nhiên tôi giữ nguyên theo yêu cầu không sửa logic, chỉ handle UI tốt nhất có thể.
  const [imgError, setImgError] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchOrders = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);

      try {
        console.log(`--- Fetching ${status} ---`);
        const res = (await API.get(`orders/?status=${status}`)) as any;

        let data: Order[] = [];
        if (Array.isArray(res)) {
          data = res;
        } else if (res?.data && Array.isArray(res.data)) {
          data = res.data;
        } else if (res?.results && Array.isArray(res.results)) {
          data = res.results;
        } else if (res?.data?.results && Array.isArray(res.data.results)) {
          data = res.data.results;
        }

        const sortedData = data.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });

        if (isMounted.current) {
          setOrders(sortedData);
        }
      } catch (err) {
        console.error("Fetch orders failed:", err);
        if (isMounted.current) setOrders([]);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    [status]
  );

  useEffect(() => {
    fetchOrders(true);
  }, [status, fetchOrders]); // Đã thêm fetchOrders vào dependency để chuẩn hook

  useEffect(() => {
    const handleRefresh = () => {
      console.log("Refreshing orders silently...");
      fetchOrders(false);
    };

    window.addEventListener("refresh-orders", handleRefresh);
    return () => window.removeEventListener("refresh-orders", handleRefresh);
  }, [fetchOrders]);

  const handleCancelOrder = (orderId: number) => {
    presentAlert({
      header: "Hủy đơn hàng",
      message:
        "Bạn có chắc chắn muốn hủy đơn hàng này? Thao tác này không thể hoàn tác.",
      buttons: [
        {
          text: "Không",
          role: "cancel",
          cssClass: "secondary",
        },
        {
          text: "Đồng ý Hủy",
          role: "destructive",
          handler: async () => {
            try {
              await API.post(`orders/${orderId}/cancel/`, {});
              presentToast({
                message: "Đã hủy đơn hàng thành công",
                duration: 2000,
                color: "success",
                position: "top", // Hiện ở trên dễ thấy hơn
              });
              fetchOrders(false);
            } catch (error) {
              console.error(error);
              presentToast({
                message: "Không thể hủy đơn hàng lúc này",
                duration: 2000,
                color: "danger",
              });
            }
          },
        },
      ],
    });
  };

  // Hàm render Badge đã được style lại
  const renderStatusBadge = (orderStatus: OrderStatus | string) => {
    const map: Record<string, StatusConfig> = {
      pending: { className: "badge-warning", label: "Chờ xác nhận" },
      confirmed: { className: "badge-primary", label: "Đã xác nhận" },
      processing: { className: "badge-tertiary", label: "Đang đóng gói" },
      shipping: { className: "badge-secondary", label: "Đang giao" },
      delivered: { className: "badge-success", label: "Đã giao hàng" },
      completed: { className: "badge-success", label: "Hoàn thành" },
      cancelled: { className: "badge-medium", label: "Đã hủy" },
      return: { className: "badge-danger", label: "Trả hàng/Hoàn tiền" },
      refunded: { className: "badge-danger", label: "Đã hoàn tiền" },
    };

    const config = map[orderStatus] || {
      className: "badge-medium",
      label: orderStatus,
    };
    return (
      <span className={`status-badge ${config.className}`}>{config.label}</span>
    );
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="order-list-container ion-padding-top">
        {[1, 2, 3].map((i) => (
          <div key={i} className="order-card-pro">
            <div className="card-header">
              <IonSkeletonText
                animated
                style={{ width: "40%", height: "20px", borderRadius: "4px" }}
              />
              <IonSkeletonText
                animated
                style={{ width: "20%", height: "20px", borderRadius: "10px" }}
              />
            </div>
            <div className="card-body">
              <IonSkeletonText
                animated
                style={{ width: "70px", height: "70px", borderRadius: "8px" }}
              />
              <div
                style={{
                  flex: 1,
                  paddingLeft: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <IonSkeletonText
                  animated
                  style={{ width: "80%", height: "16px" }}
                />
                <IonSkeletonText
                  animated
                  style={{ width: "50%", height: "16px" }}
                />
              </div>
            </div>
            <div
              className="card-footer"
              style={{ borderTop: "1px solid #f0f0f0" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <IonSkeletonText
                  animated
                  style={{ width: "80px", height: "30px", borderRadius: "4px" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="empty-container">
        <div className="empty-icon-wrapper">
          <IonIcon
            icon={cubeOutline}
            style={{ fontSize: "64px", color: "#d1d5db" }}
          />
        </div>
        <h3 style={{ margin: "0 0 8px 0", color: "#4b5563", fontWeight: 600 }}>
          Không có đơn hàng
        </h3>
        <p style={{ color: "#9ca3af", margin: 0, fontSize: "0.95rem" }}>
          Hiện chưa có đơn hàng nào trong mục này
        </p>
      </div>
    );
  }

  return (
    <div className="order-list-container ion-padding-bottom">
      {orders.map((order) => {
        const firstItem = order.items?.[0];
        if (!firstItem) return null;
        const otherItemsCount = order.items.length - 1;

        return (
          <div key={order.id} className="order-card-pro">
            {/* Header: Shop Name & Status */}
            <div className="card-header">
              <div className="shop-info">
                <IonIcon icon={storefrontOutline} className="shop-icon" />
                <span className="shop-name">{order.shop_name}</span>
              </div>
              {renderStatusBadge(order.status)}
            </div>

            {/* Body: Product Info */}
            <div className="card-body">
              {/* Product Image */}
              <div className="thumb-wrapper">
                {!firstItem.product_image || imgError ? (
                  <div className="product-fallback">
                    <IonIcon icon={imageOutline} />
                  </div>
                ) : (
                  <img
                    className="product-thumb"
                    src={firstItem.product_image}
                    alt={firstItem.product_name}
                    onError={() => setImgError(true)}
                  />
                )}
              </div>

              {/* Product Details */}
              <div className="product-details">
                <h3 className="product-name">{firstItem.product_name}</h3>
                <div className="product-meta">
                  <span className="product-qty">x{firstItem.quantity}</span>
                  <span className="product-price">
                    {intcomma(Number(firstItem.price))}₫
                  </span>
                </div>
              </div>
            </div>

            {/* More items indicator */}
            {otherItemsCount > 0 && (
              <div className="more-items-wrapper">
                <span className="more-text">
                  Xem thêm {otherItemsCount} sản phẩm khác
                </span>
              </div>
            )}

            {/* Footer: Total & Actions */}
            <div className="card-footer">
              <div className="total-row">
                <span className="total-label">Thành tiền:</span>
                <span className="total-amount">
                  {intcomma(Number(order.total_price))}₫
                </span>
              </div>

              <div className="action-row">
                {status === "pending" && (
                  <IonButton
                    mode="ios"
                    size="small"
                    fill="outline"
                    color="medium"
                    onClick={() => handleCancelOrder(order.id)}
                    style={{ height: "32px", fontSize: "0.85rem" }}
                  >
                    Hủy đơn
                  </IonButton>
                )}

                {status === "delivered" && (
                  <IonButton
                    mode="ios"
                    size="small"
                    color="primary"
                    style={{
                      height: "32px",
                      "--box-shadow": "none",
                      fontSize: "0.85rem",
                    }}
                  >
                    Đã nhận hàng
                  </IonButton>
                )}

                <IonButton
                  mode="ios"
                  size="small"
                  fill="outline"
                  color="primary"
                  // THÊM DÒNG NÀY: Dẫn hướng đến trang chi tiết kèm ID đơn hàng
                  routerLink={`/orders/${order.id}`}
                  style={{ height: "32px", fontSize: "0.85rem" }}
                >
                  Xem chi tiết
                </IonButton>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderList;
