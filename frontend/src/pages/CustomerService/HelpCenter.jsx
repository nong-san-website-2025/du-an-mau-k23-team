import React from "react";
import {
  SearchOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
  SafetyOutlined,
  CustomerServiceOutlined,
  ClockCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import {
  Layout,
  Row,
  Col,
  Card,
  Input,
  Button,
  Typography,
  Collapse,
  Space,
  Divider,
} from "antd";

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const categories = [
  {
    icon: <ShoppingCartOutlined />,
    title: "Đặt hàng & thanh toán",
    links: ["Cách đặt hàng", "Áp dụng mã giảm giá", "Phương thức thanh toán"],
  },
  {
    icon: <TruckOutlined />,
    title: "Giao hàng & theo dõi",
    links: ["Theo dõi đơn hàng", "Thay đổi địa chỉ", "Giao trễ xử lý ra sao"],
  },
  {
    icon: <SafetyOutlined />,
    title: "Hoàn trả & bảo hành",
    links: ["Điều kiện đổi trả", "Gửi yêu cầu bảo hành", "Hoàn tiền"],
  },
];

const quickHelp = [
  {
    q: "Tôi có thể đổi trả sản phẩm trong bao lâu?",
    a: "Bạn có thể yêu cầu đổi trả trong vòng 7 ngày kể từ khi nhận hàng (tùy theo nhóm sản phẩm).",
  },
  {
    q: "Làm sao để kiểm tra trạng thái đơn hàng?",
    a: 'Truy cập mục "Đơn hàng của tôi" để xem trạng thái cập nhật theo thời gian thực.',
  },
  {
    q: "GreenFarm hỗ trợ thanh toán nào?",
    a: "Tiền mặt, chuyển khoản, ví điện tử và thanh toán qua VNPAY.",
  },
];

const contactChannels = [
  {
    icon: <CustomerServiceOutlined />,
    title: "Chat trực tuyến",
    desc: "Hỗ trợ viên sẵn sàng từ 8:00 - 22:00 hằng ngày.",
    btn: "Chat ngay",
  },
  {
    icon: <PhoneOutlined />,
    title: "Hotline 0123 456 789",
    desc: "Gọi miễn phí trong giờ hành chính.",
    btn: "Gọi ngay",
  },
  {
    icon: <MailOutlined />,
    title: "Email hỗ trợ",
    desc: "Gửi thư đến info@greenfarm.vn (phản hồi trong 12 giờ).",
    btn: "Gửi email",
  },
];

export default function HelpCenter() {
  return (
    <Layout style={{ background: "#fff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Title level={2} style={{ color: "#237804" }}>
            Trung tâm trợ giúp GreenFarm
          </Title>
          <Paragraph type="secondary" style={{ fontSize: 16, maxWidth: 600, margin: "0 auto" }}>
            Giải đáp nhanh mọi thắc mắc về mua hàng, giao nhận và chính sách khách hàng.
          </Paragraph>

          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm câu hỏi (vd: đổi trả, bảo hành...)"
            style={{
              maxWidth: 480,
              marginTop: 20,
              borderRadius: 24,
              padding: 8,
            }}
          />
        </div>

        {/* Categories */}
        <Row gutter={[24, 24]}>
          {categories.map((c) => (
            <Col xs={24} md={8} key={c.title}>
              <Card
                hoverable
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <Space align="center" style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      background: "#f6ffed",
                      borderRadius: "50%",
                      padding: 10,
                      color: "#52c41a",
                      fontSize: 18,
                    }}
                  >
                    {c.icon}
                  </div>
                  <Text strong>{c.title}</Text>
                </Space>
                <ul style={{ paddingLeft: 0, listStyle: "none" }}>
                  {c.links.map((l) => (
                    <li key={l} style={{ marginBottom: 6 }}>
                      <LinkOutlined /> <a href="#">{l}</a>
                    </li>
                  ))}
                </ul>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[32, 32]} style={{ marginTop: 48 }}>
          {/* FAQ */}
          <Col xs={24} md={14}>
            <Card
              title={
                <Space>
                  <QuestionCircleOutlined style={{ color: "#52c41a" }} />
                  <Text strong>Câu hỏi thường gặp</Text>
                </Space>
              }
              bordered={false}
              style={{ borderRadius: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
            >
              <Collapse bordered={false} ghost>
                {quickHelp.map((item) => (
                  <Panel header={item.q} key={item.q}>
                    <Paragraph>{item.a}</Paragraph>
                  </Panel>
                ))}
              </Collapse>
            </Card>
          </Col>

          {/* Contact */}
          <Col xs={24} md={10}>
            <Card
              title={
                <Space>
                  <MessageOutlined style={{ color: "#52c41a" }} />
                  <Text strong>Liên hệ hỗ trợ</Text>
                </Space>
              }
              bordered={false}
              style={{ borderRadius: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                {contactChannels.map((ch) => (
                  <Card
                    key={ch.title}
                    size="small"
                    bordered={false}
                    style={{
                      background: "#f6ffed",
                      borderRadius: 12,
                    }}
                  >
                    <Space align="start">
                      <div
                        style={{
                          background: "#fff",
                          padding: 8,
                          borderRadius: "50%",
                          color: "#52c41a",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                        }}
                      >
                        {ch.icon}
                      </div>
                      <div>
                        <Text strong>{ch.title}</Text>
                        <Paragraph type="secondary" style={{ marginTop: 4, fontSize: 13 }}>
                          {ch.desc}
                        </Paragraph>
                        <Button size="small" style={{ borderColor: "#52c41a", color: "#237804" }}>
                          {ch.btn}
                        </Button>
                      </div>
                    </Space>
                  </Card>
                ))}
              </Space>
              <Divider />
              <Paragraph style={{ textAlign: "center" }}>
                <ClockCircleOutlined /> Hỗ trợ: <Text strong>08:00 - 22:00</Text> (Thứ 2 - CN)
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>
    </Layout>
  );
}
