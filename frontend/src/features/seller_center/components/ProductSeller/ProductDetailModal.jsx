import React, { useState, useEffect } from "react";
import {
  Modal,
  Image,
  Typography,
  Descriptions,
  Divider,
  Row,
  Col,
  Statistic,
  Empty,
  Button,
  Skeleton,
  Tag,
  Card,
  Space,
  Alert,
} from "antd";
import {
  EnvironmentOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  CalendarOutlined,
  DeploymentUnitOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LockOutlined,
  HistoryOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { intcomma } from "../../../../utils/format";

const { Title, Text, Paragraph } = Typography;

// --- Helper Config ---
const statusConfig = {
  approved: {
    label: "Đang bán",
    color: "success",
    icon: <CheckCircleOutlined />,
  },
  pending: { label: "Chờ duyệt", color: "gold", icon: <ClockCircleOutlined /> },
  pending_update: {
    label: "Chờ duyệt cập nhật",
    color: "orange",
    icon: <HistoryOutlined />,
  },
  rejected: { label: "Từ chối", color: "error", icon: <CloseCircleOutlined /> },
  banned: { label: "Bị khóa", color: "default", icon: <LockOutlined /> },
  self_rejected: {
    label: "Đã hủy",
    color: "default",
    icon: <CloseCircleOutlined />,
  },
};

const availabilityConfig = {
  available: { text: "Có sẵn", color: "blue" },
  coming_soon: { text: "Sắp có (Mùa vụ)", color: "purple" },
  out_of_stock: { text: "Hết hàng", color: "red" },
};

export default function ProductDetailModal({
  visible,
  onClose,
  product,
  onManageImages,
}) {
  const [activeImage, setActiveImage] = useState(null);
  // console.log("Dữ liệu sản phẩm:", product);

  useEffect(() => {
    if (product) {
      const defaultImg =
        product.image ||
        product.main_image?.image ||
        (product.images?.length > 0 ? product.images[0].image : null);
      setActiveImage(defaultImg);
    }
  }, [product, visible]);

  if (!product && visible) {
    return (
      <Modal
        open={visible}
        onCancel={onClose}
        footer={null}
        width={900}
        centered
      >
        <Skeleton active paragraph={{ rows: 10 }} />
      </Modal>
    );
  }

  if (!product) return null;

  const status = statusConfig[product.status] || {
    label: product.status,
    color: "default",
  };
  const availability = availabilityConfig[product.availability_status] || {
    text: product.availability_status,
    color: "default",
  };
  const isSeason = product.availability_status === "coming_soon";

  // Xác định xem có bị từ chối/khóa không
  const isRejected =
    product.status === "rejected" || product.status === "banned";

  // --- LOGIC SUY LUẬN LÝ DO TỪ CHỐI (Updated) ---
  const getRejectReason = (p) => {
    // 1. Ưu tiên lý do từ Server gửi về (nếu có text cụ thể)
    if (p.reject_reason && p.reject_reason.trim() !== "")
      return p.reject_reason;
    if (p.admin_note && p.admin_note.trim() !== "") return p.admin_note;

    // 2. Tự động check lỗi dữ liệu nếu server không gửi text (Fallback logic)
    if (p.status === "rejected") {
      // Check thiếu ảnh
      if (!p.images || p.images.length === 0) {
        return "Sản phẩm chưa có hình ảnh minh họa hợp lệ.";
      }
      // Check giá (ví dụ thêm)
      if (p.discounted_price <= 0) {
        return "Giá bán sản phẩm không hợp lệ.";
      }
    }

    // 3. Mặc định
    return "Không có lý do cụ thể từ quản trị viên.";
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      centered
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            Chi tiết sản phẩm #{product.id}
          </Title>
          <Tag
            color={status.color}
            icon={status.icon}
            style={{ borderRadius: 12 }}
          >
            {status.label}
          </Tag>
        </Space>
      }
      styles={{ body: { padding: "24px 32px 32px" } }}
    >
      {/* --- PHẦN THÔNG BÁO TỪ CHỐI (Đã sửa) --- */}
      {isRejected && (
        <Alert
          message={
            <Text strong style={{ fontSize: 15 }}>
              Sản phẩm bị {product.status === "banned" ? "khóa" : "từ chối"}
            </Text>
          }
          description={
            <div style={{ marginTop: 4 }}>
              <Text>Lý do: </Text>
              <Text type="danger" strong>
                {getRejectReason(product)}
              </Text>
            </div>
          }
          type="error"
          showIcon
          icon={<CloseCircleOutlined style={{ fontSize: 24 }} />}
          style={{
            marginBottom: 24,
            border: "1px solid #ffccc7",
            background: "#fff2f0",
            borderRadius: 8,
          }}
          // Nút hành động nhanh: Nếu thiếu ảnh thì hiện nút bổ sung ngay
          action={
            (!product.images || product.images.length === 0) &&
            product.status === "rejected" ? (
              <Button
                size="small"
                type="primary"
                danger
                ghost
                onClick={() => onManageImages(product)}
              >
                Bổ sung ảnh ngay
              </Button>
            ) : null
          }
        />
      )}

      <Row gutter={[40, 24]}>
        {/* --- CỘT TRÁI: HÌNH ẢNH & THÔNG SỐ CƠ BẢN --- */}
        <Col xs={24} md={9}>
          <div style={{ position: "sticky", top: 0 }}>
            {/* Ảnh Chính */}
            <div
              style={{
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid #f0f0f0",
                marginBottom: 12,
                backgroundColor: "#fafafa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 320,
              }}
            >
              {activeImage ? (
                <Image
                  src={activeImage}
                  width="100%"
                  height="100%"
                  style={{ objectFit: "contain" }}
                  fallback="/no-image.png"
                />
              ) : (
                <Empty
                  description="Chưa có ảnh"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>

            {/* Gallery Thumbnails */}
            {product.images && product.images.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 8,
                  marginBottom: 12,
                }}
              >
                {product.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImage(img.image)}
                    style={{
                      width: 60,
                      height: 60,
                      flexShrink: 0,
                      cursor: "pointer",
                      border:
                        activeImage === img.image
                          ? "2px solid #1890ff"
                          : "1px solid #d9d9d9",
                      borderRadius: 6,
                      overflow: "hidden",
                      opacity: activeImage === img.image ? 1 : 0.6,
                    }}
                  >
                    <img
                      src={img.image}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <Button
              block
              icon={<PictureOutlined />}
              onClick={() => onManageImages(product)}
              style={{ marginBottom: 24, borderRadius: 6 }}
            >
              Quản lý thư viện ảnh ({product.images?.length || 0})
            </Button>

            {/* Thông số kỹ thuật nhanh */}
            <Card
              size="small"
              bordered={false}
              style={{ background: "#f9f9f9", borderRadius: 8 }}
            >
              <Descriptions
                column={1}
                size="small"
                labelStyle={{ color: "#8c8c8c", width: 110 }}
              >
                <Descriptions.Item label="Danh mục">
                  <b>{product.category_name}</b>
                </Descriptions.Item>
                <Descriptions.Item label="Nhóm hàng">
                  {product.subcategory_name}
                </Descriptions.Item>
                <Descriptions.Item label="Xuất xứ">
                  <Space>
                    <EnvironmentOutlined style={{ color: "#eb2f96" }} />{" "}
                    {product.location || "N/A"}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Đơn vị tính">
                  <Tag color="cyan">{product.unit || "kg"}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        </Col>

        {/* --- CỘT PHẢI: CHI TIẾT KINH DOANH & MÔ TẢ --- */}
        <Col xs={24} md={15}>
          {/* Header Tên & Shop */}
          <div style={{ marginBottom: 16 }}>
            <Title level={3} style={{ margin: "0 0 8px 0", color: "#262626" }}>
              {product.name}
            </Title>
            <Space split={<Divider type="vertical" />}>
              <Text type="secondary">
                <ShopOutlined /> {product.seller_name || "Cửa hàng của tôi"}
              </Text>
              <Text type="secondary">
                Cập nhật:{" "}
                {dayjs(product.updated_at).format("DD/MM/YYYY HH:mm")}
              </Text>
            </Space>
          </div>

          {/* Khối Giá & Trạng thái */}
          <div
            style={{
              background: "#f6ffed",
              padding: "16px 24px",
              borderRadius: 12,
              border: "1px solid #b7eb8f",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Space size={24} align="baseline">
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Giá bán hiện tại
                </Text>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#389e0d",
                    lineHeight: 1,
                  }}
                >
                  {intcomma(product.discounted_price)} ₫
                </div>
              </div>
              {product.original_price > product.discounted_price && (
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Giá gốc
                  </Text>
                  <div
                    style={{
                      fontSize: 16,
                      color: "#8c8c8c",
                      textDecoration: "line-through",
                    }}
                  >
                    {intcomma(product.original_price)} ₫
                  </div>
                </div>
              )}
            </Space>
            <Tag
              color={availability.color}
              style={{ fontSize: 13, padding: "4px 10px", borderRadius: 6 }}
            >
              {availability.text}
            </Tag>
          </div>

          {/* Thông tin Kho & Doanh số */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Statistic
                title={
                  <span style={{ fontSize: 13 }}>
                    <DeploymentUnitOutlined /> Tồn kho
                  </span>
                }
                value={product.stock}
                valueStyle={{ fontSize: 18, fontWeight: 600 }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={
                  <span style={{ fontSize: 13 }}>
                    <BarChartOutlined /> Đã bán
                  </span>
                }
                value={product.sold || 0}
                valueStyle={{ fontSize: 18, fontWeight: 600 }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={<span style={{ fontSize: 13 }}>Hoa hồng sàn</span>}
                value={
                  product.commission_rate
                    ? product.commission_rate * 100
                    : 0
                }
                precision={1}
                suffix="%"
                valueStyle={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#13c2c2",
                }}
              />
            </Col>
          </Row>

          {/* Block Mùa vụ */}
          {isSeason && (
            <div
              style={{
                background: "#f9f0ff",
                padding: "16px",
                borderRadius: 8,
                border: "1px dashed #d3adf7",
                marginBottom: 24,
              }}
            >
              <Space
                style={{
                  marginBottom: 12,
                  color: "#722ed1",
                  fontWeight: 600,
                }}
              >
                <CalendarOutlined /> KẾ HOẠCH MÙA VỤ & ĐẶT TRƯỚC
              </Space>
              <Row gutter={24}>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Thời gian">
                      {product.season_start
                        ? dayjs(product.season_start).format("DD/MM")
                        : "?"}
                      {" → "}
                      {product.season_end
                        ? dayjs(product.season_end).format("DD/MM/YYYY")
                        : "?"}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    <Text type="secondary">Tiến độ đặt hàng:</Text>
                    <Text strong>
                      {intcomma(product.ordered_quantity)} /{" "}
                      {intcomma(product.estimated_quantity)}{" "}
                      {product.unit}
                    </Text>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: "#fff",
                      borderRadius: 3,
                      overflow: "hidden",
                      border: "1px solid #efdbff",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(
                          (product.ordered_quantity /
                            (product.estimated_quantity || 1)) *
                            100,
                          100
                        )}%`,
                        height: "100%",
                        background: "#9254de",
                      }}
                    />
                  </div>
                </Col>
              </Row>
            </div>
          )}

          <Divider dashed />

          {/* Mô tả chi tiết */}
          <div>
            <Title level={5} style={{ marginBottom: 12 }}>
              <InfoCircleOutlined /> Mô tả sản phẩm
            </Title>
            <div
              style={{
                background: "#fff",
                border: "1px solid #f0f0f0",
                padding: 16,
                borderRadius: 8,
                minHeight: 120,
                maxHeight: 300,
                overflowY: "auto",
                lineHeight: 1.6,
                color: "#595959",
              }}
            >
              {product.description ? (
                <Paragraph
                  style={{ whiteSpace: "pre-line", marginBottom: 0 }}
                >
                  {product.description}
                </Paragraph>
              ) : (
                <Empty
                  description="Chưa có mô tả chi tiết"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Modal>
  );
}