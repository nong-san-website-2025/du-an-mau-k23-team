// components/UserAdmin/UserDetailRow/UserDetailRow.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Drawer,
  Tabs,
  Button,
  Space,
  Skeleton,
  message,
  Tooltip,
  Popconfirm,
  Avatar,
  Tag,
  Row,
  Col,
  Card,
  Typography,
  Divider,
  Badge,
  Descriptions,
} from "antd";
import {
  X,
  Edit,
  Lock,
  Unlock,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Award,
  DollarSign,
  User,
  Activity,
  Crown,
  Star,
  TrendingUp,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL, getHeaders } from "../../api/config";
import { useUserData } from "../../hooks/useUserData";

// Import các component con
import UserEditForm from "../../UserEditForm";
import OrdersTab from "./tabs/OrdersTab";
import ActivityTab from "./tabs/ActivityTab";
import { intcomma } from "../../../../../../utils/format";
import MemberTierCard from "./MemberTierCard";

const { Text, Title } = Typography;

const TIER_LEVELS = [
  {
    key: "member",
    name: "Thành viên",
    min: 0,
    color: "#595959",
    bg: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
    textColor: "#333",
  },
  {
    key: "silver",
    name: "Bạc",
    min: 1000,
    color: "#78909c",
    bg: "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
    textColor: "#2c3e50",
  },
  {
    key: "gold",
    name: "Vàng",
    min: 5000,
    color: "#faad14",
    bg: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
    textColor: "#d35400",
  },
  {
    key: "diamond",
    name: "Kim Cương",
    min: 10000,
    color: "#1890ff",
    bg: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    textColor: "#fff",
  },
];

// --- SUB-COMPONENT: STATS CARD ---
const StatCard = ({ title, value, icon, color, subValue }) => (
  <Card
    bodyStyle={{ padding: "12px 16px" }}
    bordered={false}
    style={{ background: "#f9f9f9", borderRadius: 8, height: "100%" }}
  >
    <Space align="start" size={12}>
      <div
        style={{
          background: color,
          color: "#fff",
          padding: 10,
          borderRadius: 8,
          display: "flex",
        }}
      >
        {icon}
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {title}
        </Text>
        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
          {value}
        </div>
        {subValue && (
          <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 4 }}>
            {subValue}
          </div>
        )}
      </div>
    </Space>
  </Card>
);

export default function UserDetailRow({ visible, onClose, user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Lấy dữ liệu từ hook
  const {
    orders,
    loadingOrders,
    fetchOrdersData,
    activities,
    loadingActivities,
    fetchActivitiesData,
  } = useUserData(user?.id, visible);

  // --- LOGIC TÍNH TOÁN ĐỂ KHỚP DỮ LIỆU ---
  // 1. Tính tổng chi tiêu dựa trên các đơn hàng thành công trong danh sách
  const totalSpentCalculated = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return 0;
    return orders
      .filter(
        (order) => order.status === "delivered" || order.status === "completed"
      )
      .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
  }, [orders]);

  // 2. Đếm số đơn hàng thành công thực tế
  const totalSuccessOrdersCount = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return 0;
    return orders.filter(
      (order) => order.status === "delivered" || order.status === "completed"
    ).length;
  }, [orders]);

  // --- FETCHING LOGIC ---
  useEffect(() => {
    let mounted = true;
    const fetchUserDetail = async () => {
      if (!user?.id) return;
      setDetailLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/users/management/${user.id}/`,
          { headers: getHeaders() }
        );
        if (mounted) setUserDetail(response.data);
      } catch (error) {
        if (mounted) setUserDetail(user);
      } finally {
        if (mounted) setDetailLoading(false);
      }
    };

    if (visible && user?.id) {
      fetchUserDetail();
    } else if (!visible) {
      setUserDetail(null);
      setActiveTab("1");
    }
    return () => {
      mounted = false;
    };
  }, [visible, user]);

  const memoFetchOrders = useCallback(
    () => fetchOrdersData(),
    [fetchOrdersData]
  );
  const memoFetchActivities = useCallback(
    (dateRange) => fetchActivitiesData(dateRange),
    [fetchActivitiesData]
  );

  const handleToggleStatus = async () => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/users/toggle-active/${user.id}/`,
        {},
        { headers: getHeaders() }
      );
      setUserDetail((prev) => ({
        ...prev,
        is_active: response.data.is_active,
      }));
      message.success(
        response.data.is_active ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản"
      );
    } catch (error) {
      message.error("Lỗi thao tác trạng thái");
    }
  };

  const displayUser = userDetail || user || {};

  // --- RENDER CONTENT: TAB TỔNG QUAN ---
  const renderOverviewTab = () => (
    <div style={{ padding: "0 8px" }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24} md={8}>
          <MemberTierCard
            // Thay đổi ở đây: Truyền tổng chi tiêu vào
            totalSpent={displayUser.total_spent || 0}
          />
        </Col>
        <Col span={12} md={8}>
          <StatCard
            title="Tổng chi tiêu (LTV)"
            value={intcomma(displayUser.total_spent || 0)} // ✅ Đúng: Lấy từ Server
            subValue="Chỉ tính đơn thành công"
            icon={<DollarSign size={20} />}
            color="#52c41a"
          />
        </Col>
        <Col span={12} md={8}>
          <StatCard
            title="Đơn hàng thành công"
            value={displayUser.orders_count || 0}
            subValue={`Trên tổng số ${orders?.length || 0} đơn`}
            icon={<ShoppingBag size={20} />}
            color="#722ed1"
          />
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={24} lg={12}>
          <Title
            level={5}
            style={{
              marginBottom: 16,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Thông tin cá nhân
          </Title>
          <Descriptions
            column={1}
            bordered
            size="small"
            labelStyle={{ width: 140, fontWeight: 600, background: "#fafafa" }}
          >
            <Descriptions.Item
              label={
                <Space>
                  <User size={14} /> Username
                </Space>
              }
            >
              <Text copyable>{displayUser.username}</Text>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <Mail size={14} /> Email
                </Space>
              }
            >
              <a href={`mailto:${displayUser.email}`}>{displayUser.email}</a>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <Phone size={14} /> Hotline
                </Space>
              }
            >
              {displayUser.phone ? (
                <a href={`tel:${displayUser.phone}`}>{displayUser.phone}</a>
              ) : (
                <Text type="secondary" italic>
                  Chưa cập nhật
                </Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tham gia">
              {displayUser.created_at
                ? new Date(displayUser.created_at).toLocaleDateString("vi-VN")
                : "—"}
            </Descriptions.Item>
          </Descriptions>
        </Col>

        <Col span={24} lg={12}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Title
              level={5}
              style={{ margin: 0, fontWeight: 700, textTransform: "uppercase" }}
            >
              Sổ địa chỉ
            </Title>
            <Badge
              count={displayUser.addresses?.length || 0}
              style={{ backgroundColor: "#108ee9" }}
            />
          </div>

          <div
            style={{
              maxHeight: 300,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {displayUser.addresses && displayUser.addresses.length > 0 ? (
              displayUser.addresses.map((addr) => (
                <Card
                  key={addr.id}
                  size="small"
                  bordered={!addr.is_default}
                  style={
                    addr.is_default
                      ? { border: "1px solid #1890ff", background: "#e6f7ff" }
                      : {}
                  }
                >
                  <Space align="start">
                    <MapPin
                      size={16}
                      style={{
                        marginTop: 4,
                        color: addr.is_default ? "#1890ff" : "#8c8c8c",
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {addr.recipient_name}{" "}
                        <Text type="secondary">| {addr.phone}</Text>
                        {addr.is_default && (
                          <Tag color="blue" style={{ marginLeft: 8 }}>
                            Mặc định
                          </Tag>
                        )}
                      </div>
                      <div
                        style={{ fontSize: 13, color: "#595959", marginTop: 4 }}
                      >
                        {addr.location}
                      </div>
                    </div>
                  </Space>
                </Card>
              ))
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: 20,
                  background: "#f5f5f5",
                  borderRadius: 8,
                  color: "#999",
                }}
              >
                Chưa có địa chỉ giao hàng
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );

  return (
    <>
      <Drawer
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "8px 0",
            }}
          >
            <Avatar
              size={56}
              src={displayUser.avatar}
              icon={<User size={32} />}
              style={{
                backgroundColor: displayUser.is_active ? "#1890ff" : "#f5f5f5",
                filter: displayUser.is_active ? "none" : "grayscale(100%)",
              }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                  {displayUser.full_name || displayUser.username}
                </Title>
                {displayUser.role?.name === "admin" && (
                  <Tag color="red" style={{ fontWeight: 600 }}>
                    ADMIN
                  </Tag>
                )}
                {displayUser.role?.name === "seller" && (
                  <Tag color="purple" style={{ fontWeight: 600 }}>
                    SELLER
                  </Tag>
                )}
              </div>
              <div style={{ marginTop: 4 }}>
                <Badge
                  status={displayUser.is_active ? "success" : "error"}
                  text={
                    <Text type="secondary" style={{ fontWeight: 500 }}>
                      {displayUser.is_active
                        ? "Đang hoạt động"
                        : "Đang bị khóa"}
                    </Text>
                  }
                />
              </div>
            </div>
          </div>
        }
        placement="right"
        onClose={onClose}
        open={visible}
        width={950}
        closable={false}
        extra={
          <Space>
            {displayUser.is_active ? (
              <Popconfirm
                title="Khóa tài khoản?"
                description="Người dùng này sẽ bị đăng xuất ngay lập tức."
                onConfirm={handleToggleStatus}
                okText="Khóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button danger type="dashed" icon={<Lock size={16} />}>
                  Khóa
                </Button>
              </Popconfirm>
            ) : (
              <Button
                type="primary"
                ghost
                icon={<Unlock size={16} />}
                onClick={handleToggleStatus}
                style={{ borderColor: "#52c41a", color: "#52c41a" }}
              >
                Mở khóa
              </Button>
            )}

            <Tooltip title="Chỉnh sửa thông tin">
              <Button
                type="default"
                icon={<Edit size={16} />}
                onClick={() => setIsEditing(true)}
              >
                Sửa
              </Button>
            </Tooltip>

            <Divider type="vertical" />
            <Button
              type="text"
              icon={<X size={20} />}
              onClick={onClose}
              style={{ color: "#8c8c8c" }}
            />
          </Space>
        }
      >
        {detailLoading ? (
          <div style={{ padding: 24 }}>
            <Skeleton active avatar paragraph={{ rows: 4 }} />
          </div>
        ) : (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            tabBarStyle={{ padding: "0 16px", marginBottom: 0 }}
            items={[
              {
                key: "1",
                label: "HỒ SƠ KHÁCH HÀNG",
                icon: <User size={16} />,
                children: renderOverviewTab(),
              },
              {
                key: "2",
                label: `LỊCH SỬ ĐƠN HÀNG (${displayUser.orders_count || 0})`,
                icon: <ShoppingBag size={16} />,
                children: (
                  <div style={{ padding: "16px 8px" }}>
                    <OrdersTab
                      userId={user?.id}
                      onLoad={memoFetchOrders}
                      loading={loadingOrders}
                      data={orders}
                    />
                  </div>
                ),
              },
              {
                key: "3",
                label: "NHẬT KÝ HOẠT ĐỘNG",
                icon: <Activity size={16} />,
                children: (
                  <ActivityTab
                    userId={user?.id}
                    onLoad={memoFetchActivities}
                    loading={loadingActivities}
                    data={activities}
                  />
                ),
              },
            ]}
          />
        )}
      </Drawer>

      {isEditing && (
        <Drawer
          title={`Chỉnh sửa: ${displayUser.username}`}
          width={600}
          onClose={() => setIsEditing(false)}
          open={true}
          closable={false}
          extra={
            <Button
              type="text"
              icon={<X size={20} />}
              onClick={() => setIsEditing(false)}
            />
          }
        >
          <UserEditForm
            editUser={displayUser}
            onCancel={() => setIsEditing(false)}
            onSave={(u) => {
              setIsEditing(false);
              setUserDetail(u);
            }}
          />
        </Drawer>
      )}
    </>
  );
}
