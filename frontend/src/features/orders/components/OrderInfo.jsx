// components/OrderInfo.jsx
import React from "react";
import { Descriptions, Tag, Typography } from "antd";
import { MessageOutlined } from "@ant-design/icons";

const { Text } = Typography;

const OrderInfo = ({ order, cardStyle, sectionTitleStyle, isMobile }) => {
  return (
    <div style={cardStyle}>
      <h3 style={sectionTitleStyle}>
        <MessageOutlined style={{ color: "#1890ff" }} />
        Thông tin người nhận
      </h3>
      <Descriptions
        column={1}
        size="small"
        colon={false}
        labelStyle={{
          width: isMobile ? 100 : 120,
          fontWeight: 600,
          color: "#595959",
          marginBottom: 8,
          fontSize: 14,
        }}
        contentStyle={{
          color: "#262626",
          fontSize: 14,
        }}
      >
        <Descriptions.Item label="Người nhận">
          {order.customer_name || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">
          {order.customer_phone || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Địa chỉ">
          {order.address || "—"}
        </Descriptions.Item>
        {order.note && (
          <Descriptions.Item label="Ghi chú">
            <Text italic style={{ color: "#8c8c8c" }}>
              {order.note}
            </Text>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Thanh toán">
          <Tag color="blue">{order.payment_method || "—"}</Tag>
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
};

export default OrderInfo;