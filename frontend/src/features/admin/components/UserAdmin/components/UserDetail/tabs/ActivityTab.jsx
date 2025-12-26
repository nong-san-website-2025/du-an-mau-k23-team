import React, { useEffect, useState } from "react";
import {
  Timeline,
  Empty,
  Skeleton,
  Card,
  Space,
  DatePicker,
  Button,
  Typography,
  Tag,
} from "antd";
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
  LogOut, // Thêm icon LogOut
  CheckCircle,
  Calendar,
  Clock,
  Filter,
} from "lucide-react";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Text } = Typography;

export default function ActivityTab({ userId, onLoad, loading, data }) {
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    if (onLoad && userId) {
      onLoad(dateRange); // Truyền params lọc vào hàm onLoad
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, dateRange]);

  // Hàm xử lý khi thay đổi ngày
  const onDateChange = (dates) => {
    setDateRange(dates);
  };

  const getActivityIcon = (type) => {
    const iconMap = {
      order_created: <ShoppingCart size={16} />,
      order_confirmed: <CheckCircle size={16} />,
      order_shipped: <Package size={16} />,
      order_delivered: <Package size={16} />,
      payment: <CreditCard size={16} />,
      review: <MessageCircle size={16} />,
      login: <LogIn size={16} />,
      logout: <LogOut size={16} />, // Thêm Logout
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
      logout: "orange",
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
      login: "Đăng nhập hệ thống",
      logout: "Đăng xuất hệ thống",
      view: "Xem sản phẩm",
      favorite: "Thêm yêu thích",
      profile_update: "Cập nhật hồ sơ",
      activity: "Hoạt động",
    };
    return labelMap[type] || type;
  };

  return (
    <div style={{ padding: "16px 8px" }}>
      {/* THANH LỌC THỜI GIAN */}
      <Card
        size="small"
        style={{
          marginBottom: 16,
          borderRadius: 8,
          border: "1px solid #f0f0f0",
        }}
        bodyStyle={{ padding: "12px 16px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Space>
            <Filter size={16} style={{ color: "#8c8c8c" }} />
            <Text
              strong
              style={{ fontSize: "14px", textTransform: "uppercase" }}
            >
              Bộ lọc thời gian
            </Text>
          </Space>

          <RangePicker
            style={{ width: 320, borderRadius: 6 }}
            onChange={onDateChange}
            placeholder={["Từ ngày", "Đến ngày"]}
            format="DD/MM/YYYY"
          />
        </div>
      </Card>

      {/* NỘI DUNG NHẬT KÝ */}
      <Card
        title={
          <Space>
            <Activity size={18} style={{ color: "#1890ff" }} />
            <span
              style={{
                fontSize: "16px",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Nhật ký hoạt động
            </span>
          </Space>
        }
        bodyStyle={{ padding: "24px" }}
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : !Array.isArray(data) || data.length === 0 ? (
          <Empty description="Không tìm thấy hoạt động trong khoảng thời gian này" />
        ) : (
          <Timeline
            mode="left"
            items={data.map((item, idx) => ({
              dot: (
                <div
                  style={{
                    padding: 6,
                    background: "#f0f2f5",
                    borderRadius: "50%",
                    color:
                      getActivityColor(item.activity_type) === "default"
                        ? "#8c8c8c"
                        : getActivityColor(item.activity_type),
                  }}
                >
                  {getActivityIcon(item.activity_type)}
                </div>
              ),
              children: (
                <div style={{ marginBottom: 20, marginLeft: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Text strong style={{ fontSize: "15px", color: "#262626" }}>
                      {item.description || getActivityLabel(item.activity_type)}
                    </Text>
                    <Tag color={getActivityColor(item.activity_type)}>
                      {item.activity_type?.replace("_", " ").toUpperCase()}
                    </Tag>
                  </div>

                  <Space size="large" style={{ marginTop: 6 }}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      <Calendar
                        size={12}
                        style={{ marginRight: 4, verticalAlign: "middle" }}
                      />
                      {dayjs(item.created_at).format("DD/MM/YYYY")}
                    </Text>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      <Clock
                        size={12}
                        style={{ marginRight: 4, verticalAlign: "middle" }}
                      />
                      {dayjs(item.created_at).format("HH:mm:ss")}
                    </Text>
                    {item.ip && (
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        IP: {item.ip}
                      </Text>
                    )}
                  </Space>
                </div>
              ),
            }))}
          />
        )}
      </Card>
    </div>
  );
}
