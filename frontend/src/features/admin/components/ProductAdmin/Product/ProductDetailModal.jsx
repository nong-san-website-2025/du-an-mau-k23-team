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
  Alert,
  Progress
} from "antd";
import {
  DollarOutlined,
  FileImageOutlined,
  InfoCircleOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LockOutlined,
  WarningOutlined,
  HistoryOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  DeploymentUnitOutlined,
  ShopOutlined
} from "@ant-design/icons";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { intcomma } from "../../../../../utils/format";

// Kích hoạt plugin
dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Text, Title, Paragraph } = Typography;

export default function ProductDetailDrawer({ visible, product, onClose }) {
  if (!product) return null;

  // Logic xác định hàng Update (Nếu trạng thái pending và updated > created 5 phút)
  const isUpdate = product.status === 'pending_update' || (product.status === 'pending' && 
    dayjs(product.updated_at).diff(dayjs(product.created_at), 'minute') > 5);

  const statusConfig = {
    approved: { label: "Đang bán", color: "success", icon: <CheckCircleOutlined /> },
    pending: { label: "Chờ duyệt", color: "gold", icon: <ClockCircleOutlined /> },
    pending_update: { label: "Chờ duyệt cập nhật", color: "orange", icon: <HistoryOutlined /> },
    rejected: { label: "Từ chối", color: "error", icon: <CloseCircleOutlined /> },
    banned: { label: "Bị khóa", color: "default", icon: <LockOutlined /> },
    self_rejected: { label: "Đã hủy", color: "default", icon: <CloseCircleOutlined /> },
  };

  const availabilityConfig = {
    available: { text: "Có sẵn", color: "blue" },
    coming_soon: { text: "Sắp có (Mùa vụ)", color: "purple" },
    out_of_stock: { text: "Hết hàng", color: "red" },
  };

  const getStatus = (s) => statusConfig[s] || { label: s, color: "default" };

  // --- 1. Tab Thông tin chung ---
  const renderGeneralInfo = () => (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Descriptions bordered size="small" column={1} labelStyle={{ width: '140px' }}>
        <Descriptions.Item label="Danh mục">
          <Text strong>{product.category_name}</Text> / {product.subcategory_name}
        </Descriptions.Item>
        
        {/* Đã bỏ Thương hiệu */}
        
        <Descriptions.Item label="Cửa hàng">
           <Space><ShopOutlined /> {product.seller_name}</Space>
        </Descriptions.Item>
        
        {/* Mới thêm: Nơi sản xuất */}
        <Descriptions.Item label="Xuất xứ">
            <Space><EnvironmentOutlined style={{ color: '#eb2f96' }} /> {product.location || "Chưa cập nhật"}</Space>
        </Descriptions.Item>

        {/* Mới thêm: Đơn vị tính */}
        <Descriptions.Item label="Đơn vị tính">
            <Space><DeploymentUnitOutlined style={{ color: '#1890ff' }} /> {product.unit || "kg"}</Space>
        </Descriptions.Item>
      </Descriptions>

      <Card size="small" title="Mô tả chi tiết" style={{ background: "#f9fafb", marginTop: 10 }}>
        <Paragraph ellipsis={{ rows: 8, expandable: true }} style={{ whiteSpace: 'pre-line' }}>
            {product.description}
        </Paragraph>
      </Card>
    </Space>
  );

  // --- 2. Tab Giá & Kho & Mùa vụ ---
  const renderBusinessInfo = () => {
    const isSeason = product.availability_status === 'coming_soon';
    
    // Tính phần trăm đặt trước (nếu là mùa vụ)
    const percentOrdered = isSeason && product.estimated_quantity > 0 
        ? Math.round((product.ordered_quantity / product.estimated_quantity) * 100) 
        : 0;

    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        {/* Phần Giá */}
        <Card size="small" style={{ borderColor: '#d9d9d9' }}>
            <Row gutter={16}>
            <Col span={12}>
                <Statistic 
                    title="Giá gốc" 
                    value={product.original_price} 
                    formatter={v => intcomma(v) + ' đ'} 
                    valueStyle={{ fontSize: 16, color: '#8c8c8c', textDecoration: 'line-through' }} 
                />
            </Col>
            <Col span={12}>
                <Statistic 
                    title="Giá bán (KM)" 
                    value={product.discounted_price} 
                    formatter={v => intcomma(v) + ' đ'} 
                    valueStyle={{ fontSize: 22, color: '#cf1322', fontWeight: 'bold' }} 
                />
            </Col>
            </Row>
        </Card>

        <Divider style={{ margin: '12px 0' }} />

        {/* Thông tin Kho & Trạng thái */}
        <Descriptions size="small" column={1} bordered labelStyle={{ width: '140px' }}>
            <Descriptions.Item label="Trạng thái kho">
                <Tag color={availabilityConfig[product.availability_status]?.color}>
                    {availabilityConfig[product.availability_status]?.text || product.availability_status}
                </Tag>
            </Descriptions.Item>
            
            <Descriptions.Item label="Tồn kho thực tế">
                <b>{intcomma(product.stock)}</b> {product.unit}
            </Descriptions.Item>
            
            <Descriptions.Item label="Đã bán">
                {intcomma(product.sold || 0)} {product.unit}
            </Descriptions.Item>
            
            <Descriptions.Item label="Hoa hồng sàn">
                {product.commission_rate ? <Tag color="green">{product.commission_rate * 100}%</Tag> : <Text type="secondary">Mặc định</Text>}
            </Descriptions.Item>
        </Descriptions>

        {/* --- HIỂN THỊ THÔNG TIN MÙA VỤ (NẾU CÓ) --- */}
        {isSeason && (
            <Alert
                message={
                    <Space>
                        <CalendarOutlined /> 
                        <Text strong>Thông tin Mùa vụ & Đặt trước</Text>
                    </Space>
                }
                description={
                    <div style={{ marginTop: 8 }}>
                        <Row gutter={[16, 8]}>
                            <Col span={12}>
                                <Text type="secondary">Bắt đầu:</Text><br/>
                                {product.season_start ? dayjs(product.season_start).format('DD/MM/YYYY') : '---'}
                            </Col>
                            <Col span={12}>
                                <Text type="secondary">Kết thúc:</Text><br/>
                                {product.season_end ? dayjs(product.season_end).format('DD/MM/YYYY') : '---'}
                            </Col>
                        </Row>
                        <Divider style={{ margin: '8px 0' }} dashed />
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text>Đã đặt trước:</Text>
                                <Text strong>{intcomma(product.ordered_quantity)} / {intcomma(product.estimated_quantity)} {product.unit}</Text>
                            </div>
                            <Progress percent={percentOrdered} size="small" status="active" strokeColor="#722ed1" />
                        </div>
                    </div>
                }
                type="info"
                style={{ marginTop: 16, border: '1px solid #d3adf7', background: '#f9f0ff' }}
            />
        )}
      </Space>
    );
  };

  // --- 3. Tab Hình ảnh ---
  const renderImages = () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
      {product.images?.map((img, idx) => (
        <div key={idx} style={{ position: "relative", border: img.is_primary ? "2px solid #1890ff" : "1px solid #ddd", borderRadius: 4, overflow: 'hidden' }}>
          <Image 
            src={img.image} 
            style={{ objectFit: 'cover', display: 'block' }} 
            height={100} 
            width="100%" 
          />
          {img.is_primary && <Tag color="blue" style={{ position: 'absolute', top: 0, right: 0, margin: 0, borderRadius: '0 0 0 4px', fontSize: 10 }}>Chính</Tag>}
        </div>
      ))}
      {(!product.images || product.images.length === 0) && <Text type="secondary">Không có hình ảnh</Text>}
    </div>
  );

  const items = [
    { key: "1", label: <span><InfoCircleOutlined /> Thông tin</span>, children: renderGeneralInfo() },
    { key: "2", label: <span><DollarOutlined /> Giá & Kho</span>, children: renderBusinessInfo() },
    { key: "3", label: <span><FileImageOutlined /> Hình ảnh ({product.images?.length || 0})</span>, children: renderImages() },
  ];

  return (
    <Drawer
      title={
        <Space>
          <span>Chi tiết sản phẩm</span>
          <Tag color={getStatus(product.status).color}>
            {getStatus(product.status).icon} {getStatus(product.status).label}
          </Tag>
          {/* Tag Cảnh báo trên Header */}
          {isUpdate && (
            <Tag color="warning" icon={<HistoryOutlined />}>Đã chỉnh sửa</Tag>
          )}
        </Space>
      }
      width={720}
      onClose={onClose}
      open={visible}
      extra={
        <Space>
           {/* Nút xem web chỉ hiện khi đã duyệt */}
           {product.status === 'approved' && 
                <Button type="link" href={`/product/${product.id}`} target="_blank" icon={<GlobalOutlined />}>
                    Xem trên Web
                </Button>
           }
        </Space>
      }
    >
      {/* Cảnh báo cập nhật */}
      {isUpdate && (
        <Alert
          message="Cảnh báo: Sản phẩm có cập nhật mới"
          description={
            <div>
              Sản phẩm này vừa được Người bán chỉnh sửa lúc <b>{dayjs(product.updated_at).format("HH:mm DD/MM/YYYY")}</b>.
              <br />
              Vui lòng kiểm tra kỹ các thay đổi trước khi duyệt.
            </div>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 20 }}
        />
      )}

      {/* Header Info thu gọn */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
         <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 2 }}>
            <Image 
                width={80} 
                height={80} 
                src={product.image || product.images?.[0]?.image} // Ưu tiên ảnh thumbnail
                style={{ borderRadius: 4, objectFit: 'cover' }} 
                fallback="/no-image.png"
            />
         </div>
         <div style={{ flex: 1 }}>
            <Title level={4} style={{ margin: '0 0 4px 0', fontSize: 18 }}>{product.name}</Title>
            <Space split={<Divider type="vertical" />}>
                <Text type="secondary">ID: #{product.id}</Text>
                <Text type="secondary"><ClockCircleOutlined /> Cập nhật: {dayjs(product.updated_at).fromNow()}</Text>
            </Space>
            <div style={{ marginTop: 6 }}>
                <Tag color="cyan">{product.category_name}</Tag>
                <Tag>{product.subcategory_name}</Tag>
            </div>
         </div>
      </div>

      <Tabs defaultActiveKey="1" items={items} type="card" />
    </Drawer>
  );
}