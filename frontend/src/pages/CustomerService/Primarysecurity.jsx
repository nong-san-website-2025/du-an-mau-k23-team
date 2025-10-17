import React from "react";
import {
  LockOutlined,
  SafetyCertificateOutlined,
  EyeInvisibleOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { Card, Typography, Row, Col, Tag } from "antd";

const { Title, Paragraph } = Typography;

export default function PrivacyPolicyNew() {
  return (
    <div
      style={{
        background: "#ffffff",
        minHeight: "100vh",
        padding: "50px 0 70px",
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
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              padding: "36px 20px",
              background: "#ffffff",
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
              NôngSản.vn cam kết bảo vệ dữ liệu cá nhân của khách hàng và đảm bảo
              mọi thông tin được xử lý minh bạch, bảo mật và an toàn tuyệt đối.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      {/* 🔒 Nguyên tắc bảo mật */}
      <Row justify="center" gutter={[24, 24]} style={{ marginBottom: 40 }}>
        {[
          {
            icon: <LockOutlined style={{ fontSize: 30, color: "#16a34a" }} />,
            title: "Mã hóa dữ liệu",
            desc: "Mọi dữ liệu cá nhân được mã hóa và lưu trữ trên máy chủ bảo mật cao.",
          },
          {
            icon: (
              <EyeInvisibleOutlined style={{ fontSize: 30, color: "#16a34a" }} />
            ),
            title: "Tôn trọng quyền riêng tư",
            desc: "Chúng tôi không chia sẻ thông tin của bạn với bên thứ ba khi chưa có sự đồng ý.",
          },
          {
            icon: (
              <SafetyCertificateOutlined
                style={{ fontSize: 30, color: "#16a34a" }}
              />
            ),
            title: "Giám sát liên tục",
            desc: "Hệ thống được kiểm tra, cập nhật và bảo trì định kỳ để ngăn chặn rủi ro bảo mật.",
          },
        ].map((item, i) => (
          <Col xs={24} md={8} key={i}>
            <Card
              bordered
              style={{
                borderRadius: 16,
                background: "#ffffff",
                borderColor: "#d9f7be",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                padding: "24px 18px",
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

      {/* 🧭 Hướng dẫn người dùng */}
      <Row justify="center" style={{ marginBottom: 50 }}>
        <Col xs={22} md={16} lg={10}>
          <Card
            bordered
            style={{
              borderRadius: 16,
              background: "#ffffff",
              borderColor: "#d9f7be",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              padding: "24px 18px",
            }}
          >
            <Title
              level={4}
              style={{
                color: "#14532d",
                marginBottom: 12,
                fontSize: 17,
              }}
            >
              Cách bảo vệ tài khoản của bạn
            </Title>
            <ul
              style={{
                paddingLeft: 18,
                color: "#237804",
                fontSize: 14,
                lineHeight: 2,
                marginBottom: 0,
              }}
            >
              <li>Không chia sẻ mật khẩu hoặc mã OTP với bất kỳ ai.</li>
              <li>
                Chỉ đăng nhập tại trang chính thức: <b>https://nongsan.vn</b>
              </li>
              <li>Thoát khỏi tài khoản sau khi sử dụng trên thiết bị công cộng.</li>
              <li>
                Báo ngay cho NôngSản.vn nếu phát hiện truy cập trái phép hoặc hành vi đáng ngờ.
              </li>
            </ul>
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
              background: "#ffffff",
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
              Nếu bạn có câu hỏi hoặc cần hỗ trợ liên quan đến bảo mật thông tin,
              vui lòng liên hệ với chúng tôi:
            </Paragraph>
            <Tag
              color="green"
              style={{
                color: "#14532d",
                fontWeight: 600,
                background: "#f6ffed",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 15,
                display: "block",
                margin: "0 auto 8px",
              }}
            >
              <MailOutlined /> support@nongsan.vn
            </Tag>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
