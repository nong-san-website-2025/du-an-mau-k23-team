import React from "react";
import { Card, Typography, Space, Tag, Divider } from "antd";
import { EnvironmentOutlined, PhoneOutlined, UserOutlined, CreditCardOutlined, ShopOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

const OrderInfo = ({ order, cardStyle, isMobile }) => {
  const styles = {
    card: {
      ...cardStyle,
      borderRadius: 8,
      border: "none",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      overflow: "hidden",
    },
    headerBar: {
      background: "linear-gradient(90deg, #52c41a 0%, #95de64 100%)",
      height: 4,
      width: "100%",
    },
    content: {
      padding: isMobile ? "12px 16px" : "16px 24px",
    },
    labelIcon: {
      color: "#8c8c8c",
      marginRight: 8,
      fontSize: 16,
    },
    row: {
      marginBottom: 12,
      display: "flex",
      alignItems: "flex-start",
    }
  };

  return (
    <Card bodyStyle={{ padding: 0 }} style={styles.card}>
      <div style={styles.headerBar} />
      
      <div style={styles.content}>
        {/* Shop Info Section */}
        <div style={{ marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>
          <Space align="center" style={{ marginBottom: 12 }}>
            <ShopOutlined style={{ color: "#52c41a", fontSize: 18 }} />
            <Title level={5} style={{ margin: 0 }}>Thông tin cửa hàng</Title>
          </Space>
          
          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>
                {order.shop_name || "—"}
              </Text>
              {order.shop_phone && (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {order.shop_phone}
                </Text>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Address Section */}
        <div style={{ marginBottom: 16 }}>
          <Space align="center" style={{ marginBottom: 12 }}>
            <EnvironmentOutlined style={{ color: "#52c41a", fontSize: 18 }} />
            <Title level={5} style={{ margin: 0 }}>Địa chỉ nhận hàng</Title>
          </Space>

          <div style={styles.row}>
            <UserOutlined style={styles.labelIcon} />
            <div>
              <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 2 }}>
                {order.customer_name || "—"}
              </Text>
              {order.customer_phone && (
                <Text type="secondary" style={{ fontSize: 13 }}>
                   {order.customer_phone}
                </Text>
              )}
            </div>
          </div>

          <div style={styles.row}>
            <EnvironmentOutlined style={styles.labelIcon} />
            <Text style={{ color: "#595959", lineHeight: 1.6, flex: 1 }}>
              {order.address || "—"}
            </Text>
          </div>

          {order.note && (
            <div style={{ marginTop: 12, background: "#fafafa", padding: 10, borderRadius: 6, border: "1px solid #f0f0f0" }}>
              <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, color: "#333" }}>📝 Ghi chú:</span> {order.note}
              </Text>
            </div>
          )}
        </div>

        <Divider style={{ margin: "16px 0" }} />

        {/* Payment Info Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <Space>
            <CreditCardOutlined style={styles.labelIcon} />
            <Text type="secondary" style={{ fontWeight: 500 }}>Phương thức thanh toán</Text>
          </Space>
          <Tag color="blue" style={{ margin: 0, padding: "4px 12px", borderRadius: 12, fontSize: 12 }}>
            {order.payment_method || "—"}
          </Tag>
        </div>
      </div>
    </Card>
  );
};

export default OrderInfo;