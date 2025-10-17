// src/components/Home/QuickAccessBar.jsx
import React from "react";
import { Row, Col } from "antd";
import { 
  GiftOutlined, 
  FireOutlined, 
  CrownOutlined, 
  DollarOutlined 
} from "@ant-design/icons";
import { Card } from "antd";
import { useNavigate } from "react-router-dom";

const quickLinks = [
  {
    title: "Voucher",
    icon: <GiftOutlined style={{ fontSize: 24, color: "#ff6f00" }} />,
    path: "/promotions/vouchers",
  },
  {
    title: "Siêu Sale",
    icon: <FireOutlined style={{ fontSize: 24, color: "#ff4d4f" }} />,
    path: "/flash-sales",
  },
  {
    title: "Thân thiết",
    icon: <CrownOutlined style={{ fontSize: 24, color: "#722ed1" }} />,
    path: "/loyalty",
  },
  {
    title: "Deal rẻ",
    icon: <DollarOutlined style={{ fontSize: 24, color: "#52c41a" }} />,
    path: "/deals",
  },
];

const QuickAccessBar = () => {
  const navigate = useNavigate();

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {quickLinks.map((item, index) => (
        <Col key={index} xs={6} sm={6} md={6} lg={6}>
          <Card
            hoverable
            style={{
              textAlign: "center",
              borderRadius: 12,
              height: "100%",
              transition: "all 0.2s",
            }}
            bodyStyle={{ padding: "16px 8px" }}
            onClick={() => navigate(item.path)}
          >
            <div style={{ marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{item.title}</div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default QuickAccessBar;