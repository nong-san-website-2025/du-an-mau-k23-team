import React, { useState, useEffect, useMemo } from "react";
import {
  Modal, Image, Typography, Row, Col, Button,
  Tag, Space, Alert, Tabs, Statistic, Divider, Card,
  Badge, Rate
} from "antd";
import {
  CheckCircleFilled, ClockCircleFilled, CloseCircleFilled,
  ShopOutlined, CalendarOutlined, FileImageOutlined,
  DollarOutlined, ExperimentOutlined,
  InboxOutlined, RiseOutlined, StopOutlined,
  RightOutlined, StarFilled, EnvironmentOutlined, InfoCircleOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

// --- UTILS FORMAT TIỀN TỆ ---
const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// --- CONFIG STATUS ---
const statusConfig = {
  approved: { label: "Đang bán", color: "success", icon: <CheckCircleFilled /> },
  pending: { label: "Chờ duyệt", color: "gold", icon: <ClockCircleFilled /> },
  pending_update: { label: "Chờ duyệt cập nhật", color: "orange", icon: <ClockCircleFilled /> },
  rejected: { label: "Từ chối", color: "error", icon: <CloseCircleFilled /> },
  banned: { label: "Bị khóa", color: "default", icon: <StopOutlined /> },
  self_rejected: { label: "Đã ẩn/Hủy", color: "default", icon: <StopOutlined /> },
};

export default function ProductDetailModal({ visible, onClose, product, onManageImages }) {
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    if (product) {
      const defaultImg = product.main_image?.image || (product.images?.length > 0 ? product.images[0].image : null) || product.image;
      setActiveImage(defaultImg);
    }
  }, [product, visible]);

  // --- TÍNH TOÁN TÀI CHÍNH ---
  const financialData = useMemo(() => {
    if (!product) return null;
    
    const sellingPrice = Number(product.discounted_price || product.original_price || 0);
    const taxRate = product.tax_rate || 0;
    const commissionRate = product.commission_rate || 0;

    // 1. Tách thuế: Giá bán = Giá chưa thuế * (1 + tax%)
    const priceExcludingTax = sellingPrice / (1 + taxRate / 100);
    const taxAmount = Math.round(sellingPrice - priceExcludingTax);

    // 2. Phí sàn: Tính trên giá bán (bao gồm thuế)
    const feeAmount = Math.round(sellingPrice * commissionRate);

    // 3. Thực nhận
    const netIncome = sellingPrice - taxAmount - feeAmount;

    return { sellingPrice, taxRate, taxAmount, commissionRate, feeAmount, netIncome };
  }, [product]);

  if (!product) return null;

  const status = statusConfig[product.status] || { label: product.status, color: "default" };
  const hasPendingUpdate = product.pending_update || (product.comparison_data && product.comparison_data.has_changes);

  // --- RENDER SECTIONS ---

  // 1. Cột Trái: Ảnh
  const renderImageGallery = () => (
    <div style={{ position: "sticky", top: 20 }}>
      <div style={{
        width: "100%", aspectRatio: "1/1", background: "#f5f5f5",
        borderRadius: 8, border: "1px solid #f0f0f0",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 12, overflow: "hidden"
      }}>
        <Image
          src={activeImage}
          width="100%" height="100%"
          style={{ objectFit: "contain", padding: 8 }}
          fallback="/no-image.png"
        />
      </div>
      {product.images?.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 12 }}>
          {product.images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setActiveImage(img.image)}
              style={{
                width: 60, height: 60, flexShrink: 0, cursor: "pointer",
                borderRadius: 6,
                border: activeImage === img.image ? "2px solid #1890ff" : "1px solid #eee",
                padding: 2, opacity: activeImage === img.image ? 1 : 0.6
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
  );

  // 2. Tab Thông tin chính
  const renderMainInfo = () => (
    <>
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">{product.category_name} &gt; {product.subcategory_name}</Text>
        <Title level={3} style={{ margin: "4px 0 8px" }}>{product.name}</Title>
        
        {/* [MỚI] Bổ sung Rating và Location */}
        <Space split={<Divider type="vertical" />} wrap>
            <Tag color="blue">{product.brand || "No Brand"}</Tag>
            
            <Space size={4}>
                <StarFilled style={{ color: "#fadb14" }} />
                <Text strong>{product.rating || "0.0"}</Text>
                <Text type="secondary">({product.review_count || 0} đánh giá)</Text>
            </Space>

            <Space size={4}>
                <EnvironmentOutlined />
                <Text>{product.location || "Chưa cập nhật"}</Text>
            </Space>
        </Space>
        
        <div style={{ marginTop: 8 }}>
            <Space>
                <ShopOutlined /> 
                <Text strong>{product.seller_name || "Cửa hàng của bạn"}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>(ID SP: #{product.id})</Text>
            </Space>
        </div>
      </div>

      {/* CARD TÀI CHÍNH */}
      <Card 
        size="small" 
        style={{ background: '#f6ffed', borderColor: '#b7eb8f', marginBottom: 20 }}
        title={<span style={{ color: '#389e0d' }}><DollarOutlined /> Dòng tiền dự kiến</span>}
      >
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Statistic 
              title="Giá khách trả" 
              value={financialData.sellingPrice} 
              formatter={(v) => formatCurrency(v)}
              valueStyle={{ fontSize: 16, fontWeight: 600 }}
            />
          </Col>
          <Col span={16}>
             <Space direction="vertical" size={0} style={{ width: '100%', fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <Text type="secondary">Thuế GTGT ({financialData.taxRate}%):</Text>
                   <Text type="danger">- {formatCurrency(financialData.taxAmount)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <Text type="secondary">Phí sàn ({(financialData.commissionRate * 100).toFixed(1)}%):</Text>
                   <Text type="danger">- {formatCurrency(financialData.feeAmount)}</Text>
                </div>
                <Divider style={{ margin: '6px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <Text strong type="success">THỰC NHẬN:</Text>
                   <Text strong type="success" style={{ fontSize: 16 }}>{formatCurrency(financialData.netIncome)}</Text>
                </div>
             </Space>
          </Col>
        </Row>
      </Card>

      {/* THÔNG SỐ LOGISTICS & KHO (Đã bỏ Trọng lượng) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
         <Col span={12}>
            <Statistic 
               title="Tồn kho sẵn sàng" 
               value={product.stock} 
               prefix={<InboxOutlined />} 
               valueStyle={{ fontSize: 18 }} 
            />
         </Col>
         <Col span={12}>
            <Statistic 
               title="Đã bán" 
               value={product.sold || 0} 
               prefix={<RiseOutlined />} 
               valueStyle={{ fontSize: 18 }} 
            />
         </Col>
      </Row>

      {/* MÙA VỤ */}
      {product.availability_status === 'coming_soon' && (
        <Alert
          message="Kế hoạch bán trước (Coming Soon)"
          description={
            <Space direction="vertical" size={0}>
               <Text>Thời gian: {dayjs(product.season_start).format("DD/MM")} - {dayjs(product.season_end).format("DD/MM/YYYY")}</Text>
               <Text>Tiến độ đặt: {product.ordered_quantity} / {product.estimated_quantity} suất</Text>
            </Space>
          }
          type="info"
          showIcon
          icon={<CalendarOutlined />}
          style={{ marginBottom: 20 }}
        />
      )}

      <Divider orientation="left" plain style={{ margin: '10px 0' }}>Mô tả chi tiết</Divider>
      <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, maxHeight: 200, overflowY: 'auto' }}>
         <Paragraph style={{ whiteSpace: 'pre-line', margin: 0 }}>
            {product.description}
         </Paragraph>
      </div>
    </>
  );

  // 3. Tab So sánh (Khi có Pending Update)
  const renderComparison = () => {
     if (!product.comparison_data || !product.comparison_data.has_changes) {
       return <Alert type="warning" message="Không có dữ liệu so sánh chi tiết." />;
     }
     const { current, pending, changes } = product.comparison_data;

     const renderDiffRow = (label, key, formatter = (v) => v) => {
        const isChanged = changes[key];
        return (
           <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
              <Row gutter={16} align="middle" style={{ marginTop: 4 }}>
                 <Col span={11}>
                    <Text type="secondary" delete={!!isChanged}>{formatter(current[key]) || '(Trống)'}</Text>
                 </Col>
                 <Col span={2} style={{ textAlign: 'center' }}>
                    {isChanged && <RightOutlined style={{ color: '#1890ff', fontSize: 10 }} />}
                 </Col>
                 <Col span={11}>
                    <Text strong={!!isChanged} style={{ color: isChanged ? '#1890ff' : 'inherit' }}>
                       {formatter(pending[key]) || '(Trống)'}
                    </Text>
                 </Col>
              </Row>
           </div>
        );
     };

     return (
        <div style={{ padding: '0 8px' }}>
           <Alert message="Dưới đây là các thay đổi bạn đã yêu cầu và đang chờ Admin duyệt." type="info" showIcon style={{ marginBottom: 16 }} />
           {renderDiffRow("Tên sản phẩm", "name")}
           {renderDiffRow("Giá gốc", "original_price", formatCurrency)}
           {renderDiffRow("Giá khuyến mãi", "discounted_price", formatCurrency)}
           {renderDiffRow("Thuế GTGT", "tax_rate", (v) => `${v}%`)}
           {renderDiffRow("Tồn kho", "stock")}
           {renderDiffRow("Mô tả", "description", (v) => v ? `${v.substring(0, 50)}...` : '')}
        </div>
     );
  };

  // --- MAIN RENDER ---
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
           <Text strong style={{ fontSize: 16 }}>CHI TIẾT SẢN PHẨM</Text>
           <Tag color={status.color} icon={status.icon}>{status.label.toUpperCase()}</Tag>
        </div>
      }
      styles={{ body: { padding: '24px' } }}
    >
      {["rejected", "banned"].includes(product.status) && (
        <Alert
          message="Sản phẩm bị từ chối/khóa"
          description={<>Lý do: <Text type="danger" strong>{product.reject_reason || "Vi phạm quy định"}</Text></>}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={32}>
        <Col xs={24} md={9}>
          {renderImageGallery()}
        </Col>

        <Col xs={24} md={15}>
          {hasPendingUpdate ? (
             <Tabs
                defaultActiveKey="current"
                items={[
                   { key: 'current', label: 'Thông tin hiện tại', children: renderMainInfo() },
                   { 
                      key: 'pending', 
                      label: <Badge dot><span>Yêu cầu thay đổi</span></Badge>, 
                      children: renderComparison() 
                   }
                ]}
             />
          ) : (
             renderMainInfo()
          )}
        </Col>
      </Row>
    </Modal>
  );
}