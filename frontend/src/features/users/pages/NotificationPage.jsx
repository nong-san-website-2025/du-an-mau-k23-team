import React, { useEffect, useState, useCallback } from "react";
import {
  BellOutlined,
  InfoCircleOutlined,
  ShoppingCartOutlined,
  GiftOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Card,
  List,
  Typography,
  Empty,
  theme,
  message,
  Modal,
  Button,
  Tag,
  Descriptions,
  Divider,
} from "antd";
import { useNavigate } from "react-router-dom";
import useUserProfile from "../services/useUserProfile";
import {
  fetchUnifiedNotifications,
  markAllAsRead,
} from "../services/notificationService";

const { Title, Text, Paragraph } = Typography;

export default function NotificationPage() {
  const { token: antdToken } = theme.useToken();
  const profile = useUserProfile();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [selectedNoti, setSelectedNoti] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userId = profile?.id;

  // Set page title
  useEffect(() => {
    const prev = document.title;
    document.title = "GreenFarm - Thông Báo";
    return () => { document.title = prev; };
  }, []);

  // --- Hàm định dạng tiền tệ ---
  const formatVND = (n) =>
    Number.isFinite(Number(n))
      ? `${Math.round(n).toLocaleString("vi-VN")} VNĐ`
      : "-";

  // --- Hàm lấy Icon & Màu sắc dựa trên loại thông báo ---
  const getNotiStyle = (type) => {
    switch (type?.toLowerCase()) {
      case "order":
        return {
          icon: <ShoppingCartOutlined />,
          color: "#1890ff",
          label: "Đơn hàng",
        };
      case "voucher":
        return { icon: <GiftOutlined />, color: "#eb2f96", label: "Ưu đãi" };
      case "wallet":
        return { icon: <WalletOutlined />, color: "#52c41a", label: "Ví tiền" };
      case "refund":
        return { icon: <WalletOutlined />, color: "#52c41a", label: "Hoàn tiền" };
      default:
        return { icon: <BellOutlined />, color: "#faad14", label: "Hệ thống" };
    }
  };

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await fetchUnifiedNotifications(userId);
      setItems(list);
      // await markAllAsRead(userId);
    } catch (e) {
      console.error(e);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDetail = async (noti) => {
    // 1. Cập nhật UI ngay lập tức cho mượt
    setItems((prev) =>
      prev.map((item) =>
        item.id === noti.id ? { ...item, read: true, is_read: true } : item
      )
    );

    // 2. GỌI API ĐỂ CẬP NHẬT DATABASE (Quan trọng nhất)
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `http://localhost:8000/api/notifications/${noti.id}/mark_as_read/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 3. Báo cho cái Chuông ở Header biết để giảm số lượng
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (error) {
      console.error("Không thể cập nhật trạng thái đã đọc:", error);
    }

    // 4. ĐIỀU HƯỚNG (Không hiện Modal theo yêu cầu của bạn)
    if (noti.type?.toLowerCase() === "order" && noti.metadata?.order_id) {
      navigate(`/orders/${noti.metadata.order_id}`);
    } else {
      // Nếu không phải đơn hàng thì mới hiện Modal
      setSelectedNoti(noti);
      setIsModalOpen(true);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));

      // PHÁT SỰ KIỆN: Báo cho Sidebar/Header biết là đã đọc hết rồi
      window.dispatchEvent(new Event("notificationsUpdated"));

      message.success("Đã đánh dấu tất cả thông báo là đã đọc");
    } catch (e) {
      message.error("Thao tác thất bại");
    }
  };

  return (
    <Card
      className="mx-2 mx-md-5 my-4"
      bordered={false}
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)", borderRadius: "12px" }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              backgroundColor: antdToken.colorPrimary,
              padding: "8px",
              borderRadius: "8px",
              display: "flex",
            }}
          >
            <BellOutlined style={{ color: "#fff", fontSize: "20px" }} />
          </div>
          <Title level={4} style={{ margin: 0 }}>
            Trung tâm thông báo
          </Title>
        </div>
      }
    >
      <List
        dataSource={items}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Hộp thư trống"
            />
          ),
        }}
        renderItem={(noti) => {
          const style = getNotiStyle(noti.type);
          return (
            <List.Item
              className="noti-item"
              style={{
                borderBottom: `1px solid ${antdToken.colorBorderSecondary}`,
                cursor: "pointer",
                padding: "20px",
                backgroundColor: noti.read ? "transparent" : "#f9feff",
                transition: "all 0.3s",
              }}
              onClick={() => handleOpenDetail(noti)}
            >
              <List.Item.Meta
                avatar={
                  <Badge dot={!noti.read} offset={[-2, 35]}>
                    <Avatar
                      size={48}
                      icon={style.icon}
                      style={{
                        backgroundColor: noti.read ? "#f0f0f0" : style.color,
                        color: noti.read ? "#bfbfbf" : "#fff",
                      }}
                    />
                  </Badge>
                }
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <Text strong={!noti.read} style={{ fontSize: "16px" }}>
                      {noti.title || noti.message}
                    </Text>
                    <Text
                      type="secondary"
                      style={{ fontSize: "12px", fontWeight: "normal" }}
                    >
                      <ClockCircleOutlined /> {noti.time}
                    </Text>
                  </div>
                }
                description={
                  <Text type="secondary" ellipsis style={{ maxWidth: "80%" }}>
                    {noti.detail || noti.message}
                  </Text>
                }
              />
            </List.Item>
          );
        }}
      />

      {/* --- MODAL CHI TIẾT "PRO" --- */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={600}
        centered
        footer={[
          <Button key="back" onClick={() => setIsModalOpen(false)} size="large">
            Đóng
          </Button>,
          selectedNoti?.metadata?.order_id && (
            <Button
              key="submit"
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={() =>
                navigate(`/orders/${selectedNoti.metadata.order_id}`)
              }
            >
              Chi tiết đơn hàng
            </Button>
          ),
        ]}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircleOutlined style={{ color: "#52c41a" }} />
            <span>Thông tin chi tiết</span>
          </div>
        }
      >
        {selectedNoti && (
          <div style={{ padding: "10px 0" }}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <Avatar
                size={64}
                icon={getNotiStyle(selectedNoti.type).icon}
                style={{
                  backgroundColor: getNotiStyle(selectedNoti.type).color,
                  marginBottom: "12px",
                }}
              />
              <Title level={4} style={{ marginBottom: "4px" }}>
                {selectedNoti.title}
              </Title>
              <Tag color={getNotiStyle(selectedNoti.type).color}>
                {getNotiStyle(selectedNoti.type).label}
              </Tag>
            </div>

            <Divider orientation="left" plain>
              <Text type="secondary">Nội dung</Text>
            </Divider>
            <Paragraph
              style={{
                fontSize: "15px",
                lineHeight: "1.6",
                color: "#434343",
                padding: "0 10px",
              }}
            >
              {selectedNoti.detail || selectedNoti.message}
            </Paragraph>

            {selectedNoti.metadata &&
              (selectedNoti.metadata.order_code ||
                selectedNoti.metadata.order_total ||
                selectedNoti.metadata.transaction_code ||
                selectedNoti.metadata.bank_name) && (
                <>
                  <Divider orientation="left" plain>
                    <Text type="secondary">Thông tin liên quan</Text>
                  </Divider>
                  <Descriptions
                    bordered
                    column={1}
                    size="small"
                    style={{ margin: "0 10px" }}
                  >
                    {selectedNoti.metadata.order_code && (
                      <Descriptions.Item label="Mã đơn hàng">
                        <Text copyable strong>
                          {selectedNoti.metadata.order_code}
                        </Text>
                      </Descriptions.Item>
                    )}
                    {selectedNoti.metadata.shop_name && (
                      <Descriptions.Item label="Cửa hàng">
                        {selectedNoti.metadata.shop_name}
                      </Descriptions.Item>
                    )}
                    {selectedNoti.metadata.order_total && (
                      <Descriptions.Item label="Giá trị đơn">
                        <Text type="danger" strong>
                          {formatVND(selectedNoti.metadata.order_total)}
                        </Text>
                      </Descriptions.Item>
                    )}
                    {selectedNoti.metadata.refund_amount && (
                      <Descriptions.Item label="Số tiền hoàn">
                        <Text type="success" strong>
                          {formatVND(selectedNoti.metadata.refund_amount)}
                        </Text>
                      </Descriptions.Item>
                    )}
                    {selectedNoti.metadata.bank_name && (
                      <Descriptions.Item label="Ngân hàng">
                        <Text strong>
                          {selectedNoti.metadata.bank_name}
                        </Text>
                      </Descriptions.Item>
                    )}
                    {selectedNoti.metadata.masked_account_number && (
                      <Descriptions.Item label="Số tài khoản">
                        <Text code strong>
                          {selectedNoti.metadata.masked_account_number}
                        </Text>
                      </Descriptions.Item>
                    )}
                    {selectedNoti.metadata.account_holder_name && (
                      <Descriptions.Item label="Chủ tài khoản">
                        <Text strong>
                          {selectedNoti.metadata.account_holder_name}
                        </Text>
                      </Descriptions.Item>
                    )}
                    {selectedNoti.metadata.transaction_code && (
                      <Descriptions.Item label="Mã giao dịch">
                        <Text copyable code strong style={{ color: "#52c41a" }}>
                          {selectedNoti.metadata.transaction_code}
                        </Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </>
              )}

            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Đã nhận lúc: {selectedNoti.time}
              </Text>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        .noti-item:hover {
          background-color: #f5f5f5 !important;
        }
      `}</style>
    </Card>
  );
}
