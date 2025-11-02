import React from "react";
import {
  Modal,
  Descriptions,
  Divider,
  Tag,
  Tooltip,
  Rate,
  Image,
  Space,
} from "antd";

export default function ProductDetailModal({ visible, product, onClose }) {
  if (!product) return null;

  const translateStatus = (status) => {
    switch (status) {
      case "approved":
        return "Đã duyệt";
      case "pending":
        return "Chờ duyệt";
      case "rejected":
        return "Từ chối";
      case "banned":
        return "Bị khoá";
      default:
        return "Không xác định";
    }
  };

  const translateAvailability = (availability) => {
    switch (availability) {
      case "available":
        return "Còn hàng";
      case "out_of_stock":
        return "Hết hàng";
      case "coming_soon":
        return "Sắp ra mắt";
      default:
        return "Không xác định";
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={950}
      centered
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Chi tiết sản phẩm:</span>
          <Tooltip title={product.name}>
            <span
              style={{
                maxWidth: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: "#1890ff",
                fontWeight: 600,
              }}
            >
              {product.name}
            </span>
          </Tooltip>
        </div>
      }
      bodyStyle={{
        maxHeight: "80vh",
        overflowY: "auto",
        paddingRight: 12,
      }}
    >
      {/* === HEADER: Ảnh + Thông tin tóm tắt === */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          marginBottom: 20,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            flex: "0 0 280px",
            background: "#fafafa",
            border: "1px solid #f0f0f0",
            borderRadius: 12,
            padding: 12,
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <img
            src={
              product.image ||
              "https://via.placeholder.com/300x300.png?text=No+Image"
            }
            alt={product.name}
            style={{
              width: "100%",
              height: 280,
              objectFit: "contain",
              borderRadius: 8,
              marginBottom: 10,
            }}
          />
          <Tag
            color={
              product.availability_status === "available"
                ? "green"
                : product.availability_status === "out_of_stock"
                  ? "volcano"
                  : "gold"
            }
          >
            {translateAvailability(product.availability_status)}
          </Tag>
        </div>

        <div style={{ flex: "1 1 60%", minWidth: 300 }}>
          <Tooltip title={product.name}>
            <h2
              style={{
                marginBottom: 6,
                maxWidth: 700, // 🔹 Giới hạn độ rộng
                display: "-webkit-box", // Cấu trúc để ellipsis nhiều dòng hoạt động
                WebkitLineClamp: 3, // 🔹 Giới hạn tối đa 2 dòng (có thể đổi thành 3)
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: 20,
                fontWeight: 600,
                color: "#333",
                lineHeight: 1.4, // Tăng khoảng cách giữa các dòng cho dễ đọc
              }}
            >
              {product.name}
            </h2>
          </Tooltip>
          <div style={{ color: "#888", marginBottom: 8 }}>
            Mã sản phẩm: #{product.id}
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#d4380d" }}>
            {Number(product.price).toLocaleString("vi-VN")} đ{" "}
            {product.discount_percent > 0 && (
              <Tag color="red" style={{ marginLeft: 6 }}>
                -{product.discount_percent}%
              </Tag>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            <Rate disabled value={Number(product.rating)} />
            <span style={{ marginLeft: 8, color: "#666" }}>
              {product.rating} / 5 ({product.review_count} lượt)
            </span>
          </div>
          <div style={{ marginTop: 12, color: "#555" }}>
            <strong>Cửa hàng:</strong> {product.seller_name || "—"}
            <br />
            <strong>Thương hiệu:</strong> {product.brand || "—"}
            <br />
            <strong>Trạng thái:</strong>{" "}
            <Tag color="blue">{translateStatus(product.status)}</Tag>
          </div>
        </div>
      </div>

      {/* === BODY: Thông tin chi tiết === */}
      <Divider orientation="left" plain>
        Thông tin cơ bản
      </Divider>
      <Descriptions
        bordered
        column={2}
        size="middle"
        labelStyle={{ width: 160, fontWeight: 500 }}
      >
        <Descriptions.Item label="Danh mục">
          {product.category_name}
        </Descriptions.Item>
        <Descriptions.Item label="Danh mục con">
          {product.subcategory_name || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Đơn vị">{product.unit}</Descriptions.Item>
        <Descriptions.Item label="Khu vực">
          {product.location || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">
          {new Date(product.created_at).toLocaleString("vi-VN")}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày cập nhật">
          {new Date(product.updated_at).toLocaleString("vi-VN")}
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left" plain>
        Thông tin kinh doanh
      </Divider>
      <Descriptions
        bordered
        column={2}
        size="middle"
        labelStyle={{ width: 160, fontWeight: 500 }}
      >
        <Descriptions.Item label="Giá gốc">
          {Number(product.original_price).toLocaleString("vi-VN")} đ
        </Descriptions.Item>
        <Descriptions.Item label="Giá sau giảm">
          {Number(product.discounted_price).toLocaleString("vi-VN")} đ
        </Descriptions.Item>
        <Descriptions.Item label="Số lượng tồn">
          {product.stock}
        </Descriptions.Item>
        <Descriptions.Item label="Còn khả dụng">
          {product.available_quantity}
        </Descriptions.Item>
        <Descriptions.Item label="Đã bán">
          {product.sold_count}
        </Descriptions.Item>
        <Descriptions.Item label="Đặt trước">
          {product.total_preordered || 0}
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left" plain>
        Mô tả chi tiết
      </Divider>
      <div
        style={{
          background: "#fff",
          border: "1px solid #f0f0f0",
          borderRadius: 8,
          padding: 12,
          fontSize: 14,
          color: "#555",
          lineHeight: 1.6,
          marginBottom: 12,
          maxHeight: 200,
          overflowY: "auto",
        }}
      >
        {product.description || "— Không có mô tả —"}
      </div>

      {product.images && product.images.length > 0 && (
        <>
          <Divider orientation="left" plain>
            Bộ sưu tập ảnh
          </Divider>
          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              paddingBottom: 8,
            }}
          >
            {product.images.map((img) => (
              <Image
                key={img.id}
                src={img.image}
                alt={`gallery-${img.id}`}
                width={120}
                height={120}
                style={{
                  objectFit: "cover",
                  borderRadius: 8,
                  border:
                    img.is_primary === true
                      ? "2px solid #1890ff"
                      : "1px solid #ddd",
                }}
                preview
              />
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
