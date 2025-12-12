import React from "react";
import { Card, Button, Badge, Image } from "antd";
import {
  ShoppingCartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const WishlistItem = ({ item, onRemove }) => {
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      style={{ borderRadius: 16, border: "1px solid #e8f5e8" }}
      cover={
        <div style={{ position: "relative", height: 260 }}>
          <Badge
            color={item.inStock ? "#52c41a" : "#d9d9d9"}
            style={{ position: "absolute", top: 8, left: 8, zIndex: 10 }}
          >
            {item.inStock ? (
              <span>
                <CheckCircleOutlined /> Còn hàng
              </span>
            ) : (
              <span>
                <CloseCircleOutlined /> Hết hàng
              </span>
            )}
          </Badge>
          <Image
            preview={false}
            src={
              item.image && item.image.startsWith("/")
                ? `${process.env.REACT_APP_API_URL.replace('/api', '')}${item.image}`
                : item.image?.startsWith("http")
                  ? item.image
                  : "https://via.placeholder.com/400x300?text=No+Image"
            }
            alt={item.name}
            style={{
              height: "100%",
              objectFit: "cover",
              borderRadius: "12px 12px 0 0",
            }}
            onClick={() => navigate(`/products/${item.id}`)}
          />
        </div>
      }
      actions={[]}
    >
      <Card.Meta
        title={
          <div style={{ minHeight: 40, fontWeight: 600 }}>{item.name}</div>
        }
        description={
          <div style={{ color: "#d32f2f", fontWeight: "bold", fontSize: 18 }}>
            {item.price?.toLocaleString()} đ
          </div>
        }
      /><Button
        danger
        icon={<DeleteOutlined />}
        onClick={() => onRemove(item.id)}
      />    
    </Card>
  );
};

export default WishlistItem;
