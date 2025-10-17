import React from "react";
import { Row, Col, Card, Typography, Space, Button, Divider } from "antd";
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const contactOptions = [
  {
    icon: <PhoneOutlined />,
    title: "Hotline hỗ trợ",
    description: "Liên hệ trực tiếp để được tư vấn nhanh chóng và chính xác.",
    action: "Gọi ngay",
    href: "tel:0123456789",
    color: "#16a34a",
  },
  {
    icon: <MailOutlined />,
    title: "Email liên hệ",
    description: "Gửi thư đến info@nongsan.vn, phản hồi trong vòng 12 giờ.",
    action: "Gửi email",
    href: "mailto:info@nongsan.vn",
    color: "#2563eb",
  },
  {
    icon: <EnvironmentOutlined />,
    title: "Văn phòng NôngSản.vn",
    description: "Quận Ninh Kiều, TP. Cần Thơ.",
    action: "Xem bản đồ",
    href: "https://maps.google.com",
    color: "#f59e0b",
  },
];

const officeHours = [
  { day: "Thứ 2 - Thứ 6", time: "08:00 - 22:00" },
  { day: "Thứ 7", time: "08:00 - 20:00" },
  { day: "Chủ nhật", time: "09:00 - 18:00" },
];

export default function ContactSupport() {
  return (
    <div style={{ background: "#ffffff", padding: "60px 20px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* 🌿 Tiêu đề chính */}
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <Title level={2} style={{ color: "#166534", fontWeight: 800 }}>
            Liên hệ & Hỗ trợ khách hàng
          </Title>
          <Paragraph style={{ color: "#4b5563", fontSize: 16 }}>
            Chúng tôi luôn sẵn sàng hỗ trợ bạn trong mọi vấn đề liên quan đến đơn hàng,
            tài khoản và dịch vụ của NôngSản.vn.
          </Paragraph>
        </div>

        {/* 📞 Các kênh liên hệ */}
        <Row gutter={[24, 24]} justify="center">
          {contactOptions.map((opt, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card
                hoverable
                bordered={false}
                style={{
                  borderRadius: 16,
                  padding: "20px 10px",
                  textAlign: "center",
                  background: "#f9fafb",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  transition: "all 0.3s",
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    color: opt.color,
                    marginBottom: 12,
                  }}
                >
                  {opt.icon}
                </div>
                <Title
                  level={5}
                  style={{ color: "#14532d", fontWeight: 700, marginBottom: 8 }}
                >
                  {opt.title}
                </Title>
                <Paragraph style={{ color: "#4b5563", fontSize: 14, minHeight: 40 }}>
                  {opt.description}
                </Paragraph>
                <Button
                  type="primary"
                  size="middle"
                  href={opt.href}
                  style={{
                    backgroundColor: opt.color,
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 500,
                    marginTop: 10,
                  }}
                >
                  {opt.action}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 🕓 Thông tin thêm */}
        <Divider style={{ margin: "60px 0 40px 0" }} />
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                background: "#f0fdf4",
                border: "1px solid #dcfce7",
                height: "100%",
              }}
              title={
                <Space>
                  <InfoCircleOutlined style={{ color: "#16a34a" }} />
                  <Text strong style={{ color: "#14532d" }}>
                    Lưu ý khi liên hệ
                  </Text>
                </Space>
              }
            >
              <ul style={{ color: "#374151", fontSize: 14, lineHeight: 1.8, paddingLeft: 20 }}>
                <li>Thông tin của bạn được bảo mật tuyệt đối theo chính sách quyền riêng tư.</li>
                <li>Nếu chưa nhận phản hồi sau 12 giờ, hãy kiểm tra thư mục spam hoặc gọi hotline.</li>
                <li>Với yêu cầu khẩn cấp, vui lòng chọn liên hệ qua điện thoại.</li>
              </ul>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                background: "#ffffff",
                border: "1px solid #dcfce7",
                height: "100%",
              }}
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: "#16a34a" }} />
                  <Text strong style={{ color: "#14532d" }}>
                    Thời gian làm việc
                  </Text>
                </Space>
              }
            >
              <ul style={{ color: "#374151", fontSize: 14, lineHeight: 1.8 }}>
                {officeHours.map((o) => (
                  <li
                    key={o.day}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom: "1px dashed #e5e7eb",
                      padding: "4px 0",
                    }}
                  >
                    <span>{o.day}</span>
                    <span style={{ fontWeight: 600, color: "#16a34a" }}>{o.time}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
