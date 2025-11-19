// src/features/admin/components/OrderAdmin/OrderDetailDrawer.jsx
import React from "react";
import {
  Drawer,
  Descriptions,
  Tag,
  Table,
  Divider,
  Row,
  Col,
  Card,
  Typography,
  Space,
} from "antd";

import {
  User,
  MapPin,
  Phone,
  FileText,
  CreditCard,
  CalendarClock,
  Store,
  PackageSearch,
} from "lucide-react";

const { Title, Text } = Typography;

export default function OrderDetailDrawer({
  visible,
  onClose,
  order,
  getStatusLabel,
  formatCurrency,
  formatDate,
}) {
  if (!order) return null;

  const statusColors = {
    pending: "orange",
    shipping: "blue",
    shipped: "geekblue",
    delivered: "green",
    success: "green",
    cancelled: "red",
    refunded: "default",
  };

  const orderColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      render: (name) => <Text strong>{name || "N/A"}</Text>,
    },
    {
      title: "Danh mục",
      dataIndex: "category_name",
      key: "category_name",
      render: (name) => <Tag color="blue">{name || "N/A"}</Tag>,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      width: 100,
      render: (q) => <Text>{q}</Text>,
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      key: "price",
      align: "right",
      width: 140,
      render: (price) => <Text>{formatCurrency(price)}</Text>,
    },
    {
      title: "Thành tiền",
      key: "total",
      align: "right",
      width: 140,
      render: (_, item) => (
        <Text strong>{formatCurrency(item.price * item.quantity)}</Text>
      ),
    },
    {
      title: "Phí sàn",
      key: "platform_commission",
      align: "right",
      width: 140,
      render: (_, item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        const commission = itemTotal * (item.commission_rate || 0);
        return (
          <div>
            <Text style={{ color: "#f97316", fontWeight: 500, fontSize: "14px" }}>
              {formatCurrency(commission)}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              ({((item.commission_rate || 0) * 100).toFixed(1)}%)
            </Text>
          </div>
        );
      },
    },
    {
      title: "Doanh thu",
      key: "seller_amount",
      align: "right",
      width: 140,
      render: (_, item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        const commission = itemTotal * (item.commission_rate || 0);
        const sellerAmount = itemTotal - commission;
        return (
          <Text style={{ color: "#059669", fontWeight: 500, fontSize: "14px" }}>
            {formatCurrency(sellerAmount)}
          </Text>
        );
      },
    },
  ];

  return (
    <Drawer
      title={
        <Title level={4} style={{ margin: 0 }}>
          Chi tiết đơn hàng #{order.id}
        </Title>
      }
      placement="right"
      open={visible}
      onClose={onClose}
      width={1100}
      bodyStyle={{ padding: 24 }}
    >
      {/* ----------- CUSTOMER INFORMATION ----------- */}
      <Card
        title={
          <Space>
            <User size={18} /> Thông tin khách hàng
          </Space>
        }
        bordered={false}
        style={{ borderRadius: 12, marginBottom: 24 }}
      >
        <Descriptions column={2}>
          <Descriptions.Item label="Tên khách hàng">
            {order.customer_name || "N/A"}
          </Descriptions.Item>

          <Descriptions.Item label="Số điện thoại">
            <Space>
              <Phone size={16} />
              {order.customer_phone || "N/A"}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Địa chỉ" span={2}>
            <Space>
              <MapPin size={16} />
              {order.address || "N/A"}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Ghi chú" span={2}>
            {order.note || "Không có"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* ----------- ORDER INFORMATION ----------- */}
      <Card
        title={
          <Space>
            <FileText size={18} /> Thông tin đơn hàng
          </Space>
        }
        bordered={false}
        style={{ borderRadius: 12, marginBottom: 24 }}
      >
        <Descriptions column={2}>
          <Descriptions.Item label="Trạng thái">
            <Tag
              color={statusColors[order.status] || "default"}
              style={{ fontSize: 14 }}
            >
              {getStatusLabel(order.status)}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Phương thức thanh toán">
            <Space>
              <CreditCard size={16} />
              {order.payment_method || "N/A"}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Tổng tiền">
            <Text strong>{formatCurrency(order.total_price)}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Phí vận chuyển">
            <Text strong style={{ color: "#faad14" }}>
              {formatCurrency(order.shipping_fee || 0)}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="Ngày tạo">
            <Space>
              <CalendarClock size={16} />
              {formatDate(order.created_at)}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Shop" span={2}>
            <Space>
              <Store size={16} />
              {order.shop_name || "N/A"}{" "}
              {order.shop_phone ? `- ${order.shop_phone}` : ""}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Divider />

      {/* ----------- ORDER ITEMS LIST ----------- */}
      <Card
        title={
          <Space>
            <PackageSearch size={18} /> Sản phẩm trong đơn hàng
          </Space>
        }
        bordered={false}
        style={{ borderRadius: 12 }}
      >
        {order.items?.length > 0 ? (
          <>
            <Table
              columns={orderColumns}
              dataSource={order.items}
              pagination={false}
              rowKey={(record, index) => index}
              size="middle"
              style={{ marginTop: 12 }}
              scroll={{ x: 1000 }}
              footer={() => {
                const productTotal = (order.items || []).reduce(
                  (sum, item) => sum + ((item.price || 0) * (item.quantity || 0)),
                  0
                );
                const shippingFee = order.shipping_fee || 0;
                const totalPlatformCommission = (order.items || []).reduce(
                  (sum, item) => {
                    const itemTotal = (item.price || 0) * (item.quantity || 0);
                    const commission = itemTotal * (item.commission_rate || 0);
                    return sum + commission;
                  },
                  0
                );
                const sellerRevenue = productTotal - totalPlatformCommission;

                return (
                  <div
                    style={{
                      padding: "20px 16px",
                      borderTop: "2px solid #e5e7eb",
                      background: "#fafafa",
                    }}
                  >
                    <Row style={{ marginBottom: "12px" }}>
                      <Col span={12}>
                        <Text style={{ fontSize: "14px", color: "#6b7280" }}>
                          Tổng giá trị sản phẩm:
                        </Text>
                      </Col>
                      <Col span={12} style={{ textAlign: "right" }}>
                        <Text strong style={{ fontSize: "15px", color: "#1f2937" }}>
                          {formatCurrency(productTotal)}
                        </Text>
                      </Col>
                    </Row>
                    <Row style={{ marginBottom: "12px" }}>
                      <Col span={12}>
                        <Text style={{ fontSize: "14px", color: "#6b7280" }}>
                          Phí vận chuyển:
                        </Text>
                      </Col>
                      <Col span={12} style={{ textAlign: "right" }}>
                        <Text strong style={{ fontSize: "15px", color: "#faad14" }}>
                          {formatCurrency(shippingFee)}
                        </Text>
                      </Col>
                    </Row>
                    <Row style={{ marginBottom: "12px" }}>
                      <Col span={12}>
                        <Text style={{ fontSize: "14px", color: "#6b7280" }}>
                          Tổng phí sàn đã khấu trừ:
                        </Text>
                      </Col>
                      <Col span={12} style={{ textAlign: "right" }}>
                        <Text strong style={{ fontSize: "15px", color: "#f97316" }}>
                          -{formatCurrency(totalPlatformCommission)}
                        </Text>
                      </Col>
                    </Row>
                    <Row
                      style={{
                        borderTop: "2px solid #d1d5db",
                        paddingTop: "12px",
                        marginTop: "8px",
                      }}
                    >
                      <Col span={12}>
                        <Text strong style={{ fontSize: "15px", color: "#1f2937" }}>
                          Doanh thu cửa hàng:
                        </Text>
                      </Col>
                      <Col span={12} style={{ textAlign: "right" }}>
                        <Text strong style={{ fontSize: "17px", color: "#059669" }}>
                          {formatCurrency(sellerRevenue)}
                        </Text>
                      </Col>
                    </Row>
                  </div>
                );
              }}
            />
          </>
        ) : (
          <div style={{ textAlign: "center", padding: 20, opacity: 0.6 }}>
            Chưa có thông tin chi tiết sản phẩm
          </div>
        )}
      </Card>
    </Drawer>
  );
}