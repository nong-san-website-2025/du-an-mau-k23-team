// components/ProductList.jsx
import React from "react";
import { List, Space, Image, Typography, Tag, Button, Tooltip, Divider, Badge } from "antd";
import { WarningOutlined, StarOutlined, ShoppingOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { intcomma } from "./../../../utils/format";
import NoImage from "../../../components/shared/NoImage";
import { resolveProductImage } from "../utils";
import ComplaintForm from "./ComplaintForm";

const { Text } = Typography;

const ProductList = ({
  order,
  cardStyle,
  sectionTitleStyle,
  isMobile,
  status, // Trạng thái đơn hàng (Order Status)
  ratedProducts,
  onRate,
  // Logic Khiếu nại
  activeComplaintItem, // ID của OrderItem đang mở form (thay vì object boolean)
  toggleComplaint,
  complaintText,
  onChangeText,
  complaintFiles,
  onChangeFiles,
  isSendingComplaint,
  sendComplaint,
}) => {
  
  // Hàm render trạng thái của từng món hàng (Item Status)
  const renderItemStatus = (item) => {
    switch (item.status) {
      case 'REFUND_REQUESTED':
        return <Tag icon={<SyncOutlined spin />} color="processing">Đang yêu cầu hoàn tiền</Tag>;
      case 'SELLER_REJECTED':
        return <Tag icon={<CloseCircleOutlined />} color="error">Shop từ chối</Tag>;
      case 'DISPUTE_TO_ADMIN':
        return <Tag icon={<WarningOutlined />} color="warning">Đang khiếu nại lên Sàn</Tag>;
      case 'REFUND_APPROVED':
        return <Tag icon={<CheckCircleOutlined />} color="success">Đã hoàn tiền</Tag>;
      case 'REFUND_REJECTED':
        return <Tag icon={<CloseCircleOutlined />} color="default">Từ chối hoàn tiền</Tag>;
      default:
        return null;
    }
  };

  return (
    <div style={cardStyle}>
      <h3 style={sectionTitleStyle}>
        <ShoppingOutlined style={{ color: "#52c41a" }} />
        Sản phẩm ({order.items?.length || 0})
      </h3>
      <List
        dataSource={order.items || []}
        rowKey={(item) => item.id} // Quan trọng: Dùng ID của OrderItem
        split
        locale={{ emptyText: "Không có sản phẩm" }}
        renderItem={(item) => {
          const productTotal = Number(item.price || 0) * Number(item.quantity || 0);
          const imageSrc = resolveProductImage(item.product_image || "");
          
          // Kiểm tra xem form của item này có đang mở không
          const isFormVisible = activeComplaintItem === item.id;

          // Logic hiển thị nút khiếu nại:
          // 1. Đơn hàng phải thành công (completed/delivered)
          // 2. Item chưa từng bị khiếu nại (NORMAL) hoặc đã bị từ chối (để kiện tiếp - logic này tùy bạn xử lý ở form escalate)
          const canComplaint = (status === "completed" || status === "delivered") && item.status === "NORMAL";

          return (
            <List.Item
              key={item.id}
              style={{
                padding: "16px 12px",
                background: "#fff",
                marginBottom: 12,
                borderRadius: 8,
                border: "1px solid #f0f0f0",
              }}
            >
              <div style={{ display: "flex", gap: 16, width: "100%", alignItems: "flex-start" }}>
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={item.product_name}
                    width={isMobile ? 70 : 80}
                    height={isMobile ? 70 : 80}
                    style={{ borderRadius: 12, objectFit: "cover", border: "1px solid #f0f0f0" }}
                  />
                ) : (
                  <NoImage width={isMobile ? 70 : 80} height={isMobile ? 70 : 80} text="Không có hình" />
                )}

                <div style={{ flex: 1 }}>
                  <Text strong style={{ display: "block", marginBottom: 6, fontSize: isMobile ? 14 : 15, lineHeight: 1.4 }}>
                    {item.product_name}
                  </Text>
                  <Space direction="vertical" size={4} style={{ width: "100%" }}>
                    <Text type="secondary" style={{ fontSize: isMobile ? 13 : 14 }}>
                      {intcomma(item.price)}đ × {item.quantity}
                    </Text>
                    {/* Hiển thị trạng thái khiếu nại nếu có */}
                    {renderItemStatus(item)}
                    
                    <Text strong style={{ fontSize: isMobile ? 15 : 16, display: "block", marginTop: 4 }}>
                      Thành tiền: {intcomma(productTotal)}đ
                    </Text>
                  </Space>

                  <Space size="small" style={{ marginTop: 12, flexWrap: "wrap" }}>
                    {canComplaint && (
                      <Button
                        size="small"
                        type="primary"
                        ghost // Nút viền, nền trắng cho đỡ gắt
                        danger // Màu đỏ để thể hiện tính chất khiếu nại
                        icon={<WarningOutlined />}
                        onClick={() => toggleComplaint(item.id)} // Truyền ID OrderItem
                      >
                        Yêu cầu hoàn tiền
                      </Button>
                    )}
                    
                    {/* Nút đánh giá (Giữ nguyên logic cũ) */}
                    {(status === "completed" || status === "delivered") && !ratedProducts.has(item.product) && (
                      <Tooltip title="Đánh giá sản phẩm">
                        <Button size="small" icon={<StarOutlined />} onClick={() => onRate(item)}>
                          Đánh giá
                        </Button>
                      </Tooltip>
                    )}
                  </Space>
                </div>
              </div>

              {/* Form Khiếu nại */}
              <ComplaintForm
                visible={isFormVisible}
                onClose={() => toggleComplaint(null)} // Đóng form
                orderItemId={item.id} // ID quan trọng nhất
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
            </List.Item>
          );
        }}
      />
      
      {/* Phần tổng tiền giữ nguyên */}
      <Divider style={{ margin: "16px 0" }} />
      <div style={{ textAlign: "right", padding: "12px 16px", background: "#f0f9ff", borderRadius: 8 }}>
        <Space direction="vertical" size={4} align="end">
          {order.shipping_fee > 0 && (
            <Text style={{ fontSize: 14, color: "#595959" }}>
              Phí vận chuyển: <Text style={{ color: "#262626", fontWeight: 500 }}>{intcomma(order.shipping_fee)}đ</Text>
            </Text>
          )}
          <Text style={{ fontSize: 14, color: "#595959" }}>Tổng số tiền:</Text>
          <Text strong style={{ fontSize: isMobile ? 18 : 20, color: "#52c41a" }}>{intcomma(order.total_price)}đ</Text>
        </Space>
      </div>
    </div>
  );
};

export default ProductList;