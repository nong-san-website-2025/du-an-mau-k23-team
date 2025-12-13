import React from "react";
import {
  Drawer,
  Avatar,
  Typography,
  Row,
  Col,
  Statistic,
  Descriptions,
  Tag,
  Divider,
  Button,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  SafetyCertificateFilled,
  ShopOutlined,
  HistoryOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const ShopDetailDrawer = ({ visible, onClose, shopData }) => {
  if (!shopData) return null;

  // Giả lập dữ liệu nếu API chưa trả về đủ (Bạn có thể map field từ API thật vào đây)
  const mockStats = {
    rating: 4.8,
    totalProducts: shopData.products ? shopData.products.length : 0,
    violationCount: 0, // Số lần vi phạm
    joinedDays: shopData.created_at
      ? Math.floor(
          (new Date() - new Date(shopData.created_at)) / (1000 * 60 * 60 * 24)
        )
      : 0,
  };

  return (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ShopOutlined /> Hồ sơ Người Bán
        </div>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
      extra={
        <Button
          type="primary"
          danger
          onClick={() => console.log("Khóa shop này")}
        >
          Khóa Shop này
        </Button>
      }
    >
      {/* 1. Header: Avatar & Tên */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <Avatar
          size={80}
          src={shopData.avatar}
          icon={<UserOutlined />}
          style={{ border: "2px solid #1890ff", marginBottom: "10px" }}
        />
        <Title level={3} style={{ margin: 0 }}>
          {shopData.shopName}
          <SafetyCertificateFilled
            style={{ color: "#52c41a", fontSize: "20px", marginLeft: "8px" }}
            title="Đã xác minh KYC"
          />
        </Title>
        <Text type="secondary">
          Tham gia: {mockStats.joinedDays} ngày trước
        </Text>
      </div>

      {/* 2. Thống kê nhanh */}
      <div
        style={{
          background: "#f5f5f5",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <Row gutter={16} style={{ textAlign: "center" }}>
          <Col span={8}>
            <Statistic
              title="Đánh giá"
              value={mockStats.rating}
              suffix="/ 5.0"
              valueStyle={{ color: "#faad14" }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Sản phẩm chờ duyệt"
              value={mockStats.totalProducts}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Vi phạm"
              value={mockStats.violationCount}
              valueStyle={{ color: "#cf1322" }}
              prefix={<HistoryOutlined />}
            />
          </Col>
        </Row>
      </div>

      {/* 3. Thông tin chi tiết */}
      <Descriptions title="Thông tin liên hệ" bordered column={1} size="small">
        <Descriptions.Item label="Chủ sở hữu">
          {shopData.ownerName}
        </Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">
          {shopData.phone}
        </Descriptions.Item>
        <Descriptions.Item label="Email">{shopData.email}</Descriptions.Item>
        <Descriptions.Item label="Địa chỉ">
          {shopData.address}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      {/* 4. Lịch sử hoạt động (Context quan trọng để duyệt) */}
      <Title level={5}>📋 Ghi chú của Admin</Title>
      <div
        style={{
          background: "#fffbe6",
          padding: "12px",
          border: "1px solid #ffe58f",
          borderRadius: "4px",
        }}
      >
        <Text type="warning">
          ⚠️ Shop mới tạo dưới 7 ngày. Vui lòng kiểm tra kỹ giá sản phẩm và mô
          tả xem có dấu hiệu lừa đảo (treo đầu dê bán thịt chó) không.
        </Text>
      </div>
    </Drawer>
  );
};

export default ShopDetailDrawer;
