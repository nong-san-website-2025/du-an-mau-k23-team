// Tab 3: Hoạt động gần đây
import React, { useEffect } from "react";
import { Timeline, Empty, Skeleton, Card, Space } from "antd";
import {
  ShoppingCart,
  MessageCircle,
  Package,
  CreditCard,
  User,
  Activity,
  Eye,
  Heart,
  LogIn,
  CheckCircle,
} from "lucide-react";

export default function ActivityTab({ userId, onLoad, loading, data }) {
  useEffect(() => {
    if (onLoad && userId) {
      onLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!data && loading) return <Skeleton active style={{ padding: "20px" }} />;

  if (loading) return <Skeleton active style={{ padding: "20px" }} />;

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
        <Card>
          <Empty
            description="Không có hoạt động"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: "40px", marginBottom: "40px" }}
          />
        </Card>
      </div>
    );
  }

  const getActivityIcon = (type) => {
    const iconMap = {
      order_created: <ShoppingCart size={16} />,
      order_confirmed: <CheckCircle size={16} />,
      order_shipped: <Package size={16} />,
      order_delivered: <Package size={16} />,
      payment: <CreditCard size={16} />,
      review: <MessageCircle size={16} />,
      login: <LogIn size={16} />,
      view: <Eye size={16} />,
      favorite: <Heart size={16} />,
      profile_update: <User size={16} />,
      activity: <Activity size={16} />,
    };
    return iconMap[type] || <Activity size={16} />;
  };

  const getActivityColor = (type) => {
    const colorMap = {
      order_created: "green",
      order_confirmed: "blue",
      order_shipped: "cyan",
      order_delivered: "green",
      payment: "gold",
      review: "purple",
      login: "blue",
      view: "default",
      favorite: "red",
      profile_update: "orange",
      activity: "default",
    };
    return colorMap[type] || "default";
  };

  const getActivityLabel = (type) => {
    const labelMap = {
      order_created: "Tạo đơn hàng",
      order_confirmed: "Xác nhận đơn hàng",
      order_shipped: "Giao hàng",
      order_delivered: "Giao hàng thành công",
      payment: "Thanh toán",
      review: "Đánh giá",
      login: "Đăng nhập",
      view: "Xem sản phẩm",
      favorite: "Thêm yêu thích",
      profile_update: "Cập nhật hồ sơ",
      activity: "Hoạt động",
    };
    return labelMap[type] || type;
  };

  return (
    <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
      <Card 
        title={
          <Space>
            <Activity size={18} style={{ color: "#1890ff" }} />
            <span style={{ fontSize: "16px", fontWeight: 600 }}>Nhật ký hoạt động</span>
          </Space>
        }
        bodyStyle={{ padding: "20px" }}
      >
        <Timeline
          items={data.map((item, idx) => ({
            dot: getActivityIcon(item.activity_type),
            color: getActivityColor(item.activity_type),
            children: (
              <div key={idx} style={{ marginBottom: idx !== data.length - 1 ? "16px" : 0 }}>
                <p style={{ marginBottom: "4px" }}>
                  <strong style={{ color: "#262626", fontSize: "14px" }}>
                    {item.description || item.title || getActivityLabel(item.activity_type)}
                  </strong>
                </p>
                <p style={{ fontSize: "12px", color: "#8c8c8c", marginBottom: 0 }}>
                  {new Date(item.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
            ),
          }))}
        />
      </Card>
    </div>
  );
}
