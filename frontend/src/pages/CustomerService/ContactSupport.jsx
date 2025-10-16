import React from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Space,
  Tag,
} from "antd";
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
    title: "Hotline 0123 456 789",
    description: "Gọi miễn phí trong giờ hành chính.",
    action: "Gọi ngay",
    href: "tel:0123456789",
  },
  {
    icon: <MailOutlined />,
    title: "Email hỗ trợ",
    description: "Gửi thư đến info@greenfarm.vn, phản hồi trong 12 giờ.",
    action: "Gửi email",
    href: "mailto:info@greenfarm.vn",
  },
  {
    icon: <EnvironmentOutlined />,
    title: "Trung tâm GreenFarm",
    description: "Tầng 5, 123 Nguyễn Huệ, Quận 1, TP. HCM.",
    action: "Xem bản đồ",
    href: "https://maps.google.com",
  },
];

const officeHours = [
  { day: "Thứ 2 - Thứ 6", time: "08:00 - 22:00" },
  { day: "Thứ 7", time: "08:00 - 20:00" },
  { day: "Chủ nhật", time: "09:00 - 18:00" },
];

export default function ContactInfoOnly() {
  return (
    <div className="bg-gradient-to-b from-green-50 via-white to-white py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Tiêu đề */}
        <div className="text-center mb-12">
          <Tag color="green" className="px-4 py-1 text-base">
            Liên hệ hỗ trợ
          </Tag>
          <Title
            level={1}
            style={{
              color: "#166534",
              fontWeight: "900",
              marginTop: "16px",
            }}
          >
            Chúng tôi luôn lắng nghe bạn
          </Title>
          <Paragraph type="secondary" style={{ fontSize: "16px" }}>
            Hãy chọn phương thức liên hệ phù hợp. Đội ngũ chăm sóc khách hàng GreenFarm
            luôn sẵn sàng hỗ trợ bạn nhanh chóng và tận tâm.
          </Paragraph>
        </div>

        {/* Thông tin liên hệ */}
        <Row gutter={[32, 32]} justify="center" className="mb-12">
          {contactOptions.map((opt, i) => (
            <Col xs={24} sm={12} lg={8} key={i}>
              <Card
                hoverable
                bordered={false}
                className="shadow-md hover:shadow-xl transition-all rounded-2xl text-center"
                style={{
                  background: "rgba(255,255,255,0.9)",
                  border: "1px solid #d1fae5",
                  height: "100%",
                }}
              >
                <Space
                  direction="vertical"
                  size="small"
                  align="center"
                  style={{ width: "100%" }}
                >
                  <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-full text-green-600 text-2xl mb-2">
                    {opt.icon}
                  </div>
                  <Title level={4} style={{ color: "#14532d" }}>
                    {opt.title}
                  </Title>
                  <Paragraph style={{ color: "#4b5563", fontSize: "14px" }}>
                    {opt.description}
                  </Paragraph>
                  <a
                    href={opt.href || "#"}
                    className="text-green-600 font-semibold hover:underline"
                  >
                    {opt.action}
                  </a>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Lưu ý & Thời gian làm việc */}
        <Row gutter={[32, 32]}>
          <Col xs={24} md={12}>
            <Card
              title={
                <Space>
                  <InfoCircleOutlined className="text-green-600" />
                  <Text strong>Lưu ý</Text>
                </Space>
              }
              bordered={false}
              className="shadow-sm rounded-2xl"
              style={{
                border: "1px solid #d1fae5",
                background: "#f0fdf4",
              }}
            >
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-2">
                <li>
                  Thông tin của bạn được bảo mật theo chính sách quyền riêng tư GreenFarm.
                </li>
                <li>
                  Kiểm tra hộp thư spam nếu chưa nhận phản hồi sau 12 giờ làm việc.
                </li>
                <li>Yêu cầu khẩn, vui lòng gọi hotline để được hỗ trợ ngay.</li>
              </ul>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title={
                <Space>
                  <ClockCircleOutlined className="text-green-600" />
                  <Text strong>Thời gian làm việc</Text>
                </Space>
              }
              bordered={false}
              className="shadow-sm rounded-2xl"
              style={{ border: "1px solid #d1fae5" }}
            >
              <ul className="text-gray-700 text-sm space-y-2">
                {officeHours.map((o) => (
                  <li key={o.day} className="flex justify-between">
                    <span>{o.day}</span>
                    <span className="font-semibold text-green-700">{o.time}</span>
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
