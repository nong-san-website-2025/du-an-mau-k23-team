// src/pages/Orders/components/ProductList.jsx
import React from "react";
import { List, Space, Image, Typography, Button, Tooltip, Divider, Card } from "antd";
import { 
  WarningOutlined, StarOutlined, SyncOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, CarOutlined, 
  TagOutlined, ExclamationCircleOutlined 
} from "@ant-design/icons";
import { FaStore } from "react-icons/fa";

// Import các utils và component cũ
import { intcomma } from "./../../../utils/format";
import NoImage from "../../../components/shared/NoImage";
import { resolveProductImage } from "../utils";

// Component con
import ComplaintForm from "./ComplaintForm";
import DisputeActionZone from "./DisputeActionZone";

const { Text, Title } = Typography;

const ProductList = ({
  order,
  cardStyle,
  isMobile,
  status,
  ratedProducts,
  onRate,
  
  // Props cho khiếu nại
  activeComplaintItem,
  toggleComplaint,
  complaintText,
  onChangeText,
  complaintFiles,
  onChangeFiles,
  isSendingComplaint,
  sendComplaint,
  
  // Props for navigation
  onProductClick,

  // --- [MỚI] Props xử lý gửi lên sàn ---
  onEscalate 
}) => {

  const getComplaint = (item) => item.complaint || item.return_request || null;

  const selectedItemForForm = activeComplaintItem 
    ? order.items.find(item => item.id === activeComplaintItem) 
    : null;

  // Hàm render status thông minh hơn
  // Ưu tiên check trạng thái trong 'complaint' trước, nếu không có mới check 'item.status'
  const renderItemStatus = (item, complaintData) => {
    let config = null;

    // 1. Ưu tiên hiển thị theo trạng thái thực tế của Khiếu nại (Complaint)
    if (complaintData) {
        const complaintStatusMap = {
            'pending': { icon: <SyncOutlined spin />, text: "Đang chờ duyệt", color: "#faad14", bg: "#fffbe6" },
            'waiting_return': { icon: <SyncOutlined />, text: "Chờ gửi hàng", color: "#1890ff", bg: "#e6f7ff" },
            'returning': { icon: <CarOutlined />, text: "Đang trả hàng", color: "#722ed1", bg: "#f9f0ff" },
            'negotiating': { icon: <WarningOutlined />, text: "Shop từ chối - Đang thương lượng", color: "#ff4d4f", bg: "#fff1f0" },
            'admin_review': { icon: <WarningOutlined />, text: "Sàn đang xử lý", color: "#f5222d", bg: "#fff1f0" },
            'resolved_refund': { icon: <CheckCircleOutlined />, text: "Đã hoàn tiền thành công", color: "#52c41a", bg: "#f6ffed" },
            'resolved_reject': { icon: <CloseCircleOutlined />, text: "Từ chối hoàn tiền", color: "#8c8c8c", bg: "#f5f5f5" },
            'cancelled': { icon: <CloseCircleOutlined />, text: "Đã hủy yêu cầu", color: "#8c8c8c", bg: "#f5f5f5" },
        };
        config = complaintStatusMap[complaintData.status];
    }

    // 2. Nếu không có complaintData hoặc không map được, fallback về status của Item
    if (!config) {
        const itemStatusConfig = {
            'REFUND_REQUESTED': { icon: <SyncOutlined spin />, text: "Đang yêu cầu hoàn tiền", color: "#1890ff", bg: "#e6f7ff" },
            'WAITING_RETURN': { icon: <SyncOutlined />, text: "Chờ gửi hàng", color: "#1890ff", bg: "#e6f7ff" },
            'SELLER_REJECTED': { icon: <CloseCircleOutlined />, text: "Shop từ chối", color: "#ff4d4f", bg: "#fff1f0" },
            'DISPUTE_TO_ADMIN': { icon: <WarningOutlined />, text: "Đang khiếu nại lên Sàn", color: "#faad14", bg: "#fffbe6" },
            'REFUND_APPROVED': { icon: <CheckCircleOutlined />, text: "Đã hoàn tiền thành công", color: "#52c41a", bg: "#f6ffed" },
            'REFUND_REJECTED': { icon: <CloseCircleOutlined />, text: "Từ chối hoàn tiền", color: "#8c8c8c", bg: "#f5f5f5" },
        };
        config = itemStatusConfig[item.status];
    }

    // Nếu vẫn không có config (tức là NORMAL), trả về null
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
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
        <Space align="center">
          <div style={{ width: 4, height: 24, background: "linear-gradient(180deg, #52c41a 0%, #95de64 100%)", borderRadius: 2 }} />
          <Title level={5} style={{ margin: 0 }}>Sản phẩm ({order.items?.length || 0})</Title>
        </Space>
      </div>

      <List
        dataSource={order.items || []}
        rowKey={(item) => item.id}
        split={false} 
        renderItem={(item, index) => {
          const productTotal = Number(item.price || 0) * Number(item.quantity || 0);
          const imageSrc = resolveProductImage(item.product_image || "");
          
          const complaintData = getComplaint(item);

          // Hiển thị nút ở "Đã giao" và "Hoàn thành" nhưng khóa khi đã hoàn thành
          const showComplaintButton = (status === "delivered" || status === "completed")
                                      && item.status === "NORMAL";
          const canComplaint = (status === "delivered")
                               && item.status === "NORMAL"
                               && !complaintData;

          // [MỚI] Kiểm tra nếu Shop đã từ chối (Trạng thái đang thương lượng)
          const isSellerRejected = complaintData?.status === 'negotiating';

          return (
            <div key={item.id} style={{ borderBottom: index < order.items.length - 1 ? "1px solid #f0f0f0" : "none" }}>
              <div style={{ padding: isMobile ? "16px" : "20px 24px" }}>
                
                {/* Truyền thêm complaintData vào hàm renderItemStatus */}
                <div style={{ marginBottom: 8 }}>
                  {renderItemStatus(item, complaintData)}
                </div>

                <div 
                  style={{ display: "flex", gap: 16, alignItems: "flex-start", cursor: "pointer" }}
                  onClick={() => onProductClick && onProductClick(item.product)}
                >
                  <div style={{ flexShrink: 0, border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
                    {imageSrc ? (
                      <Image src={imageSrc} alt={item.product_name} width={80} height={80} style={{ objectFit: "cover", display: "block" }} />
                    ) : (
                      <NoImage width={80} height={80} text="No Img" />
                    )}
                  </div>

                  <div style={{ flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between" }}>
                    <div style={{ paddingRight: isMobile ? 0 : 16, marginBottom: isMobile ? 8 : 0 }}>
                      <Text strong style={{ fontSize: 16, lineHeight: 1.4, display: "block", color: "#262626", cursor: "pointer" }}>
                        {item.product_name}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 13 }}>x{item.quantity}</Text>
                    </div>

                    <div style={{ textAlign: isMobile ? "left" : "right" }}>
                      <div style={{ color: "#8c8c8c", fontSize: 13 }}>{intcomma(item.price)}đ</div>
                      <div style={{ color: "#52c41a", fontWeight: 600, fontSize: 16 }}>
                        {intcomma(productTotal)}đ
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- KHU VỰC NÚT BẤM HÀNH ĐỘNG --- */}
                <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: "wrap", alignItems: 'center' }}>
                  
                  {/* [MỚI] Nút Gửi lên Sàn (Chỉ hiện khi Shop đã từ chối) */}
                  {isSellerRejected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#ff4d4f', display: isMobile ? 'none' : 'block' }}>
                            <ExclamationCircleOutlined /> Bạn không đồng ý với Shop?
                        </span>
                        <Button 
                            type="primary" 
                            danger 
                            icon={<WarningOutlined />}
                            onClick={() => onEscalate && onEscalate(complaintData.id)}
                            style={{ borderRadius: 4, background: '#ff4d4f', borderColor: '#ff4d4f' }}
                        >
                            Gửi khiếu nại lên Sàn
                        </Button>
                    </div>
                  )}

                  {showComplaintButton && (
                    <Tooltip title={status === "completed" ? "Đơn đã hoàn thành – không thể yêu cầu hoàn tiền" : undefined}>
                      <Button
                        size={isMobile ? "small" : "middle"}
                        danger
                        disabled={!canComplaint}
                        onClick={() => canComplaint && toggleComplaint(item.id)} 
                        style={{ borderRadius: 4 }}
                      >
                        Yêu cầu hoàn tiền
                      </Button>
                    </Tooltip>
                  )}
                  
                  {(status === "completed") && !ratedProducts.has(item.product) && !complaintData && (
                    <Tooltip title="Đánh giá để nhận xu">
                        <Button type="primary" ghost size={isMobile ? "small" : "middle"} icon={<StarOutlined />} onClick={() => onRate(item)} style={{ borderRadius: 4 }}>
                         Đánh giá
                      </Button>
                    </Tooltip>
                  )}
                </div>

                {complaintData && (
                    <div style={{ marginTop: 24 }}>
                        <DisputeActionZone complaint={complaintData} isMobile={isMobile} />
                    </div>
                )}
              </div>
            </div>
          );
        }}
      />

      <div style={{ background: "#fafafa", padding: "16px 24px", borderTop: "1px solid #f0f0f0" }}>
        <Space direction="vertical" style={{ width: "100%" }} size={8}>
          
          {/* 1. Tổng tiền hàng */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <Text type="secondary">Tổng tiền hàng</Text>
            <Text>
              {intcomma(
                Number(order.total_price) + Number(order.discount_amount || 0) - Number(order.shipping_fee || 0)
              )}đ
            </Text>
          </div>

          {/* 2. Phí vận chuyển */}
          {order.shipping_fee > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <Text type="secondary">Phí vận chuyển</Text>
              <Text>{intcomma(order.shipping_fee)}đ</Text>
            </div>
          )}

          {/* 3. Voucher giảm giá */}
          {Number(order.discount_amount) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <Text type="secondary"><TagOutlined /> Voucher giảm giá</Text>
              <Text type="danger">- {intcomma(order.discount_amount)}đ</Text>
            </div>
          )}

          <Divider style={{ margin: "8px 0" }} />
          
          {/* 4. Thành tiền */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: 500 }}>Thành tiền</Text>
            <Text style={{ fontSize: 20, fontWeight: 700, color: "#52c41a" }}>
              {intcomma(order.total_price)}đ
            </Text>
          </div>
        </Space>
      </div>

      <ComplaintForm
        visible={!!selectedItemForForm}
        onClose={() => toggleComplaint(null)}
        orderItemId={selectedItemForForm?.id}
        productName={selectedItemForForm?.product_name}
        productPrice={selectedItemForForm?.price}
        productQuantity={selectedItemForForm?.quantity}
        text={complaintText}
        files={complaintFiles}
        isLoading={isSendingComplaint}
        isMobile={isMobile}
        onChangeText={onChangeText}
        onChangeFiles={onChangeFiles}
        onSubmit={sendComplaint}
      />

    </Card>
  );
};

export default ProductList;