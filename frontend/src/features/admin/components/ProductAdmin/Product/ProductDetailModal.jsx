import React from "react";
import {
  Drawer,
  Descriptions,
  Divider,
  Tag,
  Tooltip,
  Rate,
  Image,
  Space,
  Button,
} from "antd";
import { CloseOutlined } from "@ant-design/icons";

export default function ProductDetailDrawer({ visible, product, onClose }) {
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

  const statusColor = {
    approved: "green",
    pending: "orange",
    rejected: "red",
    banned: "red",
  };

  const availabilityColor = {
    available: "green",
    out_of_stock: "volcano",
    coming_soon: "gold",
  };

  return (
    <Drawer
      title={
        <div style={{ 
          paddingRight: 24,
          fontSize: 16,
          fontWeight: 600,
          color: '#111827'
        }}>
          Chi tiết sản phẩm
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={720}
      closeIcon={<CloseOutlined />}
      styles={{
        body: {
          paddingTop: 16,
        }
      }}
    >
      {/* === HEADER: Ảnh chính + Info tổng quan === */}
      <div style={{ marginBottom: 24 }}>
        {/* Ảnh chính */}
        <div
          style={{
            background: "#fafafa",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          <img
            src={
              product.main_image?.image ||
              "https://via.placeholder.com/400x400.png?text=No+Image"
            }
            alt={product.name}
            style={{
              width: "100%",
              maxHeight: 200,
              objectFit: "contain",
              borderRadius: 6,
              marginBottom: 12,
            }}
          />
          <Space size="small">
            <Tag color={statusColor[product.status] || "default"}>
              {translateStatus(product.status)}
            </Tag>
            <Tag color={availabilityColor[product.availability_status] || "default"}>
              {translateAvailability(product.availability_status)}
            </Tag>
          </Space>
        </div>

        {/* Tên + giá + rating */}
        <div>
          <div style={{ 
            fontSize: 13,
            color: '#6b7280',
            marginBottom: 6
          }}>
            Mã sản phẩm: #{product.id}
          </div>
          
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#111827",
              lineHeight: 1.4,
              marginBottom: 12,
              wordBreak: "break-word",
            }}
          >
            {product.name}
          </h2>

          <div style={{ 
            fontSize: 24, 
            fontWeight: 700, 
            color: "#dc2626",
            marginBottom: 12
          }}>
            {Number(product.price).toLocaleString("vi-VN")} đ
            {product.discount_percent > 0 && (
              <Tag 
                color="red" 
                style={{ 
                  marginLeft: 8,
                  fontSize: 13
                }}
              >
                -{product.discount_percent}%
              </Tag>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <Rate disabled value={Number(product.rating)} />
            <span style={{ marginLeft: 8, color: "#6b7280", fontSize: 14 }}>
              {product.rating}/5 ({product.review_count} đánh giá)
            </span>
          </div>

          <div style={{ 
            fontSize: 14,
            color: '#374151',
            lineHeight: 1.8
          }}>
            <div>
              <span style={{ color: '#6b7280' }}>Cửa hàng:</span>{" "}
              <span style={{ fontWeight: 500 }}>{product.seller_name || "—"}</span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Thương hiệu:</span>{" "}
              <span style={{ fontWeight: 500 }}>{product.brand || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      <Divider style={{ margin: '24px 0' }} />

      {/* === Thông tin cơ bản === */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ 
          fontSize: 15,
          fontWeight: 600,
          color: '#111827',
          marginBottom: 12
        }}>
          Thông tin cơ bản
        </h3>
        <Descriptions
          column={1}
          size="small"
          labelStyle={{ 
            width: 140,
            fontWeight: 500,
            color: '#6b7280',
            fontSize: 13
          }}
          contentStyle={{
            color: '#111827',
            fontSize: 13
          }}
        >
          <Descriptions.Item label="Danh mục">
            {product.category_name}
          </Descriptions.Item>
          <Descriptions.Item label="Danh mục con">
            {product.subcategory_name || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Đơn vị">
            {product.unit}
          </Descriptions.Item>
          <Descriptions.Item label="Khu vực">
            {product.location || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {new Date(product.created_at).toLocaleString("vi-VN")}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật">
            {new Date(product.updated_at).toLocaleString("vi-VN")}
          </Descriptions.Item>
        </Descriptions>
      </div>

      <Divider style={{ margin: '24px 0' }} />

      {/* === Thông tin kinh doanh === */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ 
          fontSize: 15,
          fontWeight: 600,
          color: '#111827',
          marginBottom: 12
        }}>
          Thông tin kinh doanh
        </h3>
        <Descriptions
          column={1}
          size="small"
          labelStyle={{ 
            width: 140,
            fontWeight: 500,
            color: '#6b7280',
            fontSize: 13
          }}
          contentStyle={{
            color: '#111827',
            fontSize: 13,
            fontWeight: 500
          }}
        >
          <Descriptions.Item label="Giá gốc">
            {Number(product.original_price).toLocaleString("vi-VN")} đ
          </Descriptions.Item>
          <Descriptions.Item label="Giá sau giảm">
            <span style={{ color: '#dc2626', fontWeight: 600 }}>
              {Number(product.discounted_price).toLocaleString("vi-VN")} đ
            </span>
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
      </div>

      <Divider style={{ margin: '24px 0' }} />

      {/* === Mô tả chi tiết === */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ 
          fontSize: 15,
          fontWeight: 600,
          color: '#111827',
          marginBottom: 12
        }}>
          Mô tả sản phẩm
        </h3>
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            padding: 16,
            fontSize: 14,
            color: "#374151",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word"
          }}
        >
          {product.description || "— Không có mô tả —"}
        </div>
      </div>

      {/* === Bộ sưu tập ảnh === */}
      {product.images && product.images.length > 0 && (
        <>
          <Divider style={{ margin: '24px 0' }} />
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ 
              fontSize: 15,
              fontWeight: 600,
              color: '#111827',
              marginBottom: 12
            }}>
              Bộ sưu tập ảnh ({product.images.length})
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: 12,
              }}
            >
              {product.images.map((img) => (
                <div
                  key={img.id}
                  style={{
                    position: "relative",
                    borderRadius: 6,
                    overflow: "hidden",
                    border: img.is_primary === true
                      ? "2px solid #3b82f6"
                      : "1px solid #e5e7eb",
                  }}
                >
                  <Image
                    src={img.image}
                    alt={`gallery-${img.id}`}
                    width="100%"
                    height={100}
                    style={{
                      objectFit: "cover",
                    }}
                    preview
                  />
                  {img.is_primary && (
                    <Tag
                      color="blue"
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        fontSize: 10,
                        margin: 0,
                        padding: '0 4px',
                        lineHeight: '18px'
                      }}
                    >
                      Chính
                    </Tag>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
}