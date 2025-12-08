import React from "react";
import {
  Drawer,
  Descriptions,
  Tag,
  Image,
  Space,
  Button,
  Tabs,
  Typography,
  Row,
  Col,
  Statistic,
  Divider,
  Card,
  Tooltip,
  Rate,
} from "antd";
import {
  CloseOutlined,
  CopyOutlined,
  DollarOutlined,
  FileImageOutlined,
  InfoCircleOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LockOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { intcomma } from "../../../../../utils/format";
// Nếu chưa có file format, dùng hàm dự phòng bên dưới:
// const intcomma = (val) => val ? Number(val).toLocaleString('vi-VN') : '0';

const { Text, Title, Paragraph } = Typography;

export default function ProductDetailDrawer({ visible, product, onClose }) {
  if (!product) return null;

  // --- Helpers ---
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const statusConfig = {
    approved: { label: "Đang bán", color: "success", icon: <CheckCircleOutlined /> },
    pending: { label: "Chờ duyệt", color: "processing", icon: <ClockCircleOutlined /> },
    rejected: { label: "Từ chối", color: "error", icon: <CloseCircleOutlined /> },
    banned: { label: "Bị khóa", color: "default", icon: <LockOutlined /> },
    default: { label: "Không xác định", color: "default", icon: <QuestionCircleOutlined /> },
  };

  const stockConfig = {
    available: { label: "Đang kinh doanh", color: "cyan" },
    out_of_stock: { label: "Ngừng kinh doanh", color: "volcano" },
    coming_soon: { label: "Sắp mở bán", color: "gold" },
  };

  const getStatus = (status) => statusConfig[status] || statusConfig.default;
  const getStockStatus = (status) => stockConfig[status] || stockConfig.available;

  // --- Tab 1: Thông tin chung ---
  const renderGeneralInfo = () => (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Descriptions
        title="Định danh & Phân loại"
        bordered
        size="small"
        column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
      >
        <Descriptions.Item label="Tên sản phẩm" span={2}>
          <Text strong>{product.name}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Mã sản phẩm (ID)">
          <Space>
            <Text code>{product.id}</Text>
            <Tooltip title="Sao chép ID">
              <Button
                type="text"
                icon={<CopyOutlined />}
                size="small"
                onClick={() => copyToClipboard(product.id)}
              />
            </Tooltip>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Thương hiệu">
          {product.brand || "No Brand"}
        </Descriptions.Item>
        <Descriptions.Item label="Danh mục chính">
          <Tag color="blue">{product.category_name}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Danh mục phụ">
          {product.subcategory_name || "—"}
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 16 }}>
        <Title level={5}>Mô tả chi tiết</Title>
        <Card size="small" style={{ background: "#f9fafb" }}>
          <Paragraph
            ellipsis={{ rows: 6, expandable: true, symbol: "Xem thêm" }}
            style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}
          >
            {product.description || "Chưa có mô tả chi tiết cho sản phẩm này."}
          </Paragraph>
        </Card>
      </div>
    </Space>
  );

  // --- Tab 2: Kinh doanh (Logic tính lợi nhuận Admin) ---
  const renderBusinessInfo = () => (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row gutter={16}>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title="Giá bán hiện tại"
              value={product.discounted_price || product.price}
              formatter={(val) => intcomma(val) + ' đ'}
              valueStyle={{ color: "#3f8600", fontWeight: 600 }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title="Đã bán"
              value={product.sold_count}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>
      </Row>

      <Descriptions title="Chi tiết giá & Lợi nhuận sàn" bordered size="small" column={1}>
        <Descriptions.Item label="Giá niêm yết (Gốc)">
          <Text delete type="secondary">
            {intcomma(product.original_price)} đ
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Giá khuyến mãi (Thực tế)">
          <Text type="danger" strong>
            {intcomma(product.discounted_price)} đ
          </Text>
        </Descriptions.Item>

        {/* --- PHẦN TÍNH TOÁN LỢI NHUẬN ADMIN --- */}
        <Descriptions.Item label="Biên lợi nhuận ước tính (Phí sàn)">
          {product.commission_rate != null && !isNaN(Number(product.commission_rate)) && product.discounted_price ? (
            <Space>
              {/* 1. Hiển thị số tiền Admin nhận được */}
              <Tag color="green" style={{ fontSize: 14, padding: '4px 8px' }}>
                {(() => {
                  const price = Number(product.discounted_price);
                  const rate = Number(product.commission_rate);

                  // Logic: Lợi nhuận = Giá bán * Tỉ lệ hoa hồng
                  const profit = price * rate;

                  return `+${intcomma(Math.round(profit))} đ`;
                })()}
              </Tag>

              {/* 2. Hiển thị tỉ lệ % để đối chiếu */}
              <Text type="secondary">
                (Rate: {Number(product.commission_rate) * 100}%)
              </Text>
            </Space>
          ) : (
            <Tag color="default">Chưa thiết lập phí sàn</Tag>
          )}
        </Descriptions.Item>
        {/* ------------------------------------------- */}
      </Descriptions>
    </Space>
  );

  // --- Tab 3: SEO ---
  const renderSeoInfo = () => (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Descriptions title="Cấu hình SEO (Marketing)" bordered size="small" column={1}>
        <Descriptions.Item label="URL Slug">
          <Text code>{product.slug || "/san-pham"}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Meta Title">
          {product.meta_title || product.name}
        </Descriptions.Item>
        <Descriptions.Item label="Meta Keywords">
          {product.meta_keywords || "do an, thuc pham"}
        </Descriptions.Item>
      </Descriptions>
    </Space>
  );

  // --- Tab 4: Hình ảnh ---
  const renderImages = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Text strong>Ảnh đại diện & Gallery ({product.images?.length || 0})</Text>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 16,
        }}
      >
        {product.images?.map((img, index) => (
          <div
            key={img.id || index}
            style={{
              border: img.is_primary ? "2px solid #1677ff" : "1px solid #d9d9d9",
              borderRadius: 8,
              padding: 4,
              position: "relative",
            }}
          >
            <Image
              src={img.image}
              width="100%"
              height={120}
              style={{ objectFit: "cover", borderRadius: 4 }}
            />
            {img.is_primary && (
              <Tag color="blue" style={{ position: "absolute", top: 8, right: 0 }}>
                Chính
              </Tag>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const items = [
    { key: "1", label: <span><InfoCircleOutlined /> Tổng quan</span>, children: renderGeneralInfo() },
    { key: "2", label: <span><DollarOutlined /> Kinh doanh</span>, children: renderBusinessInfo() },
    { key: "3", label: <span><SearchOutlined /> SEO</span>, children: renderSeoInfo() },
    { key: "4", label: <span><FileImageOutlined /> Hình ảnh</span>, children: renderImages() },
  ];

  return (
    <Drawer
      title={
        <Space>
          <span>Chi tiết sản phẩm</span>
          <Tag color={getStatus(product.status).color}>
            {getStatus(product.status).icon} {getStatus(product.status).label}
          </Tag>
        </Space>
      }
      width={800}
      onClose={onClose}
      open={visible}
      closable={false}
      styles={{ body: { padding: 0, paddingBottom: 24 } }}
      extra={
        <Space>
          <Tooltip title="Xem sản phẩm trên web">
            <Button
              type="text"
              icon={<GlobalOutlined />}
              target="_blank"
              href={`/products/${product.id}`}
              style={{ color: '#595959' }}
            >
              Xem Web
            </Button>
          </Tooltip>
          <Divider type="vertical" />
          <Tooltip title="Đóng (Esc)">
            <Button
              icon={<CloseOutlined />}
              onClick={onClose}
              danger
              type="text"
            />
          </Tooltip>
        </Space>
      }
      footer={
        <div style={{ textAlign: "right", color: "#8c8c8c", fontSize: 12 }}>
          <Space split={<Divider type="vertical" />}>
            <span>Ngày tạo: {new Date(product.created_at).toLocaleString("vi-VN")}</span>
            <span>Cập nhật: {new Date(product.updated_at).toLocaleString("vi-VN")}</span>
          </Space>
        </div>
      }
    >
      <div style={{ padding: "20px 24px", background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
        <Row gutter={24} align="middle">
          <Col flex="100px">
            <Image
              width={100}
              height={100}
              src={product.main_image?.image || "https://via.placeholder.com/150"}
              style={{ borderRadius: 8, objectFit: "cover", border: '1px solid #f0f0f0' }}
            />
          </Col>
          <Col flex="auto">
            <Text type="secondary" style={{ fontSize: 12 }}>#{product.id} • {product.category_name}</Text>
            <Title level={4} style={{ margin: "4px 0" }}>
              {product.name}
            </Title>
            <Space>
              <Tag color={getStockStatus(product.availability_status).color}>
                {getStockStatus(product.availability_status).label}
              </Tag>
              <Text strong style={{ color: '#cf1322', fontSize: 16 }}>
                {intcomma(product.discounted_price)} đ
              </Text>
              <Rate
                disabled
                defaultValue={Number(product.rating)}
                style={{ fontSize: 14 }}
                allowHalf
              />
              <Text type="secondary" style={{ fontSize: 12 }}>({product.review_count} đánh giá)</Text>
            </Space>
          </Col>
        </Row>
      </div>

      <div style={{ padding: "0 24px" }}>
        <Tabs defaultActiveKey="1" items={items} size="middle" style={{ marginTop: 12 }} />
      </div>
    </Drawer>
  );
}