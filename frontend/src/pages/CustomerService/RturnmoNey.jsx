import React from "react";
import { Card, Typography, Row, Col, Steps, Divider, Tag, Space } from "antd";
import {
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  DollarCircleOutlined
} from "@ant-design/icons";

const { Title, Paragraph, Text, Link } = Typography;

const steps = [
  {
    title: "Yêu cầu hoàn tiền",
    icon: <SyncOutlined style={{ color: "#16a34a", fontSize: 22 }} />,
    desc: "Liên hệ bộ phận hỗ trợ hoặc gửi yêu cầu hoàn tiền qua tài khoản cá nhân."
  },
  {
    title: "Xác minh & kiểm tra",
    icon: <CheckCircleOutlined style={{ color: "#16a34a", fontSize: 22 }} />,
    desc: "Cung cấp thông tin đơn hàng, lý do hoàn tiền và bằng chứng liên quan (nếu có)."
  },
  {
    title: "Phê duyệt & xử lý",
    icon: <DollarCircleOutlined style={{ color: "#16a34a", fontSize: 22 }} />,
    desc: "Đơn vị sẽ kiểm tra, xác nhận và tiến hành hoàn tiền nếu đủ điều kiện."
  },
  {
    title: "Hoàn tất giao dịch",
    icon: <CheckCircleOutlined style={{ color: "#16a34a", fontSize: 22 }} />,
    desc: "Tiền sẽ được chuyển về tài khoản ngân hàng hoặc ví điện tử của bạn trong 3-5 ngày làm việc."
  }
];

const RturnmoNey = () => (
  <div style={{ background: "#fff", minHeight: "100vh", padding: "40px 0" }}>
    <Row justify="center">
      <Col xs={24} md={20} lg={16}>
        <Card
          bordered={false}
          style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", background: "#fff" }}
        >
          <Title level={2} style={{ color: "#16a34a", textAlign: "center", marginBottom: 8 }}>
            Chính Sách Hoàn Tiền
          </Title>
          <Paragraph type="secondary" style={{ textAlign: "center", fontSize: 16, marginBottom: 32 }}>
            GreenFarm cam kết bảo vệ quyền lợi khách hàng với chính sách hoàn tiền minh bạch, nhanh chóng và thuận tiện.
          </Paragraph>

          <Divider />

          <Title level={4} style={{ color: "#14532d" }}>Các trường hợp được hoàn tiền</Title>
          <ul style={{ color: "#444", fontSize: 15, marginBottom: 24 }}>
            <li>Sản phẩm bị lỗi kỹ thuật, hư hỏng do nhà sản xuất hoặc giao nhầm.</li>
            <li>Đơn hàng bị hủy do hết hàng hoặc lý do khách quan từ phía GreenFarm.</li>
            <li>Khách hàng không nhận được hàng sau thời gian cam kết giao hàng.</li>
            <li>Khách hàng đã thanh toán nhưng không nhận được sản phẩm.</li>
          </ul>

          <Divider />

          <Title level={4} style={{ color: "#14532d" }}>Quy trình hoàn tiền</Title>
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

          <Title level={4} style={{ color: "#14532d" }}>Lưu ý quan trọng</Title>
          <ul style={{ color: "#444", fontSize: 15, marginBottom: 24 }}>
            <li>Thời gian xử lý hoàn tiền có thể thay đổi tùy theo ngân hàng hoặc ví điện tử.</li>
            <li>Chỉ hoàn tiền cho các trường hợp đáp ứng đủ điều kiện theo quy định của GreenFarm.</li>
            <li>Khách hàng cần cung cấp đầy đủ thông tin và bằng chứng liên quan khi yêu cầu hoàn tiền.</li>
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

export default RturnmoNey;
