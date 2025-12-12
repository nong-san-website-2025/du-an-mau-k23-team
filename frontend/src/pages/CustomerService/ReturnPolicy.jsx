import React from "react";
import {
  PhoneOutlined,
  MailOutlined,
  ReloadOutlined,
  FileSearchOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  Card,
  Typography,
  Divider,
  List,
  Steps,
  Tag,
  Space,
  Row,
  Col,
} from "antd";

const { Title, Paragraph, Text, Link } = Typography;

const ReturnPolicy = () => {
  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh", padding: "40px" }}>
      <Row justify="center">
        <Col xs={24} md={20} lg={16}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              background: "#fff",
            }}
          >
            <Space
              direction="vertical"
              size="large"
              style={{ width: "100%", textAlign: "justify" }}
            >
              {/* Header */}
              <div style={{ textAlign: "center" }}>
                <ReloadOutlined style={{ fontSize: 40, color: "#1890ff" }} />
                <Title level={2} style={{ marginTop: 10 }}>
                  Chính Sách Đổi / Trả Hàng
                </Title>
                <Paragraph type="secondary" style={{ fontSize: 16 }}>
                  Chúng tôi cam kết mang đến cho khách hàng trải nghiệm mua sắm
                  an toàn và hài lòng nhất. Vui lòng đọc kỹ chính sách dưới đây
                  để đảm bảo quyền lợi của bạn.
                </Paragraph>
              </div>

              <Divider />

              {/* Section 1 */}
              <Title level={4}>1. Điều kiện đổi / trả hàng</Title>
              <List
                dataSource={[
                  "Sản phẩm còn nguyên tem, nhãn mác, chưa qua sử dụng.",
                  "Yêu cầu đổi/trả trong vòng 7 ngày kể từ ngày nhận hàng.",
                  "Có hóa đơn mua hàng hoặc mã đơn hàng hợp lệ.",
                  "Sản phẩm bị lỗi kỹ thuật, hư hỏng do nhà sản xuất hoặc giao nhầm.",
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <Text>• {item}</Text>
                  </List.Item>
                )}
              />

              <Divider />

              {/* Section 2 */}
              <Title level={4}>2. Quy trình đổi / trả hàng</Title>
              <Steps
                direction="vertical"
                current={-1}
                items={[
                  {
                    title: "Liên hệ hỗ trợ",
                    description:
                      "Liên hệ bộ phận chăm sóc khách hàng qua hotline hoặc email.",
                    icon: <PhoneOutlined />,
                  },
                  {
                    title: "Cung cấp thông tin",
                    description:
                      "Gửi thông tin đơn hàng và hình ảnh sản phẩm lỗi.",
                    icon: <FileSearchOutlined />,
                  },
                  {
                    title: "Xác nhận & gửi hàng",
                    description:
                      "Nhận xác nhận và gửi sản phẩm về địa chỉ kho của chúng tôi.",
                  },
                  {
                    title: "Hoàn tất đổi/trả",
                    description:
                      "Sau khi kiểm tra, chúng tôi sẽ đổi hoặc hoàn tiền trong vòng 3–5 ngày làm việc.",
                  },
                ]}
              />

              <Divider />

              {/* Section 3 */}
              <Title level={4}>3. Lưu ý quan trọng</Title>
              <List
                dataSource={[
                  "Không áp dụng đổi/trả với các sản phẩm khuyến mãi, giảm giá đặc biệt.",
                  "Phí vận chuyển đổi/trả sẽ do khách hàng chi trả (trừ trường hợp lỗi từ phía chúng tôi).",
                  "Chúng tôi có quyền từ chối đổi/trả nếu sản phẩm không đáp ứng điều kiện.",
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <ExclamationCircleOutlined
                      style={{ color: "#faad14", marginRight: 8 }}
                    />
                    <Text>{item}</Text>
                  </List.Item>
                )}
              />

              <Divider />

              {/* Contact */}
              <Title level={4}>Liên hệ hỗ trợ</Title>
              <Paragraph>
                Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ:
              </Paragraph>
              <Space direction="vertical">
                <Tag icon={<PhoneOutlined />} color="blue">
                  Hotline: <Link href="tel:0123456789">0123 456 789</Link>
                </Tag>
                <Tag icon={<MailOutlined />} color="green">
                  Email:{" "}
                  <Link href="mailto:hotro@duan.com">hotro@duan.com</Link>
                </Tag>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
export default ReturnPolicy;
