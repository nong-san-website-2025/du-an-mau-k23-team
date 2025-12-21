import React from "react";
import { List, Space, Image, Typography, Button, Tooltip, Divider, Card } from "antd";
import { 
  WarningOutlined, StarOutlined, SyncOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, StorefrontOutlined 
} from "@ant-design/icons";
import { intcomma } from "./../../../utils/format";
import NoImage from "../../../components/shared/NoImage";
import { resolveProductImage } from "../utils";
import ComplaintForm from "./ComplaintForm";
import { FaStore } from "react-icons/fa";

const { Text, Title } = Typography;

const ProductList = ({
  order,
  cardStyle,
  isMobile,
  status,
  ratedProducts,
  onRate,
  activeComplaintItem,
  toggleComplaint,
  complaintText,
  onChangeText,
  complaintFiles,
  onChangeFiles,
  isSendingComplaint,
  sendComplaint,
}) => {

  // Helper render status (giữ logic cũ, đổi style nhẹ)
  const renderItemStatus = (item) => {
    const statusConfig = {
      'REFUND_REQUESTED': { icon: <SyncOutlined spin />, text: "Đang yêu cầu hoàn tiền", color: "#1890ff", bg: "#e6f7ff" },
      'SELLER_REJECTED': { icon: <CloseCircleOutlined />, text: "Shop từ chối", color: "#ff4d4f", bg: "#fff1f0" },
      'DISPUTE_TO_ADMIN': { icon: <WarningOutlined />, text: "Đang khiếu nại lên Sàn", color: "#faad14", bg: "#fffbe6" },
      'REFUND_APPROVED': { icon: <CheckCircleOutlined />, text: "Đã hoàn tiền", color: "#52c41a", bg: "#f6ffed" },
      'REFUND_REJECTED': { icon: <CloseCircleOutlined />, text: "Từ chối hoàn tiền", color: "#8c8c8c", bg: "#f5f5f5" },
    };

    const config = statusConfig[item.status];
    if (!config) return null;

    return (
      <div style={{ 
        display: 'inline-flex', alignItems: 'center', gap: 6, 
        padding: "4px 12px", borderRadius: 20, 
        background: config.bg, color: config.color, fontSize: 13, fontWeight: 500,
        marginBottom: 8
      }}>
        {config.icon} <span>{config.text}</span>
      </div>
    );
  };

  return (
    <Card 
      style={{ ...cardStyle, borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
      bodyStyle={{ padding: 0 }}
    >
      {/* Header Section */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0" }}>
        <Space>
          <FaStore style={{ color: "#52c41a", fontSize: 18 }} />
          <Title level={5} style={{ margin: 0 }}>Sản phẩm ({order.items?.length || 0})</Title>
        </Space>
      </div>

      <List
        dataSource={order.items || []}
        rowKey={(item) => item.id}
        split={false} // Tắt dòng kẻ mặc định của List để tự custom
        renderItem={(item, index) => {
          const productTotal = Number(item.price || 0) * Number(item.quantity || 0);
          const imageSrc = resolveProductImage(item.product_image || "");
          const isFormVisible = activeComplaintItem === item.id;
          const canComplaint = (status === "completed" || status === "delivered") && item.status === "NORMAL";

          return (
            <div key={item.id} style={{ borderBottom: index < order.items.length - 1 ? "1px solid #f0f0f0" : "none" }}>
              <div style={{ padding: isMobile ? "16px" : "20px 24px" }}>
                {/* 1. Status Badge Area */}
                <div style={{ marginBottom: 8 }}>
                  {renderItemStatus(item)}
                </div>

                {/* 2. Main Product Info Layout */}
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  {/* Image */}
                  <div style={{ 
                    flexShrink: 0, 
                    border: "1px solid #eee", 
                    borderRadius: 8, 
                    overflow: "hidden" 
                  }}>
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={item.product_name}
                        width={80}
                        height={80}
                        style={{ objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <NoImage width={80} height={80} text="No Img" />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between" }}>
                    {/* Left: Name & Variant */}
                    <div style={{ paddingRight: isMobile ? 0 : 16, marginBottom: isMobile ? 8 : 0 }}>
                      <Text strong style={{ fontSize: 16, lineHeight: 1.4, display: "block", color: "#262626" }}>
                        {item.product_name}
                      </Text>
                      {/* Placeholder for variant if needed in future */}
                      <Text type="secondary" style={{ fontSize: 13 }}>x{item.quantity}</Text>
                    </div>

                    {/* Right: Price */}
                    <div style={{ textAlign: isMobile ? "left" : "right" }}>
                      {/* Giá gốc (đơn giá) */}
                      <div style={{ color: "#8c8c8c", fontSize: 13, textDecoration: "none" }}>
                        {intcomma(item.price)}đ
                      </div>
                      {/* Thành tiền nổi bật */}
                      <div style={{ color: "#52c41a", fontWeight: 600, fontSize: 16 }}>
                        {intcomma(productTotal)}đ
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Action Footer (Buttons) */}
                <div style={{ 
                  marginTop: 16, 
                  display: "flex", 
                  justifyContent: "flex-end", 
                  gap: 12,
                  flexWrap: "wrap"
                }}>
                  {canComplaint && (
                    <Button
                      size={isMobile ? "small" : "middle"}
                      danger
                      onClick={() => toggleComplaint(item.id)}
                      style={{ borderRadius: 4 }}
                    >
                      Yêu cầu hoàn tiền
                    </Button>
                  )}
                  
                  {(status === "completed" || status === "delivered") && !ratedProducts.has(item.product) && (
                    <Tooltip title="Đánh giá để nhận xu">
                       <Button 
                          type="primary" // Nút đánh giá nên là Primary để khuyến khích
                          ghost 
                          size={isMobile ? "small" : "middle"}
                          icon={<StarOutlined />} 
                          onClick={() => onRate(item)}
                          style={{ borderRadius: 4 }}
                        >
                        Đánh giá
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Form Khiếu nại (Nhúng vào dưới item như cũ) */}
              <div style={{ padding: isFormVisible ? "0 24px 24px" : 0 }}>
                 <ComplaintForm
                  visible={isFormVisible}
                  onClose={() => toggleComplaint(null)}
                  orderItemId={item.id}
                  productName={item.product_name}
                  productPrice={item.price}
                  productQuantity={item.quantity}
                  text={complaintText}
                  files={complaintFiles}
                  isLoading={isSendingComplaint}
                  isMobile={isMobile}
                  onChangeText={onChangeText}
                  onChangeFiles={onChangeFiles}
                  onSubmit={sendComplaint}
                />
              </div>
            </div>
          );
        }}
      />

      {/* Footer Total Summary */}
      <div style={{ background: "#fafafa", padding: "16px 24px", borderTop: "1px solid #f0f0f0" }}>
        <Space direction="vertical" style={{ width: "100%" }} size={8}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <Text type="secondary">Tổng tiền hàng</Text>
            <Text>{intcomma(order.total_price - order.shipping_fee)}đ</Text>
          </div>
          {order.shipping_fee > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <Text type="secondary">Phí vận chuyển</Text>
              <Text>{intcomma(order.shipping_fee)}đ</Text>
            </div>
          )}
          <Divider style={{ margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: 500 }}>Thành tiền</Text>
            <Text style={{ fontSize: 20, fontWeight: 700, color: "#52c41a" }}>
              {intcomma(order.total_price)}đ
            </Text>
          </div>
        </Space>
      </div>
    </Card>
  );
};

export default ProductList;