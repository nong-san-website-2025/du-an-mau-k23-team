// components/RatingModal.jsx
import React from "react";
import { Modal, Button, Image, Typography, Rate } from "antd";
import { intcomma } from "./../../../utils/format";
import { resolveProductImage } from "../utils";

const { Text } = Typography;

const RatingModal = ({
  open,
  onCancel,
  product,
  ratingValue,
  setRatingValue,
  comment,
  setComment,
  onSubmit,
  loading,
  isMobile,
}) => {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} size="large">Hủy</Button>,
        <Button key="submit" type="primary" onClick={onSubmit} loading={loading} size="large">Gửi đánh giá</Button>,
      ]}
      centered
      width={isMobile ? "90%" : 500}
      title="Đánh giá sản phẩm"
    >
      {product && (
        <div style={{ padding: "20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
            <Image
              src={resolveProductImage(product.product_image)}
              alt={product.product_name}
              width={60}
              height={60}
              style={{ borderRadius: 8, objectFit: "cover", marginRight: 16, border: "1px solid #f0f0f0" }}
            />
            <div>
              <Text strong style={{ fontSize: 16, display: "block" }}>{product.product_name}</Text>
              <Text type="secondary" style={{ fontSize: 14 }}>{intcomma(product.price)}đ × {product.quantity}</Text>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <Text strong style={{ fontSize: 15, display: "block", marginBottom: 8 }}>
              Đánh giá của bạn <Text type="danger">*</Text>
            </Text>
            <Rate value={ratingValue} onChange={setRatingValue} style={{ fontSize: 24 }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <Text strong style={{ fontSize: 15, display: "block", marginBottom: 8 }}>Nhận xét (không bắt buộc)</Text>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm..."
              style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #d9d9d9", background: "#fafafa" }}
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default RatingModal;