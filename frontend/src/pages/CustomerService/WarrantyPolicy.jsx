import React from "react";
import {
  LockOutlined,
  SafetyCertificateOutlined,
  EyeInvisibleOutlined,
  MailOutlined,
} from "@ant-design/icons";
import {
  Card,
  Typography,
  Row,
  Col,
  Tag,
  Button,
  Divider,
  List,
  Space,
} from "antd";

const { Title, Paragraph, Text, Link } = Typography;

const PrivacyPolicyPage = () => {
  const handleSendEmail = () => {
    window.location.href = "mailto:support@nongsan.vn";
  };

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh", padding: "50px 0 70px" }}>
      <Row justify="center">
        <Col xs={24} md={20} lg={16}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              background: "#fff",
              padding: "40px 30px",
            }}
          >
            {/* 🌿 Header */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <SafetyCertificateOutlined style={{ fontSize: 48, color: "#16a34a" }} />
              <Title level={2} style={{ marginTop: 12, color: "#14532d" }}>
                Chính Sách Bảo Mật
              </Title>
              <Paragraph style={{ color: "#475569", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>
                NôngSản.vn cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của người dùng.
                Chúng tôi đảm bảo mọi thông tin của bạn được bảo mật tuyệt đối và chỉ sử dụng
                cho mục đích hợp pháp.
              </Paragraph>
            </div>

            <Divider />

            {/* 🔒 Nguyên tắc bảo mật */}
            <Title level={4}>1. Nguyên tắc bảo mật</Title>
            <List
              dataSource={[
                "Mọi thông tin cá nhân được mã hóa và lưu trữ an toàn.",
                "Không chia sẻ dữ liệu với bên thứ ba khi chưa có sự đồng ý.",
                "Thường xuyên kiểm tra và cập nhật hệ thống để tránh rò rỉ thông tin.",
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Text>• {item}</Text>
                </List.Item>
              )}
            />

            <Divider />

            {/* 🧭 Quyền của người dùng */}
            <Title level={4}>2. Quyền của người dùng</Title>
            <Paragraph>
              Người dùng có quyền yêu cầu truy cập, chỉnh sửa hoặc xóa thông tin cá nhân của mình.
              Mọi yêu cầu sẽ được xử lý nhanh chóng trong vòng 7 ngày làm việc.
            </Paragraph>

            <Divider />

            {/* 🧠 Mục đích thu thập thông tin */}
            <Title level={4}>3. Mục đích thu thập thông tin</Title>
            <List
              dataSource={[
                "Cung cấp dịch vụ, hỗ trợ và chăm sóc khách hàng tốt hơn.",
                "Phân tích dữ liệu để nâng cao trải nghiệm người dùng.",
                "Gửi thông tin khuyến mãi, bản tin mới (khi có sự đồng ý).",
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Text>• {item}</Text>
                </List.Item>
              )}
            />

            <Divider />

            {/* 🧩 Cách bảo vệ tài khoản */}
            <Title level={4}>4. Cách bảo vệ tài khoản của bạn</Title>
            <List
              dataSource={[
                "Không chia sẻ mật khẩu hoặc mã OTP với bất kỳ ai.",
                "Chỉ đăng nhập tại trang chính thức: https://nongsan.vn.",
                "Thoát khỏi tài khoản sau khi sử dụng thiết bị công cộng.",
                "Báo ngay cho NôngSản.vn nếu phát hiện truy cập trái phép.",
              ]}
              renderItem={(item, index) => (
                <List.Item>
                  <Text>{index + 1}. {item}</Text>
                </List.Item>
              )}
            />

            <Divider />

            {/* 📨 Liên hệ */}
            <Title level={4}>5. Liên hệ hỗ trợ bảo mật</Title>
            <Paragraph>
              Nếu bạn có thắc mắc hoặc cần hỗ trợ về bảo mật thông tin, vui lòng liên hệ với chúng tôi:
            </Paragraph>

            <Space direction="vertical" style={{ width: "100%", textAlign: "center" }}>
              <Tag
                color="green"
                style={{
                  color: "#14532d",
                  fontWeight: 600,
                  background: "#f6ffed",
                  borderRadius: 20,
                  padding: "6px 14px",
                  fontSize: 15,
                  margin: "0 auto",
                }}
              >
                <MailOutlined /> support@nongsan.vn
              </Tag>

              <Button
                icon={<MailOutlined />}
                size="large"
                onClick={handleSendEmail}
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 25,
                  padding: "8px 30px",
                  fontWeight: 600,
                  fontSize: 16,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#22c55e")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#16a34a")}
              >
                Gửi Gmail cho chúng tôi
              </Button>
            </Space>

            <Divider />

            <Paragraph type="secondary" style={{ textAlign: "center", marginTop: 20 }}>
              © 2025 NôngSản.vn – Mọi quyền được bảo lưu.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PrivacyPolicyPage;
