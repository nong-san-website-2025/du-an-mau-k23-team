// src/components/Home/QuickAccessBar.jsx
import React from "react";
import { Card } from "antd";
import { useNavigate } from "react-router-dom";
import { voucher, sale, loyalty, coming_soon } from "../../assets/icons";

const quickLinks = [
  { title: "Mã giảm giá", icon: voucher, path: "/promotions/vouchers" },
  { title: "Siêu Sale", icon: sale, path: "/flash-sales" },
  { title: "Khách mối", icon: loyalty, path: "/loyalty" },
  { title: "Hàng sắp có", icon: coming_soon, path: "/coming-soon" },
];

const QuickAccessBar = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        padding: "8px 0 8px",
        gap: 12,
      }}
    >
      {quickLinks.map((item, index) => (
        <div key={index} style={{ flex: 1, minWidth: 0 }}>
          <Card
            hoverable
            style={{
              textAlign: "center",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              transition: "all 0.2s ease",
            }}
            bodyStyle={{ padding: "16px 8px" }}
            onClick={() => navigate(item.path)}
          >
            <div
              style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                border: "1px solid #ccc", // viền xám nhẹ
                borderRadius: "12px", // bo góc mềm mại
                padding: "6px", // cách viền với ảnh
                backgroundColor: "#fff", // nền trắng (giúp icon rõ)
              }}
            >
              <img
                src={item.icon}
                alt={item.title}
                style={{
                  width: 38,
                  height: 38,
                  objectFit: "contain",
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))",
                }}
              />
            </div>

            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
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
