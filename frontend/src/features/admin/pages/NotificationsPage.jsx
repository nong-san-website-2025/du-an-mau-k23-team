import React, { useState } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Card,
  Typography,
  Tooltip,
  Badge,
  Input,
  Select,
  Divider,
  message,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  BellOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const NotificationsPage = () => {
  const [loading, setLoading] = useState(false);

  // Dữ liệu mẫu (Data Source)
  const data = [
    {
      key: "1",
      type: "ORDER",
      title: "Đơn hàng mới #8829",
      content: "Khách hàng Nguyễn Văn A vừa đặt đơn hàng mới.",
      status: "unread",
      createdAt: "2025-12-18 10:00",
    },
    {
      key: "2",
      type: "SYSTEM",
      title: "Cập nhật hệ thống",
      content: "Hệ thống sẽ bảo trì vào lúc 2 giờ sáng mai.",
      status: "read",
      createdAt: "2025-12-17 15:30",
    },
  ];

  // Cấu hình các cột của bảng
  const columns = [
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type) => (
        <Tag color={type === "ORDER" ? "blue" : "gold"}>{type}</Tag>
      ),
    },
    {
      title: "Nội dung thông báo",
      key: "content",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong={record.status === "unread"}>{record.title}</Text>
          <Text type="secondary" size="small">
            {record.content}
          </Text>
        </Space>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Badge
          status={status === "unread" ? "processing" : "default"}
          text={status === "unread" ? "Chưa đọc" : "Đã đọc"}
        />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      render: () => (
        <Space>
          <Tooltip title="Xem">
            <Button type="text" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleTestTrigger = () => {
    message
      .loading("Đang gửi lệnh test...", 0.5)
      .then(() =>
        message.success("Đã bắn thông báo test! Check phía Client nhé.")
      );
  };

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Khối công cụ Test - Dành riêng cho bro */}
      <Card
        title={
          <Space>
            <SendOutlined />
            <span>Công cụ bắn thông báo Test</span>
          </Space>
        }
        style={{
          marginBottom: 24,
          borderRadius: 8,
          borderLeft: "4px solid #ff4d4f",
        }}
      >
        <Space size="middle">
          <Input placeholder="Tiêu đề test..." style={{ width: 250 }} />
          <Select defaultValue="ORDER" style={{ width: 150 }}>
            <Option value="ORDER">Đơn hàng</Option>
            <Option value="PROMO">Khuyến mãi</Option>
          </Select>
          <Button
            type="primary"
            danger
            icon={<SendOutlined />}
            onClick={handleTestTrigger}
          >
            Bắn thông báo sang Client
          </Button>
        </Space>
      </Card>

      {/* Bảng quản lý chính */}
      <Card bordered={false} style={{ borderRadius: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            <BellOutlined /> Danh sách thông báo
          </Title>
          <Space>
            <Button icon={<ReloadOutlined />}>Làm mới</Button>
            <Button type="primary" icon={<CheckCircleOutlined />}>
              Đọc tất cả
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
};

export default NotificationsPage;
