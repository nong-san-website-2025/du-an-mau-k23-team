import React from "react";
import { Card, Typography, Space, Tag, Divider } from "antd";
import { EnvironmentOutlined, PhoneOutlined, UserOutlined, CreditCardOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

const OrderInfo = ({ order, cardStyle, isMobile }) => {
  // Style constants
  const styles = {
    card: {
      ...cardStyle,
      borderRadius: 8,
      border: "none",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      overflow: "hidden",
    },
    headerBar: {
      background: "linear-gradient(90deg, #52c41a 0%, #95de64 100%)", // Gradient xanh GreenFarm
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
      {/* Decorative Top Bar - Tạo điểm nhấn thương hiệu */}
      <div style={styles.headerBar} />
      
      <div style={styles.content}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <EnvironmentOutlined style={{ color: "#52c41a", fontSize: 18 }} />
          <Title level={5} style={{ margin: 0 }}>Địa chỉ nhận hàng</Title>
        </Space>

        <div style={styles.row}>
          <UserOutlined style={styles.labelIcon} />
          <div>
            <Text strong style={{ fontSize: 16, display: 'block' }}>
              {order.customer_name || "—"}
            </Text>
            {order.customer_phone && (
              <Text type="secondary" style={{ fontSize: 14 }}>
                 {order.customer_phone}
              </Text>
            )}
          </div>
        </div>

        <div style={styles.row}>
          <EnvironmentOutlined style={styles.labelIcon} />
          <Text style={{ color: "#595959", lineHeight: 1.5, flex: 1 }}>
            {order.address || "—"}
          </Text>
        </div>

        {order.note && (
          <div style={{...styles.row, background: "#f9f9f9", padding: 8, borderRadius: 4}}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>Ghi chú:</span> {order.note}
            </Text>
          </div>
        )}

        <Divider style={{ margin: "12px 0" }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <CreditCardOutlined style={styles.labelIcon} />
            <Text type="secondary">Thanh toán</Text>
          </Space>
          <Tag color="blue" style={{ margin: 0, padding: "0 10px", borderRadius: 12 }}>
            {order.payment_method || "—"}
          </Tag>
        </div>
      </div>
    </Card>
  );
};

export default OrderInfo;