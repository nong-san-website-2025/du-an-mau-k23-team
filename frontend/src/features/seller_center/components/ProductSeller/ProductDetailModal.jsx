// src/seller_center/components/ProductSeller/ProductDetailModal.jsx
import React from "react";
import { Modal, Image, Tag, Descriptions, Card, Spin } from "antd";

export default function ProductDetailModal({
  visible,
  onClose,
  product,
  getStatusConfig,
  getAvailabilityConfig,
}) {
  if (!product)
    return (
      <Modal open={visible} onCancel={onClose} footer={null}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      </Modal>
    );

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 600, color: "#1d39c4" }}>
            #{product.id}
          </span>
          <Tag color="blue">Chi tiết sản phẩm</Tag>
        </div>
      }
      bodyStyle={{ padding: 24 }}
    >
      <div style={{ display: "flex", gap: 24, flexDirection: "row" }}>
        {/* Ảnh sản phẩm */}
        <div style={{ flex: "0 0 320px" }}>
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              style={{
                width: "100%",
                height: 360,
                objectFit: "contain",
                borderRadius: 12,
                border: "1px solid #f0f0f0",
                backgroundColor: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
              preview={false}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: 360,
                backgroundColor: "#fafafa",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 64,
                color: "#d9d9d9",
                border: "1px dashed #e8e8e8",
              }}
            >
              📦
            </div>
          )}
        </div>

        {/* Thông tin sản phẩm */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
            {product.name}
          </h2>

          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <span
                style={{ fontSize: 20, fontWeight: 700, color: "#ff4d4f" }}
              >
                {Number(product.price).toLocaleString()} ₫
              </span>
              {product.stock === 0 && (
                <Tag color="red" style={{ fontWeight: 500 }}>
                  Hết hàng
                </Tag>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Tag color="geekblue">Danh mục: {product.category_name || "—"}</Tag>
              <Tag color="purple">
                Nhóm: {product.subcategory_name || "—"}
              </Tag>
            </div>
          </div>

          <Card
            size="small"
            style={{ marginBottom: 16, borderRadius: 12, border: "1px solid #f0f0f0" }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Trạng thái duyệt">
                <Tag
                  color={getStatusConfig(product.status).color}
                  style={{ fontWeight: 500 }}
                >
                  {getStatusConfig(product.status).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tình trạng hàng">
                <Tag
                  color={getAvailabilityConfig(product.availability_status).color}
                  style={{ fontWeight: 500 }}
                >
                  {getAvailabilityConfig(product.availability_status).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tồn kho">
                <span
                  style={{
                    fontWeight: 600,
                    color: product.stock === 0 ? "#ff4d4f" : "#52c41a",
                  }}
                >
                  {product.stock} sản phẩm
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {product.availability_status === "coming_soon" && (
            <Card
              title={<span style={{ fontWeight: 600, color: "#722ed1" }}>🌱 Thông tin mùa vụ</span>}
              size="small"
              style={{ marginBottom: 16, borderRadius: 12 }}
            >
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="Bắt đầu">
                  {product.season_start
                    ? new Date(product.season_start).toLocaleDateString("vi-VN")
                    : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Kết thúc">
                  {product.season_end
                    ? new Date(product.season_end).toLocaleDateString("vi-VN")
                    : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Dự kiến">
                  {product.estimated_quantity?.toLocaleString() || "0"} sp
                </Descriptions.Item>
                <Descriptions.Item label="Đã đặt">
                  {product.ordered_quantity?.toLocaleString() || "0"} sp
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {product.description && (
            <Card
              title={<span style={{ fontWeight: 600 }}>📝 Mô tả sản phẩm</span>}
              size="small"
              style={{ borderRadius: 12 }}
            >
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                  color: "#434343",
                  maxHeight: 150,
                  overflowY: "auto",
                }}
              >
                {product.description}
              </div>
            </Card>
          )}
        </div>
      </div>
    </Modal>
  );
}
