import React from "react";
import { Typography, Collapse, Card, Row, Col } from "antd";
import {
  QuestionCircleOutlined,
  DollarCircleOutlined,
  CreditCardOutlined,
  LockOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

export default function FAQPage() {
  return (
    <div
      style={{
        background: "#fff",
        minHeight: "100vh",
        padding: "60px 0 100px 0",
      }}
    >
      <Row justify="center">
        <Col xs={24} md={20} lg={12}>
          {/* Tiêu đề trang */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <Title
              level={2}
              style={{
                color: "#16a34a",
                marginBottom: 8,
                fontWeight: 700,
              }}
            >
              Câu Hỏi Thường Gặp
            </Title>
            <Paragraph
              style={{
                fontSize: 16,
                color: "#475569",
                maxWidth: 520,
                margin: "0 auto",
              }}
            >
              Giải đáp nhanh các thắc mắc phổ biến khi mua sắm tại{" "}
              <strong>NôngSản.vn</strong> — giúp bạn trải nghiệm thuận tiện và an
              tâm hơn.
            </Paragraph>
          </div>

          {/* Khối Câu hỏi */}
          <Card
            style={{
              background: "#f6ffed",
              borderRadius: 16,
              boxShadow: "0 2px 8px rgba(22,163,74,0.08)",
              border: "1.5px solid #b6e4c7",
              padding: "32px 18px",
            }}
          >
            <Collapse
              accordion
              expandIconPosition="end"
              style={{
                background: "transparent",
                borderRadius: 12,
                fontSize: 16,
              }}
            >
              <Panel
                header={
                  <>
                    <QuestionCircleOutlined
                      style={{ color: "#16a34a", marginRight: 8 }}
                    />
                    Làm sao để đặt hàng trên NôngSản.vn?
                  </>
                }
                key="1"
                style={{ fontWeight: 600 }}
              >
                <Text style={{ color: "#444", fontSize: 15 }}>
                  Để đặt hàng, bạn chỉ cần đăng nhập tài khoản, chọn sản phẩm muốn
                  mua, thêm vào giỏ và nhấn “Thanh toán”. Hệ thống sẽ hướng dẫn chi
                  tiết từng bước.
                </Text>
              </Panel>

              <Panel
                header={
                  <>
                    <DollarCircleOutlined
                      style={{ color: "#16a34a", marginRight: 8 }}
                    />
                    Tôi có thể thanh toán bằng phương thức nào?
                  </>
                }
                key="2"
                style={{ fontWeight: 600 }}
              >
                <Text style={{ color: "#444", fontSize: 15 }}>
                  Bạn có thể thanh toán qua <strong>VNPAY, Momo</strong> hoặc
                  chuyển khoản ngân hàng. Tất cả giao dịch đều được mã hóa và bảo
                  mật.
                </Text>
              </Panel>

              <Panel
                header={
                  <>
                    <CreditCardOutlined
                      style={{ color: "#16a34a", marginRight: 8 }}
                    />
                    Làm sao để nạp/rút tiền từ ví GreenFarm?
                  </>
                }
                key="3"
                style={{ fontWeight: 600 }}
              >
                <Text style={{ color: "#444", fontSize: 15 }}>
                  Vào mục “Ví của tôi” trong tài khoản để nạp hoặc rút tiền. Giao
                  dịch sẽ được xử lý trong vòng 24h làm việc.
                </Text>
              </Panel>

              <Panel
                header={
                  <>
                    <LockOutlined style={{ color: "#16a34a", marginRight: 8 }} />
                    Thông tin cá nhân của tôi có được bảo mật không?
                  </>
                }
                key="4"
                style={{ fontWeight: 600 }}
              >
                <Text style={{ color: "#444", fontSize: 15 }}>
                  Toàn bộ thông tin cá nhân và thanh toán được bảo mật bằng công
                  nghệ SSL. NôngSản.vn cam kết không chia sẻ cho bên thứ ba.
                </Text>
              </Panel>

              <Panel
                header={
                  <>
                    <InfoCircleOutlined
                      style={{ color: "#16a34a", marginRight: 8 }}
                    />
                    Tôi cần hỗ trợ, liên hệ ở đâu?
                  </>
                }
                key="5"
                style={{ fontWeight: 600 }}
              >
                <Text style={{ color: "#444", fontSize: 15 }}>
                  Bạn có thể liên hệ qua hotline{" "}
                  <strong>1900 9999</strong> hoặc email{" "}
                  <strong>support@nongsan.vn</strong> để được hỗ trợ nhanh nhất.
                </Text>
              </Panel>
            </Collapse>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
