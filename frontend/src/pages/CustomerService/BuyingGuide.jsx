import React from "react";
import { Card, Typography, Row, Col, Steps, Divider } from "antd";
import {
  ShoppingCartOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const steps = [
  {
    icon: <ShoppingCartOutlined style={{ fontSize: 26, color: "#16a34a" }} />,
    title: "Chọn sản phẩm yêu thích",
    desc: "Tìm kiếm và chọn những nông sản tươi ngon, sạch và đạt chuẩn VietGAP trên NôngSản.vn.",
  },
  {
    icon: <ShoppingOutlined style={{ fontSize: 26, color: "#16a34a" }} />,
    title: "Kiểm tra giỏ hàng",
    desc: "Xem lại số lượng, đơn giá, loại sản phẩm và tổng tiền trước khi tiến hành thanh toán.",
  },
  {
    icon: <CreditCardOutlined style={{ fontSize: 26, color: "#16a34a" }} />,
    title: "Thanh toán qua VNPAY",
    desc: "Hỗ trợ thanh toán an toàn, nhanh chóng và tiện lợi qua cổng VNPAY – bảo mật tuyệt đối.",
  },
  {
    icon: <TruckOutlined style={{ fontSize: 26, color: "#16a34a" }} />,
    title: "Giao hàng tận nơi",
    desc: "Đơn hàng được giao tận tay nhanh chóng – đảm bảo tươi mới từ nông trại đến bàn ăn.",
  },
  {
    icon: <CheckCircleOutlined style={{ fontSize: 26, color: "#16a34a" }} />,
    title: "Nhận hàng & đánh giá",
    desc: "Kiểm tra sản phẩm, gửi đánh giá để nhận ưu đãi tích điểm cho lần mua tiếp theo.",
  },
];

const BuyingGuideAntd = () => {
  return (
    <div style={{ background: "#fff", paddingBottom: 60 }}>
      {/* 🌿 Tiêu đề chính */}
      <div
        style={{
          background: "white",
          color: "#166534",
          textAlign: "center",
          padding: "60px 20px 40px 20px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Title level={1} style={{ color: "#166534", marginBottom: 10 }}>
          Hướng Dẫn Mua Hàng Cùng NôngSản.vn
        </Title>
        <Paragraph
          style={{
            color: "#4b5563",
            fontSize: 18,
            maxWidth: 700,
            margin: "0 auto",
          }}
        >
          Cùng khám phá quy trình mua hàng nhanh chóng, thanh toán tiện lợi qua
          VNPAY và chính sách giao nhận tận nơi của NôngSản.vn – nơi mang nông
          sản tươi sạch đến bàn ăn của bạn.
        </Paragraph>
      </div>

      {/* 🧭 Các bước mua hàng */}
      <div style={{ maxWidth: 1000, margin: "60px auto", padding: "0 20px" }}>
        <Steps
          direction="vertical"
          current={5}
          items={steps.map((s) => ({
            title: (
              <Text strong style={{ color: "#166534", fontSize: 18 }}>
                {s.title}
              </Text>
            ),
            description: (
              <Paragraph style={{ color: "#4b5563" }}>{s.desc}</Paragraph>
            ),
            icon: s.icon,
          }))}
        />
      </div>

      {/* 🧾 Thông tin thêm */}
      <Divider style={{ borderColor: "#d4d4d4" }} />
      <Row
        gutter={[24, 24]}
        justify="center"
        style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}
      >
        {/* Mẹo Mua Hàng Hiệu Quả */}
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: "#f9fafb",
              height: "100%",
            }}
            title={
              <span style={{ color: "#166534", fontWeight: 600 }}>
                <InfoCircleOutlined /> Mẹo Mua Hàng Hiệu Quả
              </span>
            }
          >
            <ul style={{ color: "#4b5563", lineHeight: 1.8 }}>
              <li>Dùng bộ lọc để chọn sản phẩm theo loại, giá hoặc nơi sản xuất.</li>
              <li>Thêm sản phẩm yêu thích vào giỏ để so sánh giá dễ dàng.</li>
              <li>Kiểm tra đánh giá và chứng nhận chất lượng trước khi mua.</li>
              <li>Đăng ký tài khoản để tích điểm và nhận mã giảm giá định kỳ.</li>
            </ul>
          </Card>
        </Col>

        {/* Chính Sách Giao Hàng */}
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: "#f9fafb",
              height: "100%",
            }}
            title={
              <span style={{ color: "#166534", fontWeight: 600 }}>
                <TruckOutlined /> Chính Sách Giao Hàng
              </span>
            }
          >
            <ul style={{ color: "#4b5563", lineHeight: 1.8 }}>
              <li>
                Hỗ trợ giao hàng toàn quốc với đối tác vận chuyển uy tín, đảm bảo sản phẩm luôn tươi mới.
              </li>
              <li>Thời gian giao hàng từ 1–3 ngày tùy khu vực.</li>
              <li>Sản phẩm hư hỏng hoặc sai loại được hoàn tiền 100%.</li>
              <li>Theo dõi đơn hàng trực tiếp trong phần “Lịch sử mua hàng”.</li>
            </ul>
          </Card>
        </Col>
      </Row>
      {/* Nút mua hàng ngay */}
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <a href="/products">
          <button
            style={{
              backgroundColor: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 24,
              padding: "12px 36px",
              fontSize: 18,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(22,163,74,0.15)",
              transition: "background 0.2s",
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#198754'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#16a34a'}
          >
            Mua hàng ngay
          </button>
        </a>
      </div>
    </div>
  );
};

export default BuyingGuideAntd;
