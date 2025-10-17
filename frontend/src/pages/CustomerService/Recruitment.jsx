import React from "react";
import {
  TeamOutlined,
  SolutionOutlined,
  RiseOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { Card, Typography, Row, Col, Tag } from "antd";

const { Title, Paragraph, Text } = Typography;

const values = [
  {
    icon: <SolutionOutlined style={{ fontSize: 28, color: "#16a34a" }} />,
    title: "Phát triển con người",
    desc: "Con người là yếu tố cốt lõi giúp NôngSản.vn phát triển bền vững.",
  },
  {
    icon: <RiseOutlined style={{ fontSize: 28, color: "#16a34a" }} />,
    title: "Cơ hội thăng tiến",
    desc: "Môi trường khuyến khích học hỏi, sáng tạo và phát triển nghề nghiệp.",
  },
  {
    icon: <EnvironmentOutlined style={{ fontSize: 28, color: "#16a34a" }} />,
    title: "Văn hoá xanh",
    desc: "Làm việc xanh – sống xanh – hướng đến nông nghiệp bền vững Việt Nam.",
  },
];

const openings = [
  {
    role: "Nhân viên Kinh doanh",
    description: "Phụ trách mở rộng khách hàng và phát triển thị trường.",
    type: "Full-time",
  },
  {
    role: "Chuyên viên Marketing",
    description: "Xây dựng chiến lược truyền thông và thương hiệu sản phẩm nông sản sạch.",
    type: "Full-time",
  },
  {
    role: "Kỹ thuật Nông nghiệp",
    description: "Giám sát quy trình sản xuất, đảm bảo chất lượng và hỗ trợ kỹ thuật nông dân.",
    type: "On-site",
  },
];

export default function Recruitment() {
  return (
    <div
      style={{
        background: "#ffffff",
        minHeight: "100vh",
        padding: "50px 0 80px",
      }}
    >
      {/* 🌿 Header */}
      <Row justify="center" style={{ marginBottom: 40 }}>
        <Col xs={22} md={16} lg={10}>
          <Card
            bordered={false}
            style={{
              textAlign: "center",
              borderRadius: 24,
              background: "#ffffff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              padding: "36px 20px",
            }}
          >
            <TeamOutlined style={{ fontSize: 54, color: "#16a34a" }} />
            <Title level={2} style={{ color: "#14532d", marginTop: 12 }}>
              Tuyển dụng NôngSản.vn
            </Title>
            <Paragraph style={{ color: "#475569", fontSize: 15 }}>
              Cùng NôngSản.vn xây dựng môi trường làm việc xanh – thân thiện – phát triển bền vững,
              nơi mỗi cá nhân đều được trân trọng và có cơ hội tỏa sáng.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      {/* 🌱 Giá trị cốt lõi */}
      <Row justify="center" gutter={[24, 24]} style={{ marginBottom: 40 }}>
        {values.map((item, i) => (
          <Col xs={24} md={8} key={i}>
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                padding: "24px 20px",
                background: "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                height: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                {item.icon}
                <Title
                  level={4}
                  style={{
                    color: "#14532d",
                    fontSize: 17,
                    marginBottom: 0,
                  }}
                >
                  {item.title}
                </Title>
              </div>
              <Paragraph style={{ color: "#475569", fontSize: 14 }}>
                {item.desc}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 💼 Vị trí tuyển dụng */}
      <Row justify="center" style={{ marginBottom: 20 }}>
        <Col xs={22} md={16} lg={10}>
          <Title
            level={3}
            style={{
              color: "#14532d",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            Vị trí đang tuyển
          </Title>
        </Col>
      </Row>

      <Row gutter={[16, 16]} justify="center" style={{ maxWidth: 900, margin: "0 auto" }}>
        {openings.map((job, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <Card
              bordered
              style={{
                borderRadius: 12,
                textAlign: "center",
                borderColor: "#b7eb8f",
                background: "#ffffff",
                height: "100%",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                padding: "18px 12px",
              }}
            >
              <Title level={5} style={{ color: "#237804", marginBottom: 6 }}>
                {job.role}
              </Title>
              <Paragraph
                style={{
                  color: "#555",
                  fontSize: 14,
                  marginBottom: 10,
                  minHeight: 40,
                }}
              >
                {job.description}
              </Paragraph>
              <Tag
                color="green"
                style={{
                  fontWeight: 600,
                  background: "#eaffea",
                  color: "#237804",
                  fontSize: 13,
                  borderRadius: 20,
                  padding: "3px 14px",
                }}
              >
                {job.type}
              </Tag>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 📩 Thông tin liên hệ */}
      <Row justify="center" style={{ marginTop: 50 }}>
        <Col xs={22} md={14} lg={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              textAlign: "center",
              background: "#f6ffed",
              padding: "30px 20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            <Title
              level={4}
              style={{ color: "#14532d", marginBottom: 10, fontSize: 17 }}
            >
              Ứng tuyển ngay hôm nay
            </Title>
            <Paragraph style={{ color: "#237804", fontSize: 14 }}>
              Gửi CV của bạn về địa chỉ email bên dưới hoặc liên hệ hotline để được hỗ trợ nhanh nhất.
            </Paragraph>
            <Tag
              color="green"
              style={{
                color: "#14532d",
                fontWeight: 600,
                background: "#eaffea",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 15,
                display: "block",
                margin: "0 auto 8px",
              }}
            >
              <MailOutlined /> tuyendung@nongsan.vn
            </Tag>
            <Text style={{ color: "#14532d", fontSize: 15 }}>
              <PhoneOutlined /> 0123 456 789
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
