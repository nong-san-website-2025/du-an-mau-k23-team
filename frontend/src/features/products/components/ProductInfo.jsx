import React from "react";
import { Button, Space, Typography, Rate } from "antd";
import { ShoppingCartOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const ProductInfo = ({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  adding,
}) => {
  return (
    <div>
      <Title level={2}>{product.name}</Title>

      <Space size="small" style={{ marginBottom: 16 }}>
        <Rate disabled value={Math.round(product.rating || 0)} />
        <Text type="secondary">
          {Number(product.rating).toFixed(1)} ★ ({product.review_count} đánh giá)
        </Text>
      </Space>

      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ color: "#52c41a", margin: 0 }}>
          {product.discount > 0
            ? `${Math.round(product.price * (1 - product.discount / 100)).toLocaleString("vi-VN")} VNĐ`
            : `${Math.round(product.price)?.toLocaleString("vi-VN")} VNĐ`}
        </Title>
        {product.discount > 0 && (
          <Text delete type="secondary" style={{ marginLeft: 8 }}>
            {Math.round(product.price)?.toLocaleString("vi-VN")} VNĐ
          </Text>
        )}
        <Text type="secondary" style={{ marginLeft: 8 }}>/ {product.unit}</Text>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Text strong>Số lượng:</Text>
        <Space size="middle" style={{ marginLeft: 12 }}>
          <Button
            icon={<MinusOutlined />}
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          />
          <Text style={{ width: 40, textAlign: "center" }}>{quantity}</Text>
          <Button
            icon={<PlusOutlined />}
            onClick={() => onQuantityChange(quantity < product.stock ? quantity + 1 : quantity)}
          />
        </Space>
        <Text type="success" style={{ marginLeft: 12 }}>
          Còn {product.stock} sản phẩm
        </Text>
      </div>

      <Space size="middle">
        <Button
          type="primary"
          size="large"
          icon={<ShoppingCartOutlined />}
          loading={adding}
          onClick={onAddToCart}
        >
          Thêm vào giỏ
        </Button>
        <Button
          type="primary"
          size="large"
          danger
          onClick={onBuyNow}
        >
          Mua ngay
        </Button>
      </Space>
    </div>
  );
};

export default ProductInfo;