import React from "react";
import { Card, Typography, Row, Col, Steps, Divider, Tag, Space } from "antd";
import {
  WalletOutlined,
  DollarCircleOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  PhoneOutlined,
  MailOutlined
} from "@ant-design/icons";

const { Title, Paragraph, Text, Link } = Typography;

const steps = [
  {
    title: "Nạp tiền vào ví",
    icon: <DollarCircleOutlined style={{ color: "#16a34a", fontSize: 22 }} />,
    desc: "Chọn phương thức nạp tiền (VNPAY, ngân hàng, v.v.) và làm theo hướng dẫn để nạp tiền vào ví GreenFarm."
  },
  {
    title: "Thanh toán đơn hàng",
    icon: <WalletOutlined style={{ color: "#16a34a", fontSize: 22 }} />,
    desc: "Chọn ví GreenFarm làm phương thức thanh toán khi đặt hàng để giao dịch nhanh chóng, an toàn."
  },
  {
    title: "Rút tiền về tài khoản",
    icon: <SyncOutlined style={{ color: "#16a34a", fontSize: 22 }} />,
    desc: "Yêu cầu rút tiền từ ví về tài khoản ngân hàng bất cứ lúc nào, xử lý trong 1-3 ngày làm việc."
  },
  {
    title: "Bảo mật & hỗ trợ",
    icon: <SafetyCertificateOutlined style={{ color: "#16a34a", fontSize: 22 }} />,
    desc: "Mọi giao dịch đều được mã hóa, bảo mật và hỗ trợ 24/7 từ GreenFarm."
  }
];

const GreenFarmwallet = () => (
  <div style={{ background: "#fff", minHeight: "100vh", padding: "40px 0" }}>
    <Row justify="center">
      <Col xs={24} md={20} lg={16}>
        <Card
          bordered={false}
          style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", background: "#fff" }}
        >
          <Title level={2} style={{ color: "#16a34a", textAlign: "center", marginBottom: 8 }}>
            Ví GreenFarm
          </Title>
          <Paragraph type="secondary" style={{ textAlign: "center", fontSize: 16, marginBottom: 32 }}>
            Ví GreenFarm giúp bạn thanh toán, nạp/rút tiền và quản lý giao dịch một cách an toàn, tiện lợi trên nền tảng NôngSản.vn.
          </Paragraph>

          <Divider />

          <Title level={4} style={{ color: "#14532d" }}>Các tính năng nổi bật</Title>
          <ul style={{ color: "#444", fontSize: 15, marginBottom: 24 }}>
            <li>Nạp tiền nhanh chóng qua nhiều phương thức.</li>
            <li>Thanh toán đơn hàng an toàn, bảo mật.</li>
            <li>Rút tiền về tài khoản ngân hàng linh hoạt.</li>
            <li>Quản lý lịch sử giao dịch minh bạch, rõ ràng.</li>
          </ul>

          <Divider />

          <Title level={4} style={{ color: "#14532d" }}>Quy trình sử dụng ví</Title>
          <Steps
            direction="vertical"
            current={-1}
            items={steps.map(s => ({
              title: <Text strong style={{ color: "#166534", fontSize: 17 }}>{s.title}</Text>,
              description: <Paragraph style={{ color: "#4b5563" }}>{s.desc}</Paragraph>,
              icon: s.icon
            }))}
          />

          <Divider />

          <Title level={4} style={{ color: "#14532d" }}>Lưu ý khi sử dụng ví</Title>
          <ul style={{ color: "#444", fontSize: 15, marginBottom: 24 }}>
            <li>Chỉ sử dụng ví cho các giao dịch trên NôngSản.vn.</li>
            <li>Bảo mật thông tin tài khoản, không chia sẻ OTP/mật khẩu ví.</li>
            <li>Liên hệ hỗ trợ ngay nếu phát hiện giao dịch bất thường.</li>
          </ul>

          <Divider />

          <Title level={4} style={{ color: "#14532d" }}>Liên hệ hỗ trợ</Title>
          <Space direction="vertical">
            <Tag icon={<PhoneOutlined />} color="#16a34a" style={{ background: '#e6f4ea', color: '#16a34a', fontWeight: 600 }}>
              Hotline: <Link href="tel:0123456789" style={{ color: '#16a34a', fontWeight: 600 }}>0123 456 789</Link>
            </Tag>
            <Tag icon={<MailOutlined />} color="#16a34a" style={{ background: '#e6f4ea', color: '#16a34a', fontWeight: 600 }}>
              Email: <Link href="mailto:hotro@duan.com" style={{ color: '#16a34a', fontWeight: 600 }}>hotro@duan.com</Link>
            </Tag>
          </Space>
        </Card>
      </Col>
    </Row>
  </div>
);

export default GreenFarmwallet;
