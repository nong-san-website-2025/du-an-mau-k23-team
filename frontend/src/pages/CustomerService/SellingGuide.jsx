import React from "react";
import {
  UserAddOutlined,
  AppstoreAddOutlined,
  ShoppingOutlined,
  SafetyOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import {
  Card,
  Typography,
  Steps,
  Button,
  Divider,
  Row,
  Col,
} from "antd";
import { Link } from "react-router-dom";

export default function SellingGuide() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 64px" }}>
      {/* Header của Content */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <Typography.Title level={2} style={{ color: "#237804", marginTop: 0 }}>
          Hướng Dẫn Đăng Ký Bán Hàng
        </Typography.Title>
        <Typography.Paragraph
          type="secondary"
          style={{ fontSize: 16, maxWidth: 700, margin: "0 auto" }}
        >
          Dễ dàng trở thành người bán trên GreenFarm chỉ với vài bước đơn giản.
          Hãy cùng bắt đầu và mang sản phẩm của bạn đến hàng ngàn khách hàng tiềm năng!
        </Typography.Paragraph>
      </div>

      {/* Các bước hướng dẫn */}
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          marginBottom: 48,
        }}
      >
        <Steps
          direction="vertical"
          size="default"
          // current={-1} // Để không có bước nào đang active nếu chỉ muốn hiển thị list
          items={[
            {
              title: "Đăng ký tài khoản người bán",
              description:
                "Truy cập trang đăng ký, điền thông tin cá nhân và cửa hàng để tạo tài khoản bán hàng.",
              icon: <UserAddOutlined style={{ color: "#52c41a" }} />,
            },
            {
              title: "Đăng sản phẩm đầu tiên",
              description:
                'Vào mục "Quản lý sản phẩm" → chọn "Thêm sản phẩm mới" → nhập thông tin, hình ảnh và giá bán.',
              icon: <AppstoreAddOutlined style={{ color: "#52c41a" }} />,
            },
            {
              title: "Quản lý & xử lý đơn hàng",
              description:
                'Theo dõi đơn hàng trong mục "Đơn hàng", xác nhận & cập nhật trạng thái giao hàng.',
              icon: <ShoppingOutlined style={{ color: "#52c41a" }} />,
            },
            {
              title: "Tuân thủ chính sách & hỗ trợ",
              description:
                "Đọc kỹ chính sách bán hàng, đổi trả và liên hệ bộ phận hỗ trợ khi cần.",
              icon: <SafetyOutlined style={{ color: "#52c41a" }} />,
            },
          ]}
        />
      </Card>

      {/* Mẹo & chính sách */}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={14}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              height: "100%",
            }}
          >
            <Typography.Title level={4}>
              <QuestionCircleOutlined style={{ color: "#52c41a" }} /> Mẹo dành cho người bán mới
            </Typography.Title>
            <ul style={{ paddingLeft: 18, fontSize: 15, color: "#595959" }}>
              <li>Đặt tên sản phẩm rõ ràng, kèm từ khóa dễ tìm kiếm.</li>
              <li>Đăng ảnh sản phẩm thật, chất lượng cao.</li>
              <li>Phản hồi nhanh tin nhắn & đơn hàng để nâng cao uy tín.</li>
              <li>Thường xuyên cập nhật giá, số lượng và chương trình ưu đãi.</li>
            </ul>
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              textAlign: "center",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography.Title level={4} style={{ color: "#237804" }}>
              Sẵn sàng bắt đầu?
            </Typography.Title>
            <Typography.Paragraph type="secondary">
              Tạo tài khoản người bán chỉ mất vài phút.
            </Typography.Paragraph>
            <Link to="/register-seller">
              <Button
                type="primary"
                size="large"
                style={{
                  backgroundColor: "#52c41a",
                  borderColor: "#52c41a",
                  borderRadius: 24,
                  padding: "0 28px",
                }}
              >
                Đăng ký ngay
              </Button>
            </Link>
          </Card>
        </Col>
      </Row>

      <Divider />
      
      {/* Footer Note */}
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Typography.Text type="secondary" style={{ fontSize: 14 }}>
          Mọi thắc mắc vui lòng liên hệ{" "}
          <a href="mailto:support@greenfarm.vn">support@greenfarm.vn</a> hoặc
          hotline <Typography.Text strong>0123 456 789</Typography.Text>.
        </Typography.Text>
      </div>
    </div>
  );
}