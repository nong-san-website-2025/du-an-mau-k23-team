import React from "react";
import { Card, Typography, Divider, Row, Col, Tag, Timeline } from "antd";
import { BookOutlined, FileProtectOutlined, TeamOutlined, AuditOutlined, SafetyCertificateOutlined, CheckCircleFilled } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const overviewCards = [
  {
    icon: BookOutlined,
    title: "Phạm vi áp dụng",
    description:
      "Điều khoản được áp dụng cho toàn bộ người dùng, đối tác và khách hàng sử dụng nền tảng GreenFarm.",
    bullets: [
      "Áp dụng cho tất cả dịch vụ trực tuyến và ngoại tuyến.",
      "Cập nhật định kỳ để phù hợp với quy định pháp luật.",
      "Thông báo trước khi triển khai thay đổi quan trọng.",
    ],
  },
  {
    icon: FileProtectOutlined,
    title: "Nguyên tắc vận hành",
    description:
      "GreenFarm vận hành minh bạch, đảm bảo quyền lợi của người tiêu dùng và nhà cung cấp.",
    bullets: [
      "Tôn trọng quyền riêng tư và dữ liệu cá nhân.",
      "Cam kết cung cấp thông tin chính xác, rõ ràng.",
      "Ưu tiên trải nghiệm mua sắm an toàn và liền mạch.",
    ],
  },
  {
    icon: SafetyCertificateOutlined,
    title: "Tuân thủ pháp lý",
    description:
      "Chúng tôi tuân thủ nghiêm túc các quy định pháp luật hiện hành tại Việt Nam.",
    bullets: [
      "Thực hiện đúng trách nhiệm bảo vệ người tiêu dùng.",
      "Cung cấp kênh hỗ trợ xử lý tranh chấp công bằng.",
      "Đảm bảo minh bạch hóa các chính sách và điều khoản.",
    ],
  },
];

const responsibilities = [
  {
    title: "Trách nhiệm của người dùng",
    items: [
      "Cung cấp thông tin chính xác khi đăng ký và cập nhật tài khoản.",
      "Không lạm dụng dịch vụ cho mục đích vi phạm pháp luật hoặc gây hại cộng đồng.",
      "Chủ động bảo vệ thông tin đăng nhập và báo cáo khi phát hiện rủi ro.",
    ],
  },
  {
    title: "Trách nhiệm của GreenFarm",
    items: [
      "Bảo vệ dữ liệu cá nhân theo đúng cam kết bảo mật.",
      "Duy trì hệ thống ổn định, liên tục cập nhật các biện pháp an toàn.",
      "Hỗ trợ và giải quyết thắc mắc trong thời gian sớm nhất có thể.",
    ],
  },
];

const updateTimeline = [
  {
    color: "#52c41a",
    dot: <CheckCircleFilled style={{ fontSize: 12 }} />,
    children: (
      <div>
        <Text strong>Thông báo cập nhật</Text>
        <Paragraph style={{ marginBottom: 0, color: "#595959" }}>
          Người dùng được thông báo thông qua email và trang chủ GreenFarm trước khi điều khoản mới có hiệu lực.
        </Paragraph>
      </div>
    ),
  },
  {
    color: "#389e0d",
    dot: <CheckCircleFilled style={{ fontSize: 12 }} />,
    children: (
      <div>
        <Text strong>Thời gian áp dụng</Text>
        <Paragraph style={{ marginBottom: 0, color: "#595959" }}>
          Điều khoản sẽ có hiệu lực sau 07 ngày kể từ ngày gửi thông báo, trừ khi có quy định khẩn cấp của pháp luật.
        </Paragraph>
      </div>
    ),
  },
  {
    color: "#237804",
    dot: <CheckCircleFilled style={{ fontSize: 12 }} />,
    children: (
      <div>
        <Text strong>Tiếp nhận phản hồi</Text>
        <Paragraph style={{ marginBottom: 0, color: "#595959" }}>
          Mọi phản hồi được tiếp nhận thông qua kênh hỗ trợ và sẽ được xem xét để điều chỉnh phù hợp.
        </Paragraph>
      </div>
    ),
  },
];

export default function Termsofservice() {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, #f6ffed 0%, #ffffff 100%)",
        minHeight: "100vh",
        padding: "64px 0",
      }}
    >
      <Row justify="center">
        <Col xs={22} lg={16}>
          <div
            style={{
              textAlign: "center",
              marginBottom: 48,
              background: "#ffffff",
              borderRadius: 24,
              boxShadow: "0 12px 40px rgba(28, 164, 73, 0.12)",
              padding: "48px 32px",
            }}
          >
            <Tag color="green" style={{ marginBottom: 12 }}>
              Phiên bản cập nhật 2025
            </Tag>
            <Title level={2} style={{ color: "#14532d", marginBottom: 16 }}>
              Điều Khoản Dịch Vụ GreenFarm
            </Title>
            <Paragraph style={{ fontSize: 16, color: "#4b5563", maxWidth: 640, margin: "0 auto" }}>
              Vui lòng đọc kỹ các điều khoản dưới đây khi sử dụng dịch vụ GreenFarm. Mỗi
              quy định được xây dựng nhằm bảo vệ quyền lợi người dùng và đảm bảo trải nghiệm mua sắm an toàn, minh bạch.
            </Paragraph>
          </div>
        </Col>
      </Row>

      <Row justify="center" gutter={[24, 24]}>
        {overviewCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Col key={card.title} xs={24} md={12} lg={8}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 20,
                  height: "100%",
                  boxShadow: "0 8px 24px rgba(24, 144, 255, 0.08)",
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "rgba(82, 196, 26, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <IconComponent style={{ fontSize: 28, color: "#3f8600" }} />
                </div>
                <Title level={4} style={{ color: "#245c2e" }}>
                  {card.title}
                </Title>
                <Paragraph style={{ color: "#595959", minHeight: 72 }}>{card.description}</Paragraph>
                <Divider style={{ margin: "16px 0" }} />
                <ul style={{ paddingLeft: 18, color: "#4a4a4a", marginBottom: 0 }}>
                  {card.bullets.map((item) => (
                    <li key={item} style={{ marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <CheckCircleFilled style={{ color: "#52c41a", fontSize: 14, marginTop: 4 }} />
                      <Text>{item}</Text>
                    </li>
                  ))}
                </ul>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Row justify="center" gutter={[24, 24]} style={{ marginTop: 32 }}>
        {responsibilities.map((group) => (
          <Col key={group.title} xs={24} md={12}>
            <Card
              bordered={false}
              style={{
                borderRadius: 20,
                height: "100%",
                background: "linear-gradient(135deg, rgba(82,196,26,0.08) 0%, #ffffff 100%)",
                boxShadow: "0 10px 32px rgba(12, 128, 56, 0.12)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <TeamOutlined style={{ fontSize: 24, color: "#3f8600" }} />
                <Title level={4} style={{ color: "#174c2a", marginBottom: 0 }}>
                  {group.title}
                </Title>
              </div>
              <Divider style={{ margin: "12px 0 20px" }} />
              <ul style={{ paddingLeft: 18, color: "#4a4a4a", marginBottom: 0 }}>
                {group.items.map((item) => (
                  <li key={item} style={{ marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <CheckCircleFilled style={{ color: "#389e0d", fontSize: 14, marginTop: 4 }} />
                    <Text>{item}</Text>
                  </li>
                ))}
              </ul>
            </Card>
          </Col>
        ))}
      </Row>

      <Row justify="center" style={{ marginTop: 32 }}>
        <Col xs={22} lg={16}>
          <Card
            bordered={false}
            style={{
              borderRadius: 20,
              boxShadow: "0 8px 24px rgba(16, 185, 129, 0.15)",
              background: "rgba(237, 255, 244, 0.85)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <AuditOutlined style={{ fontSize: 26, color: "#135200" }} />
              <Title level={4} style={{ color: "#135200", marginBottom: 0 }}>
                Quy trình cập nhật điều khoản
              </Title>
            </div>
            <Timeline items={updateTimeline} style={{ marginTop: 16 }} />
            <Divider />
            <Paragraph style={{ color: "#1f2937", textAlign: "center", marginBottom: 0 }}>
              Việc tiếp tục sử dụng dịch vụ sau khi điều khoản được cập nhật đồng nghĩa với việc bạn đồng ý và tuân thủ các nội dung được điều chỉnh.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
}