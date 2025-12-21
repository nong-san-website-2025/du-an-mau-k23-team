import React, { useState, useEffect } from "react";
import {
  Modal,
  Image,
  Typography,
  Descriptions,
  Divider,
  Row,
  Col,
  Button,
  Skeleton,
  Tag,
  Space,
  Alert,
  Avatar,
  Tooltip,
} from "antd";
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  ShopOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  FileImageOutlined,
  RightOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { intcomma } from "../../../../utils/format"; // Giữ nguyên util của bạn

const { Title, Text, Paragraph } = Typography;

// --- Config (Giữ nguyên logic mapping của bạn nhưng làm icon gọn hơn) ---
const statusConfig = {
  approved: { label: "Đang bán", color: "success", icon: <CheckCircleFilled /> },
  pending: { label: "Chờ duyệt", color: "gold", icon: <ClockCircleFilled /> },
  pending_update: { label: "Chờ duyệt cập nhật", color: "orange", icon: <ClockCircleFilled /> },
  rejected: { label: "Từ chối", color: "error", icon: <CloseCircleFilled /> },
  banned: { label: "Bị khóa", color: "default", icon: <CloseCircleFilled /> },
  self_rejected: { label: "Đã hủy", color: "default", icon: <CloseCircleFilled /> },
};

export default function ProductDetailModal({
  visible,
  onClose,
  product,
  onManageImages,
}) {
  const [activeImage, setActiveImage] = useState(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  useEffect(() => {
    if (product) {
      const defaultImg =
        product.image ||
        product.main_image?.image ||
        (product.images?.length > 0 ? product.images[0].image : null);
      setActiveImage(defaultImg);
    }
  }, [product, visible]);

  if (!product && visible) return <Modal open={visible} footer={null} centered width={860}><Skeleton active /></Modal>;
  if (!product) return null;

  // --- Logic xử lý dữ liệu ---
  const status = statusConfig[product.status] || { label: product.status, color: "default" };
  const isSeason = product.availability_status === "coming_soon";
  const isRejected = ["rejected", "banned"].includes(product.status);

  const getRejectReason = (p) => {
    if (p.reject_reason?.trim()) return p.reject_reason;
    if (p.admin_note?.trim()) return p.admin_note;
    if (p.status === "rejected" && (!p.images || p.images.length === 0)) return "Thiếu hình ảnh sản phẩm.";
    return "Vi phạm chính sách sàn.";
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={860} // Chuẩn đẹp cho desktop & laptop
      centered
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 24 }}>
          <Space>
            <Text type="secondary">ID: #{product.id}</Text>
            <Divider type="vertical" />
            <Tag color={status.color} icon={status.icon} style={{ border: "none" }}>
              {status.label.toUpperCase()}
            </Tag>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Cập nhật: {dayjs(product.updated_at).format("DD/MM/YYYY HH:mm")}
          </Text>
        </div>
      }
      styles={{
        body: { padding: "20px 24px 32px" }, // Padding chuẩn Material Design
        header: { padding: "16px 24px", borderBottom: "1px solid #f0f0f0" }
      }}
    >
      {/* Alert Lý do từ chối (Chỉ hiện khi cần thiết) */}
      {isRejected && (
        <Alert
          message="Yêu cầu cần chỉnh sửa"
          description={getRejectReason(product)}
          type="error"
          showIcon
          style={{ marginBottom: 20 }}
          action={
            (!product.images?.length && product.status === "rejected") && (
              <Button size="small" type="primary" danger onClick={() => onManageImages(product)}>
                Thêm ảnh
              </Button>
            )
          }
        />
      )}

      <Row gutter={[32, 24]}>
        {/* --- LEFT COLUMN: IMAGES (Chiếm 10/24) --- */}
        <Col xs={24} md={10}>
          <div style={{ position: "sticky", top: 20 }}>
            {/* Ảnh chính - Tỉ lệ 1:1 hoặc 4:3 đẹp hơn */}
            <div style={{
              width: "100%",
              aspectRatio: "1/1",
              background: "#fafafa",
              borderRadius: 8,
              border: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              overflow: "hidden"
            }}>
              <Image
                src={activeImage}
                width="100%"
                height="100%"
                style={{ objectFit: "contain", padding: 8 }}
                fallback="/no-image.png"
              />
            </div>

            {/* Thumbnails - Scroll ngang mượt mà */}
            {product.images?.length > 0 && (
              <div style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 4,
                marginBottom: 16,
                scrollbarWidth: "none" // Ẩn scrollbar cho đẹp
              }}>
                {product.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImage(img.image)}
                    style={{
                      width: 64,
                      height: 64,
                      flexShrink: 0,
                      cursor: "pointer",
                      borderRadius: 6,
                      border: activeImage === img.image ? "2px solid #1890ff" : "1px solid #eee",
                      padding: 2,
                      opacity: activeImage === img.image ? 1 : 0.7,
                      transition: "all 0.2s"
                    }}
                  >
                    <img src={img.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} />
                  </div>
                ))}
              </div>
            )}

            <Button icon={<FileImageOutlined />} block onClick={() => onManageImages(product)}>
              Quản lý thư viện ảnh ({product.images?.length || 0})
            </Button>
          </div>
        </Col>

        {/* --- RIGHT COLUMN: INFO (Chiếm 14/24) --- */}
        <Col xs={24} md={14}>
          {/* Tên sản phẩm & Shop */}
          <Title level={3} style={{ marginBottom: 8, marginTop: 0, lineHeight: 1.3 }}>
            {product.name}
          </Title>

          <Space style={{ marginBottom: 16 }}>
            <Avatar size="small" icon={<ShopOutlined />} style={{ backgroundColor: '#87d068' }} />
            <Text strong>{product.seller_name || "Cửa hàng"}</Text>
            <Divider type="vertical" />
            <Text type="secondary">{product.category_name} &gt; {product.subcategory_name}</Text>
          </Space>

          {/* Pricing Section - Clean Design */}
          <div style={{ marginBottom: 24 }}>
            <Space align="baseline">
              <Text style={{ fontSize: 32, fontWeight: 700, color: "#ff4d4f" }}>
                {intcomma(product.discounted_price)}₫
              </Text>
              {product.original_price > product.discounted_price && (
                <Text delete type="secondary" style={{ fontSize: 16 }}>
                  {intcomma(product.original_price)}₫
                </Text>
              )}
              <Tag color={product.availability_status === 'out_of_stock' ? 'red' : 'blue'}>
                {product.availability_status === 'out_of_stock' ? 'Hết hàng' : 'Có sẵn'}
              </Tag>
            </Space>
            <div style={{ fontSize: 13, color: "#8c8c8c", marginTop: 4 }}>
              Đơn vị tính: {product.unit || "kg"}
            </div>
          </div>

          {/* Thông số quan trọng (Grid nhỏ) */}
          <div style={{ background: "#f9f9f9", padding: 16, borderRadius: 8, marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>Tồn kho</Text>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{intcomma(product.stock)}</div>
              </Col>
              <Col span={8} style={{ borderLeft: "1px solid #e8e8e8", paddingLeft: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Đã bán</Text>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{intcomma(product.sold || 0)}</div>
              </Col>
              <Col span={8} style={{ borderLeft: "1px solid #e8e8e8", paddingLeft: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Phí hoa hồng sàn</Text>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#13c2c2" }}>
                  {/* Giả sử backend trả về commission_rate dạng 0.05 hoặc 0.08 */}
                  {product.commission_rate ? `${(product.commission_rate * 100).toFixed(1)}%` : "0%"}
                </div>
              </Col>
            </Row>
          </div>

          {/* Mùa vụ (Nếu có) - Dùng style nhẹ nhàng hơn */}
          {isSeason && (
            <div style={{ border: "1px dashed #722ed1", background: "#f9f0ff", padding: 12, borderRadius: 8, marginBottom: 24 }}>
              <Space style={{ color: "#722ed1", fontWeight: 600 }}>
                <CalendarOutlined /> Kế hoạch mùa vụ
              </Space>
              <Row style={{ marginTop: 8 }} align="middle">
                <Col span={10}>
                  <Text style={{ fontSize: 13 }}>
                    {dayjs(product.season_start).format("DD/MM")} - {dayjs(product.season_end).format("DD/MM/YYYY")}
                  </Text>
                </Col>
                <Col span={14}>
                  <Tooltip title={`Đã đặt: ${intcomma(product.ordered_quantity)} / ${intcomma(product.estimated_quantity)}`}>
                    <div style={{ height: 6, background: "#e0d4f5", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min((product.ordered_quantity / (product.estimated_quantity || 1)) * 100, 100)}%`, height: "100%", background: "#722ed1" }} />
                    </div>
                  </Tooltip>
                </Col>
              </Row>
            </div>
          )}

          {/* Chi tiết / Mô tả */}
          <Divider orientation="left" style={{ margin: "12px 0" }}>
            <InfoCircleOutlined /> Chi tiết
          </Divider>

          <Descriptions column={1} size="small" labelStyle={{ width: 100, color: "#8c8c8c" }}>
            <Descriptions.Item label="Xuất xứ">{product.location || "Việt Nam"}</Descriptions.Item>
            <Descriptions.Item label="Mô tả">
              <Paragraph
                ellipsis={!isDescExpanded ? { rows: 3, expandable: false } : false}
                style={{ marginBottom: 0, whiteSpace: 'pre-line', color: "#595959" }}
              >
                {product.description || "Chưa có mô tả chi tiết."}
              </Paragraph>
              {product.description && product.description.length > 150 && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  style={{ padding: 0 }}
                >
                  {isDescExpanded ? "Thu gọn" : "Xem thêm"}
                </Button>
              )}
            </Descriptions.Item>
          </Descriptions>

        </Col>
      </Row>
    </Modal>
  );
}