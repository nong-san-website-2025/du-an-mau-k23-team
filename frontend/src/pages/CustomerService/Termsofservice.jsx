import React from "react";
import {
  Card,
  Typography,
  Row,
  Col,
  Tag,
  Timeline,
  Space,
  Divider,
} from "antd";
import {
  FileProtectOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  AuditOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const sections = [
  {
    icon: <FileProtectOutlined style={{ fontSize: 26, color: "#16a34a" }} />,
    title: "Phạm vi áp dụng",
    desc: "Điều khoản này áp dụng cho tất cả người dùng khi truy cập và sử dụng các dịch vụ, sản phẩm hoặc tính năng trên nền tảng GreenFarm.",
  },
  {
    icon: <TeamOutlined style={{ fontSize: 26, color: "#16a34a" }} />,
    title: "Nghĩa vụ người dùng",
    desc: "Người dùng cam kết cung cấp thông tin chính xác, không sử dụng dịch vụ cho mục đích gian lận, vi phạm pháp luật hoặc gây hại đến hệ thống.",
  },
  {
    icon: <SafetyCertificateOutlined style={{ fontSize: 26, color: "#16a34a" }} />,
    title: "Quyền của GreenFarm",
    desc: "GreenFarm có quyền thay đổi, tạm ngừng hoặc chấm dứt dịch vụ khi cần thiết nhằm đảm bảo an toàn, bảo mật và tuân thủ quy định pháp luật.",
  },
  {
    icon: <AuditOutlined style={{ fontSize: 26, color: "#16a34a" }} />,
    title: "Bảo mật và quyền riêng tư",
    desc: "Thông tin cá nhân của người dùng được bảo mật tuyệt đối và chỉ sử dụng phục vụ mục đích giao dịch, chăm sóc khách hàng và cải thiện dịch vụ.",
  },
];

const timelineItems = [
  {
    color: "green",
    dot: <CheckCircleFilled />,
    children: (
      <>
        <Text strong>Thông báo thay đổi</Text>
        <Paragraph style={{ marginBottom: 0 }}>
          GreenFarm sẽ thông báo trước khi điều khoản mới có hiệu lực qua website hoặc email.
        </Paragraph>
      </>
    ),
  },
  {
    color: "green",
    dot: <CheckCircleFilled />,
    children: (
      <>
        <Text strong>Hiệu lực áp dụng</Text>
        <Paragraph style={{ marginBottom: 0 }}>
          Các điều khoản được áp dụng sau 07 ngày kể từ ngày công bố chính thức.
        </Paragraph>
      </>
    ),
  },
];

export default function TermsOfService() {
  return (
    <div
      style={{
        background: "#ffffff",
        minHeight: "100vh",
        padding: "64px 0",
      }}
    >
      <Row justify="center">
        <Col xs={22} lg={16}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              textAlign: "center",
              background: "#ffffff",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}
          >
            <Tag color="green" style={{ marginBottom: 8 }}>
              Cập nhật tháng 10/2025
            </Tag>
            <Title level={2} style={{ marginBottom: 12, color: "#14532d" }}>
              Điều Khoản Dịch Vụ GreenFarm
            </Title>
            <Paragraph style={{ color: "#595959", fontSize: 15 }}>
              Khi sử dụng các dịch vụ của GreenFarm, bạn đồng ý tuân thủ toàn bộ điều khoản dưới đây. 
              Vui lòng đọc kỹ trước khi tiếp tục sử dụng.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Row justify="center" gutter={[24, 24]} style={{ marginTop: 32 }}>
        {sections.map((item) => (
          <Col xs={24} md={12} key={item.title}>
            <Card
              bordered
              style={{
                borderRadius: 16,
                background: "#ffffff",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                height: "100%",
              }}
            >
              <Space align="center" size={14} style={{ marginBottom: 10 }}>
                {item.icon}
                <Title level={4} style={{ margin: 0, color: "#14532d" }}>
                  {item.title}
                </Title>
              </Space>
              <Paragraph style={{ color: "#595959" }}>{item.desc}</Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      <Row justify="center" style={{ marginTop: 32 }}>
        <Col xs={22} lg={16}>
          <Card
            bordered
            style={{
              borderRadius: 16,
              background: "#ffffff",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}
            title={
              <Space align="center">
                <AuditOutlined style={{ color: "#135200" }} />
                <Text strong style={{ color: "#135200" }}>
                  Cập nhật điều khoản
                </Text>
              </Space>
            }
          >
            <Timeline items={timelineItems} />
            <Divider />
            <Paragraph
              style={{
                textAlign: "center",
                marginBottom: 0,
                color: "#1f2937",
              }}
            >
              Việc tiếp tục sử dụng dịch vụ đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
