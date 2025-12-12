import React from "react";
import {
  TeamOutlined,
  SolutionOutlined,
  RiseOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Typography, Row, Col, Space, Divider } from "antd";

const { Title, Paragraph, Text } = Typography;

const steps = [
  {
    icon: <SolutionOutlined style={{ fontSize: 22, color: "#16a34a" }} />,
    title: "Phát triển con người",
    desc: "NôngSản.vn đặt con người là trung tâm trong mọi chiến lược phát triển.",
  },
  {
    icon: <RiseOutlined style={{ fontSize: 22, color: "#16a34a" }} />,
    title: "Cơ hội thăng tiến",
    desc: "Luôn khuyến khích sáng tạo, học hỏi và phát triển nghề nghiệp lâu dài.",
  },
  {
    icon: <EnvironmentOutlined style={{ fontSize: 22, color: "#16a34a" }} />,
    title: "Văn hoá xanh",
    desc: "Làm việc xanh – sống xanh – cùng hướng tới nền nông nghiệp bền vững.",
  },
  {
    icon: <CheckCircleOutlined style={{ fontSize: 22, color: "#16a34a" }} />,
    title: "Cơ hội nghề nghiệp",
    desc: "Tham gia đội ngũ NôngSản.vn tại các vị trí: Kinh doanh, Marketing, Kỹ thuật.",
  },
];

export default function RecruitmentMinimal() {
  return (
    <div
      style={{
        background: "#fff",
        minHeight: "100vh",
        padding: "40px 0 60px",
      }}
    >
      {/* Header */}
      <Row justify="center" style={{ marginBottom: 30 }}>
        <Col xs={22} md={16} lg={10} style={{ textAlign: "center" }}>
          <TeamOutlined style={{ fontSize: 46, color: "#16a34a" }} />
          <Title level={2} style={{ color: "#14532d", marginTop: 10 }}>
            Tuyển Dụng Cùng NôngSản.vn
          </Title>
          <Paragraph style={{ color: "#475569", fontSize: 15 }}>
            Cùng chúng tôi xây dựng môi trường làm việc xanh – thân thiện – bền
            vững, nơi mỗi cá nhân đều được trân trọng và phát triển.
          </Paragraph>
        </Col>
      </Row>

      {/* Steps */}
      <Row justify="center">
        <Col xs={22} md={16} lg={10}>
          <Space
            direction="vertical"
            size="large"
            style={{ width: "100%", borderLeft: "2px solid #16a34a", paddingLeft: 16 }}
          >
            {steps.map((item, i) => (
              <div key={i}>
                <Space align="start" size="middle">
                  {item.icon}
                  <div>
                    <Text
                      strong
                      style={{
                        color: "#14532d",
                        fontSize: 15,
                        display: "block",
                      }}
                    >
                      {item.title}
                    </Text>
                    <Paragraph
                      style={{
                        color: "#475569",
                        fontSize: 14,
                        marginBottom: 0,
                      }}
                    >
                      {item.desc}
                    </Paragraph>
                  </div>
                </Space>
              </div>
            ))}
          </Space>
        </Col>
      </Row>

      {/* Contact */}
      <Divider style={{ margin: "50px auto 30px", width: "60%" }} />
      <Row justify="center">
        <Col xs={22} md={16} lg={8} style={{ textAlign: "center" }}>
          <Title level={4} style={{ color: "#14532d" }}>
            Liên hệ ứng tuyển
          </Title>
          <Paragraph style={{ color: "#237804", fontSize: 14, marginBottom: 10 }}>
            Gửi CV của bạn về email hoặc liên hệ hotline để được hỗ trợ nhanh nhất.
          </Paragraph>
          <Paragraph style={{ fontSize: 15, color: "#14532d", marginBottom: 6 }}>
            <MailOutlined /> tuyendung@nongsan.vn
          </Paragraph>
          <Paragraph style={{ fontSize: 15, color: "#14532d" }}>
            <PhoneOutlined /> 0123 456 789
          </Paragraph>
        </Col>
      </Row>
    </div>
  );
}
