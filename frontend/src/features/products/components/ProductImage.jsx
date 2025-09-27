import React from "react";
import { Image, Button } from "antd";
import { HeartFilled, HeartOutlined } from "@ant-design/icons";

const ProductImage = ({ product, isFavorite, onToggleFavorite }) => {
  const imgSrc = product.image?.startsWith("http")
    ? product.image
    : product.image?.startsWith("/")
      ? `http://localhost:8000${product.image}`
      : "https://via.placeholder.com/500x400?text=No+Image";

  return (
    <div style={{ position: "relative", textAlign: "center" }}>
      <Image
        src={imgSrc}
        alt={product.name}
        preview={false}
        style={{ maxHeight: 450, objectFit: "contain" }}
      />
      <Button
        type="text"
        shape="circle"
        size="large"
        icon={isFavorite ? <HeartFilled style={{ color: "#ff4d4f" }} /> : <HeartOutlined />}
        onClick={onToggleFavorite}
        style={{
          position: "absolute",
          bottom: 15,
          right: 15,
          background: "rgba(255,255,255,0.95)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
        title={isFavorite ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
      />
    </div>
  );
};

export default ProductImage;