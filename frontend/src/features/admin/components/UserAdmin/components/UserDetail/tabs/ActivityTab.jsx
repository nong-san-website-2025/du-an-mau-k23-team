// Tab 5: Hoạt động gần đây
import React, { useEffect } from "react";
import { Timeline, Empty, Skeleton, Card } from "antd";
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

  if (!data && loading) return <Skeleton active />;

  if (loading) return <Skeleton active />;

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ padding: "20px" }}>
        <Card>
          <Empty
            description="Không có hoạt động"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: "40px" }}
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

  return (
    <div style={{ padding: "20px" }}>
      <Card title={<><Activity size={16} style={{ marginRight: "8px" }} /> Nhật ký hoạt động</>}>
        <Timeline
          items={data.map((item, idx) => ({
            dot: getActivityIcon(item.activity_type),
            color: getActivityColor(item.activity_type),
            children: (
              <div key={idx}>
                <p style={{ marginBottom: "4px" }}>
                  <strong>{item.description || item.title}</strong>
                </p>
                <p style={{ fontSize: "12px", color: "#999", marginBottom: 0 }}>
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
