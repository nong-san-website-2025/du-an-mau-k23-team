// components/UserAdmin/UserDetailModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  Tabs,
  Descriptions,
  Button,
  Divider,
  Tag,
  Avatar,
  Tooltip,
  Skeleton,
  Card,
  Statistic,
  List,
  Space,
  Empty,
} from "antd";
import {
  User,
  Mail,
  Phone,
  Shield,
  Home,
  Star,
  Calendar,
  ShoppingCart,
  RotateCcw,
  MessageCircle,
  Package,
} from "lucide-react";
import UserEditForm from "./UserEditForm";
import { useTranslation } from "react-i18next";
import axios from "axios";

const { TabPane } = Tabs;

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const getToken = () => localStorage.getItem("token");

const getFrequencyLabel = (count) => {
  if (count >= 5) return "Rất thường xuyên";
  if (count >= 3) return "Thường xuyên";
  if (count >= 1) return "Thỉnh thoảng";
  return "Hiếm";
};

const getFrequencyColor = (count) => {
  if (count >= 5) return "#52c41a";
  if (count >= 3) return "#7cb305";
  return "#faad14";
};

export default function UserDetailModal({
  user,
  visible,
  onClose,
  onUserUpdated,
}) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [behaviorStats, setBehaviorStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const avatarUrl =
    user?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || "U"}`;

  // 🔄 Reset state khi modal đóng hoặc user thay đổi
  useEffect(() => {
    if (!visible) {
      // Reset tất cả state khi modal đóng
      setIsEditing(false);
      setActiveTab("1");
      setBehaviorStats(null);
      setLoadingStats(false);
    }
  }, [visible]);

  // 🔄 Load thống kê hành vi khi chuyển sang tab 2 hoặc khi modal mở
  useEffect(() => {
    if (visible && activeTab === "2" && user?.id) {
      // Luôn fetch lại dữ liệu mỗi khi vào tab 2
      setLoadingStats(true);
      setBehaviorStats(null); // Reset trước khi fetch

      axios
        .get(`${API_BASE_URL}/orders/users/${user.id}/behavior-stats/`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        .then((res) => {
          setBehaviorStats(res.data || {});
        })
        .catch((err) => {
          console.error("❌ Lỗi tải thống kê hành vi:", err);
          setBehaviorStats(null);
        })
        .finally(() => setLoadingStats(false));
    }
  }, [visible, activeTab, user?.id]);

  const renderBehaviorTab = () => {
    if (loadingStats) return <Skeleton active paragraph={{ rows: 6 }} />;
    if (!behaviorStats)
      return <Empty description={t("Không có dữ liệu hành vi")} />;

    const {
      total_orders = 0,
      total_spent = 0,
      purchase_frequency_90d = 0,
      return_rate = 0,
      complaint_rate = 0,
      purchased_products = [],
      interested_categories = [],
      view_count = 0,
    } = behaviorStats;

    return (
      <>
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space size={[16, 16]} wrap>
            <Statistic
              title={t("Tổng đơn hàng")}
              value={total_orders}
              prefix={<ShoppingCart size={16} />}
            />
            <Statistic
              title={t("Tổng chi tiêu")}
              value={total_spent}
              prefix="₫"
              formatter={(val) => new Intl.NumberFormat("vi-VN").format(val)}
            />
            <Statistic
              title={t("Tần suất mua (90 ngày)")}
              value={getFrequencyLabel(purchase_frequency_90d)}
              valueStyle={{ color: getFrequencyColor(purchase_frequency_90d) }}
            />
            <Statistic
              title={t("Tỷ lệ hoàn hàng")}
              value={`${return_rate}%`}
              valueStyle={{ color: return_rate > 20 ? "#ff4d4f" : "#52c41a" }}
              prefix={<RotateCcw size={16} />}
            />
            <Statistic
              title={t("Tỷ lệ khiếu nại")}
              value={`${complaint_rate}%`}
              valueStyle={{
                color: complaint_rate > 10 ? "#ff4d4f" : "#52c41a",
              }}
              prefix={<MessageCircle size={16} />}
            />
          </Space>
        </Card>

        <Card
          size="small"
          title={t("Sản phẩm đã mua")}
          style={{ marginBottom: 16 }}
        >
          {purchased_products.length > 0 ? (
            <List
              dataSource={purchased_products}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: 40,
                            height: 40,
                            objectFit: "cover",
                            borderRadius: 4,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            backgroundColor: "#f0f0f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 4,
                          }}
                        >
                          <Package size={16} />
                        </div>
                      )
                    }
                    title={item.name}
                    description={`${t("Xem")} ${item.view_count || 0} ${t("lần")} • ${t("Mua")} ${item.purchase_count || 0} ${t("lần")}`}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description={t("Chưa mua sản phẩm nào")} />
          )}
        </Card>

        <Card size="small" title={t("Danh mục quan tâm")}>
          {interested_categories.length > 0 ? (
            <Space size={[8, 8]} wrap>
              {interested_categories.map((cat) => (
                <Tag color="blue" key={cat.id}>
                  {cat.name}
                </Tag>
              ))}
            </Space>
          ) : (
            <Empty description={t("Chưa có danh mục quan tâm")} />
          )}
        </Card>
      </>
    );
  };

  const handleClose = () => {
    // Reset tất cả state trước khi đóng
    setIsEditing(false);
    setActiveTab("1");
    setBehaviorStats(null);
    setLoadingStats(false);
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      footer={null}
      title={isEditing ? t("edit_user") : t("Chi tiết người dùng")}
      width={1200}
      destroyOnClose
      bodyStyle={{ height: "80vh", overflowY: "auto" }}
      centered
    >
      {isEditing ? (
        <div>
          <p style={{ fontSize: 13, color: "gray" }}>
            👉 {t("Đang chỉnh sửa tài khoản")} <b>{user.username}</b>
          </p>
          <UserEditForm
            editUser={user}
            onCancel={() => setIsEditing(false)}
            onSave={(updatedUser) => {
              setIsEditing(false);
              if (onUserUpdated) onUserUpdated(updatedUser);
            }}
          />
        </div>
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            if (key === "1") setIsEditing(false);
          }}
        >
          {/* Tab 1: Thông tin cơ bản */}
          <TabPane tab={t("Thông tin")} key="1">
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "24px",
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                padding: "24px",
              }}
            >
              {/* --- Avatar + Info ngắn --- */}
              <div
                style={{
                  width: 220,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  borderRight: "1px solid #f0f0f0",
                  paddingRight: 24,
                }}
              >
                <Avatar
                  src={avatarUrl}
                  size={100}
                  style={{ border: "2px solid #e6e6e6" }}
                />
                <h3
                  style={{
                    marginTop: 12,
                    marginBottom: 4,
                    textAlign: "center",
                  }}
                >
                  {user.full_name || t("Chưa có tên")}
                </h3>

                {user.role?.name && (
                  <Tag color="blue" style={{ marginBottom: 4 }}>
                    {t("Vai trò")}: {user.role.name}
                  </Tag>
                )}

                <Tag
                  color={user.is_active ? "green" : "red"}
                  style={{ marginBottom: 6 }}
                >
                  {user.is_active ? t("Đang hoạt động") : t("Đã bị khóa")}
                </Tag>

                <p
                  style={{
                    color: "#888",
                    fontSize: 13,
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  <Mail size={14} style={{ marginRight: 4 }} />
                  {user.email_masked}
                </p>
                <p
                  style={{
                    color: "#888",
                    fontSize: 13,
                    textAlign: "center",
                    marginTop: 2,
                  }}
                >
                  <Phone size={14} style={{ marginRight: 4 }} />
                  {user.phone_masked || t("Không có")}
                </p>
              </div>

              {/* --- Thông tin chi tiết --- */}
              <div style={{ flex: 1 }}>
                <Descriptions
                  column={1}
                  bordered
                  size="middle"
                  labelStyle={{
                    width: "220px",
                    fontWeight: 500,
                    background: "#fafafa",
                  }}
                  contentStyle={{ background: "#fff" }}
                >
                  <Descriptions.Item
                    label={
                      <span>
                        <User size={16} style={{ marginRight: 6 }} />
                        {t("Tài khoản")}
                      </span>
                    }
                  >
                    {user.username || t("Chưa có")}
                  </Descriptions.Item>

                  <Descriptions.Item
                    label={
                      <span>
                        <Home size={16} style={{ marginRight: 6 }} />
                        {t("Địa chỉ mặc định")}
                      </span>
                    }
                  >
                    {user.default_address || t("Chưa có địa chỉ")}
                  </Descriptions.Item>

                  <Descriptions.Item
                    label={
                      <span>
                        <Star
                          size={16}
                          style={{ marginRight: 6, color: "#f59e0b" }}
                        />
                        {t("Điểm thưởng")}
                      </span>
                    }
                  >
                    <Tooltip
                      title={t(
                        "Điểm tích lũy có thể dùng để đổi quà hoặc giảm giá"
                      )}
                    >
                      <b style={{ color: "#f59e0b" }}>{user.points ?? 0}</b>
                    </Tooltip>
                  </Descriptions.Item>

                  <Descriptions.Item
                    label={
                      <span>
                        <Shield size={16} style={{ marginRight: 6 }} />
                        {t("Trạng thái")}
                      </span>
                    }
                  >
                    {user.is_active ? t("Đang hoạt động") : t("Đã bị khóa")}
                  </Descriptions.Item>

                  <Descriptions.Item
                    label={
                      <span>
                        <Calendar size={16} style={{ marginRight: 6 }} />
                        {t("Ngày tạo tài khoản")}
                      </span>
                    }
                  >
                    {new Date(user.created_at).toLocaleString("vi-VN")}
                  </Descriptions.Item>
                </Descriptions>

                {/* --- Nút thao tác --- */}
                <div
                  style={{
                    marginTop: 20,
                    textAlign: "right",
                  }}
                >
                  <Button
                    type="primary"
                    style={{
                      marginRight: 8,
                      borderRadius: 6,
                      boxShadow: "0 2px 6px rgba(24,144,255,0.2)",
                    }}
                    onClick={() => setIsEditing(true)}
                  >
                    {t("Sửa")}
                  </Button>
                </div>
              </div>
            </div>
          </TabPane>

          {/* Tab 2: Thống kê hành vi */}
          <TabPane tab={t("Thống kê hành vi")} key="2">
            {renderBehaviorTab()}
            <div style={{ textAlign: "right", marginTop: 16 }}>
              <Button onClick={handleClose}>{t("Đóng")}</Button>
            </div>
          </TabPane>
        </Tabs>
      )}
    </Modal>
  );
}
