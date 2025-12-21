import React from "react";
import { Row, Col, Typography, Divider, Button } from "antd";
import { UserOutlined, ShopOutlined, BankOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const TypeCard = ({ type, icon, title, desc, conditions, onSelect }) => (
  <div
    style={{
      cursor: "pointer",
      border: "2px solid #f0f0f0",
      transition: "all 0.3s",
      borderRadius: "12px",
      height: "100%",
      position: "relative",
      overflow: "hidden",
    }}
    onClick={() => onSelect(type)}
    className="hover-card"
  >
    <div style={{ padding: "24px", textAlign: "center" }}>
      {icon}
      <Title level={4} style={{ marginTop: 10, marginBottom: 5 }}>{title}</Title>
      <Text type="secondary" style={{ fontSize: 13 }}>{desc}</Text>
      <Divider style={{ margin: "12px 0" }} />
      <div style={{ textAlign: "left", background: "#f9f9f9", padding: 10, borderRadius: 8 }}>
        <Text strong style={{ fontSize: 12, display: "block", marginBottom: 5 }}>
          <InfoCircleOutlined /> Yêu cầu giấy tờ:
        </Text>
        <ul style={{ fontSize: "13px", color: "#666", paddingLeft: 20, margin: 0 }}>
          {conditions.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      </div>
    </div>
  </div>
);

export default function TypeSelection({ setUserType }) {
  const navigate = useNavigate();
  const iconStyle = { fontSize: "42px", marginBottom: "16px", color: "#1890ff" };

  return (
    <div style={{ animation: "fadeIn 0.5s" }}>
      <Title level={3} style={{ textAlign: "center", marginBottom: 30 }}>
        Chọn hình thức kinh doanh
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <TypeCard
            type="personal"
            icon={<UserOutlined style={iconStyle} />}
            title="Cá nhân"
            desc="Dành cho sinh viên, cá nhân bán lẻ."
            conditions={["CCCD 2 mặt (Bắt buộc)", "Mã số thuế cá nhân (Nếu có)"]}
            onSelect={setUserType}
          />
        </Col>
        <Col xs={24} md={8}>
          <TypeCard
            type="household"
            icon={<ShopOutlined style={iconStyle} />}
            title="Hộ Kinh Doanh"
            desc="Cửa hàng nhỏ, hộ gia đình."
            conditions={["Giấy ĐKKD Hộ cá thể", "Mã số thuế", "CCCD chủ hộ"]}
            onSelect={setUserType}
          />
        </Col>
        <Col xs={24} md={8}>
          <TypeCard
            type="business"
            icon={<BankOutlined style={iconStyle} />}
            title="Doanh nghiệp"
            desc="Công ty, Nhà phân phối."
            conditions={["Giấy ĐKKD Doanh nghiệp", "Mã số thuế công ty", "Đại diện pháp luật"]}
            onSelect={setUserType}
          />
        </Col>
      </Row>
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <Button type="text" onClick={() => navigate("/")}>Quay lại trang chủ</Button>
      </div>
    </div>
  );
}