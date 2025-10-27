import React from "react";
import {
  LockOutlined,
  SafetyCertificateOutlined,
  EyeInvisibleOutlined,
  MailOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Card, Typography, Row, Col, Tag, Button } from "antd";

const { Title, Paragraph, Text } = Typography;

export default function PrivacyPolicyCompact() {
  return (
    <div
      style={{
        background: "#ffffff",
        minHeight: "100vh",
        padding: "60px 0 80px",
      }}
    >
      {/* 🌿 Header Section */}
      <Row justify="center" style={{ marginBottom: 50 }}>
        <Col xs={22} md={16} lg={10}>
          <Card
            bordered={false}
            style={{
              textAlign: "center",
              borderRadius: 24,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              padding: "40px 30px",
            }}
          >
            <SafetyCertificateOutlined
              style={{ fontSize: 54, color: "#16a34a" }}
            />
            <Title
              level={2}
              style={{
                color: "#14532d",
                marginTop: 12,
                marginBottom: 8,
              }}
            >
              Chính sách bảo mật NôngSản.vn
            </Title>
            <Paragraph
              style={{
                fontSize: 15,
                color: "#475569",
                maxWidth: 520,
                margin: "0 auto",
              }}
            >
              NôngSản.vn cam kết bảo vệ dữ liệu cá nhân của khách hàng, đảm bảo
              mọi thông tin được xử lý minh bạch, bảo mật và an toàn tuyệt đối.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      {/* 🔒 Nguyên tắc bảo mật */}
      <Row justify="center" gutter={[24, 24]} style={{ marginBottom: 40 }}>
        {[
          {
            icon: <LockOutlined style={{ fontSize: 28, color: "#16a34a" }} />,
            title: "Mã hóa dữ liệu",
            desc: "Mọi dữ liệu cá nhân được mã hóa và lưu trữ trên máy chủ bảo mật cao, ngăn chặn truy cập trái phép.",
          },
          {
            icon: (
              <EyeInvisibleOutlined style={{ fontSize: 28, color: "#16a34a" }} />
            ),
            title: "Tôn trọng quyền riêng tư",
            desc: "Chúng tôi không chia sẻ thông tin người dùng với bên thứ ba nếu không có sự đồng ý.",
          },
          {
            icon: (
              <SafetyCertificateOutlined
                style={{ fontSize: 28, color: "#16a34a" }}
              />
            ),
            title: "Giám sát & cập nhật",
            desc: "Hệ thống được kiểm tra, cập nhật thường xuyên để duy trì tính an toàn và bảo mật dữ liệu.",
          },
        ].map((item, i) => (
          <Col xs={24} md={8} key={i}>
            <Card
              bordered
              style={{
                borderRadius: 16,
                borderColor: "#d9f7be",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                padding: "26px 20px",
                height: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                {item.icon}
                <Title
                  level={4}
                  style={{
                    color: "#14532d",
                    marginBottom: 0,
                    fontSize: 17,
                  }}
                >
                  {item.title}
                </Title>
              </div>
              <Paragraph
                style={{
                  color: "#475569",
                  fontSize: 14,
                  marginBottom: 0,
                }}
              >
                {item.desc}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 🧭 Hướng dẫn bảo vệ tài khoản */}
      <Row justify="center" style={{ marginBottom: 60 }}>
        <Col xs={22} md={18} lg={14}>
          <Card
            bordered
            style={{
              borderRadius: 16,
              borderColor: "#d9f7be",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              padding: "30px 26px",
            }}
          >
            <Title
              level={3}
              style={{
                color: "#14532d",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Hướng dẫn bảo vệ tài khoản của bạn
            </Title>
            {[
              "Không chia sẻ mật khẩu hoặc mã OTP với bất kỳ ai.",
              "Chỉ đăng nhập tại website chính thức: https://nongsan.vn.",
              "Đăng xuất khỏi tài khoản khi sử dụng thiết bị công cộng.",
              "Báo ngay cho NôngSản.vn nếu phát hiện truy cập đáng ngờ.",
            ].map((tip, i) => (
              <Card
                key={i}
                type="inner"
                title={<Text>{tip}</Text>}
                style={{
                  marginBottom: 12,
                  borderRadius: 12,
                  background: "#f6ffed",
                }}
              />
            ))}
          </Card>
        </Col>
      </Row>

      {/* 📩 Liên hệ hỗ trợ */}
      <Row justify="center">
        <Col xs={22} md={14} lg={8}>
          <Card
            bordered
            style={{
              borderRadius: 16,
              borderColor: "#d9f7be",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              textAlign: "center",
              padding: "30px 18px",
            }}
          >
            <Title
              level={4}
              style={{
                color: "#14532d",
                marginBottom: 10,
                fontSize: 17,
              }}
            >
              Liên hệ hỗ trợ bảo mật
            </Title>
            <Paragraph style={{ color: "#237804", fontSize: 14 }}>
              Nếu bạn có câu hỏi hoặc cần hỗ trợ liên quan đến quyền riêng tư,
              vui lòng liên hệ với chúng tôi:
            </Paragraph>

            {/* ✅ Email căn giữa tuyệt đối */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                marginBottom: 12,
              }}
            >
              <Tag
                color="green"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  color: "#14532d",
                  fontWeight: 600,
                  background: "#e6f4ea",
                  borderRadius: 24,
                  padding: "10px 28px",
                  fontSize: 17,
                  boxShadow: "0 2px 8px rgba(22,163,74,0.08)",
                  border: "1.5px solid #b6e4c7",
                  minWidth: 320,
                }}
              >
                <MailOutlined style={{ fontSize: 20 }} />
                <span style={{ fontWeight: 700, textAlign: "center" }}>
                  support@nongsan.vn
                </span>
              </Tag>
            </div>

            {/* 📨 Nút Gửi Gmail */}
            <Button
              type="primary"
              icon={<SendOutlined />}
              size="large"
              style={{
                background: "#16a34a",
                borderColor: "#16a34a",
                borderRadius: 30,
                padding: "0 24px",
                marginTop: 12,
              }}
              onClick={() =>
                window.open(
                  "https://mail.google.com/mail/?view=cm&fs=1&to=support@nongsan.vn",
                  "_blank"
                )
              }
            >
              Gửi Email
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
