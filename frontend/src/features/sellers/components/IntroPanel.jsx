// IntroPanel.jsx
import React from "react";
import { Typography, Space } from "antd";
import { RocketOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export const IntroPanel = () => (
  <div
    style={{
      background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
      color: "#fff",
      padding: "60px 40px",
      borderRadius: "16px 0 0 16px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      height: "100%",
      minHeight: "600px",
    }}
  >
    <RocketOutlined style={{ fontSize: 60, marginBottom: 20 }} />
    <Title level={2} style={{ color: "#fff", margin: 0 }}>Đăng Ký Bán Hàng</Title>
    <Paragraph style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, marginTop: 10 }}>
      Tiếp cận hàng triệu khách hàng tiềm năng. Quản lý cửa hàng dễ dàng, doanh thu vượt trội.
    </Paragraph>
    <Space direction="vertical" size="large" style={{ marginTop: 40 }}>
      <Space><CheckCircleOutlined /> <Text style={{ color: "#fff" }}>Miễn phí mở gian hàng</Text></Space>
      <Space><CheckCircleOutlined /> <Text style={{ color: "#fff" }}>Hỗ trợ vận chuyển 63 tỉnh thành</Text></Space>
      <Space><CheckCircleOutlined /> <Text style={{ color: "#fff" }}>Thanh toán an toàn, minh bạch</Text></Space>
    </Space>
  </div>
);