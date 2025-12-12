// components/ProductList.jsx
import React from "react";
import { List, Space, Image, Typography, Tag, Button, Tooltip, Divider } from "antd";
import { WarningOutlined, StarOutlined, ShoppingOutlined } from "@ant-design/icons";
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
  status,
  ratedProducts,
  onRate,
  // Props for Complaint Logic
  openComplaint,
  toggleComplaint,
  complaintTexts,
  onChangeText,
  complaintFiles,
  onChangeFiles,
  sendingByProduct,
  sendComplaint,
}) => {
  return (
    <div style={cardStyle}>
      <h3 style={sectionTitleStyle}>
        <ShoppingOutlined style={{ color: "#52c41a" }} />
        Sản phẩm ({order.items?.length || 0})
      </h3>
      <List
        dataSource={order.items || []}
        rowKey={(item) => `${order.id}-${item.product}-${item.price}`}
        split
        locale={{ emptyText: "Không có sản phẩm" }}
        renderItem={(item) => {
          const productTotal = Number(item.price || 0) * Number(item.quantity || 0);
          const imageSrc = resolveProductImage(item.product_image || "");
          const isComplaintOpen = openComplaint[item.product];

          return (
            <List.Item
              key={`${order.id}-${item.product}`}
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
                    {item.category_name && <Tag color="blue">{item.category_name}</Tag>}
                    <Text strong style={{ fontSize: isMobile ? 15 : 16, display: "block", marginTop: 4 }}>
                      Thành tiền: {intcomma(productTotal)}đ
                    </Text>
                  </Space>

                  {status === "completed" && (
                    <Space size="small" style={{ marginTop: 12 }}>
                      <Button
                        size="small"
                        type="primary"
                        ghost
                        icon={<WarningOutlined />}
                        onClick={() => toggleComplaint(item.product)}
                      >
                        Khiếu nại
                      </Button>
                      {!ratedProducts.has(item.product) && (
                        <Tooltip title="Đánh giá sản phẩm">
                          <Button size="small" icon={<StarOutlined />} onClick={() => onRate(item)}>
                            Đánh giá
                          </Button>
                        </Tooltip>
                      )}
                    </Space>
                  )}
                </div>
              </div>

              {/* Render Complaint Form Overlay */}
              <ComplaintForm
                visible={isComplaintOpen}
                onClose={() => toggleComplaint(item.product)}
                productId={item.product}
                productPrice={item.price}
                productQuantity={item.quantity}
                text={complaintTexts[item.product] || ""}
                files={complaintFiles[item.product] || []}
                isLoading={!!sendingByProduct[item.product]}
                isMobile={isMobile}
                onChangeText={onChangeText}
                onChangeFiles={onChangeFiles}
                onSubmit={sendComplaint}
              />
            </List.Item>
          );
        }}
      />
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