// src/components/Home/QuickAccessBar.jsx
import React from "react";
import { Card } from "antd";
import { 
  GiftOutlined, 
  FireOutlined, 
  CrownOutlined, 
  DollarOutlined,
  // Thêm icon mới ở đây nếu cần
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

// Dễ dàng mở rộng: cứ thêm vào mảng này
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
  // 👇 Thêm item mới ở đây — KHÔNG cần sửa CSS!
  // {
  //   title: "Mới",
  //   icon: <StarOutlined style={{ fontSize: 24, color: "#faad14" }} />,
  //   path: "/new",
  // },
];

const QuickAccessBar = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between", // ← CĂN ĐỀU TỪ TRÁI SANG PHẢI
        width: "100%",
        padding: "8px 0 16px",
        gap: 12, // khoảng cách giữa các item (tuỳ chọn)
      }}
    >
      {quickLinks.map((item, index) => (
        <div
          key={index}
          style={{
            flex: 1, // ← Mỗi item chiếm phần bằng nhau
            minWidth: 0, // tránh bị tràn chữ
          }}
        >
          <Card
            hoverable
            style={{
              textAlign: "center",
              borderRadius: 12,
              height: "100%",
              transition: "all 0.2s",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
            bodyStyle={{ padding: "16px 8px" }}
            onClick={() => navigate(item.path)}
          >
            <div style={{ marginBottom: 8 }}>{item.icon}</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.title}
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default QuickAccessBar;