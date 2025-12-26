// src/features/admin/components/OrderAdmin/OrderDetailModal.jsx
import React from "react";
import { Drawer, Descriptions, Tag, Table, Divider, Row, Col, Card, Typography, Space, Steps, Button, Statistic, Popconfirm, Tooltip } from "antd";
import { User, MapPin, Phone, Store, Printer, XCircle, CheckCircle2, Truck, Package, Clock } from "lucide-react";
import StatusTag from "../../../../components/StatusTag"; 
import { intcomma } from "../../../../utils/format";

const { Title, Text, Paragraph } = Typography;

export default function OrderDetailDrawer({
  visible,
  onClose,
  order,
  getStatusLabel, // Nhận prop
  formatCurrency,
  formatDate,
  onCancelOrder,
}) {
  if (!order) return null;

  // Logic tính toán
  const productTotal = (order.items || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const totalPlatformCommission = (order.items || []).reduce((sum, item) => {
    const itemTotal = (item.price || 0) * (item.quantity || 0);
    return sum + itemTotal * (item.commission_rate || 0);
  }, 0);
  const shippingFee = order.shipping_fee || 0;
  const sellerRevenue = productTotal - totalPlatformCommission;

  // Logic Steps
  const getStepCurrent = (status) => {
    switch (status) {
      case "pending": return 0;
      case "processing": return 1;
      case "shipping": case "shipped": return 2;
      case "delivered": case "success": case "completed": return 3;
      default: return 0;
    }
  };

  const stepsItems = [
    { title: "Đặt hàng", icon: <Clock size={20} /> },
    { title: "Xử lý", icon: <Package size={20} /> },
    { title: "Vận chuyển", icon: <Truck size={20} /> },
    { title: "Hoàn thành", icon: <CheckCircle2 size={20} /> },
  ];

  const orderColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.category_name}</Text>
        </Space>
      ),
    },
    { title: "Đơn giá", dataIndex: "price", align: "right", render: (price) => intcomma(price) },
    { title: "SL", dataIndex: "quantity", align: "center" },
    { title: "Thành tiền", align: "right", render: (_, item) => <Text strong>{intcomma(item.price * item.quantity)}</Text> },
    {
      title: "Phí sàn",
      align: "right",
      render: (_, item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        const commission = itemTotal * (item.commission_rate || 0);
        return (
          <Tooltip title={`Tỉ lệ: ${(item.commission_rate * 100)}%`}>
            <Text style={{ fontSize: 13, color: '#08979c', fontWeight: 500 }}>-{intcomma(commission)}</Text>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Title level={4} style={{ margin: 0 }}>#{order.id}</Title>
            <StatusTag status={order.status} label={getStatusLabel(order.status)} />
          </Space>
          <Text type="secondary" style={{ fontSize: 13 }}>Ngày tạo: {formatDate(order.created_at)}</Text>
        </div>
      }
      placement="right"
      width={900}
      onClose={onClose}
      open={visible}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '10px 0' }}>
          <Button onClick={onClose}>Đóng</Button>
          <Button icon={<Printer size={16} />}>In hóa đơn</Button>
          {["pending", "processing"].includes(order.status) && (
            <Popconfirm
              title="Hủy đơn hàng này?"
              description="Hành động này không thể khôi phục."
              onConfirm={() => { onCancelOrder(order); onClose(); }}
              okText="Đồng ý hủy" cancelText="Không" okButtonProps={{ danger: true }}
            >
              <Button danger icon={<XCircle size={16} />}>Hủy đơn hàng</Button>
            </Popconfirm>
          )}
        </div>
      }
    >
      {!["cancelled", "refunded", "rejected"].includes(order.status) ? (
        <div style={{ marginBottom: 32, padding: '0 24px' }}>
          <Steps current={getStepCurrent(order.status)} items={stepsItems} size="small" />
        </div>
      ) : (
        <div style={{ marginBottom: 24, textAlign: 'center', background: '#fff1f0', padding: 16, borderRadius: 8, border: '1px solid #ffccc7' }}>
          <Text type="danger" strong><XCircle size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Đơn hàng đã bị hủy hoặc từ chối</Text>
        </div>
      )}

      <Row gutter={24}>
        <Col span={9}>
          <Card title="Thông tin khách hàng" size="small" bordered={false} className="shadow-sm mb-4" style={{ background: '#f9fafb' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <User size={18} className="text-gray-400" />
                <div>
                  <Text strong display="block">{order.customer_name}</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Phone size={14} className="text-gray-400" />
                    <Text>{order.customer_phone}</Text>
                    <Paragraph copyable={{ text: order.customer_phone }} style={{ margin: 0 }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <MapPin size={18} className="text-gray-400" style={{ flexShrink: 0 }} />
                <Text style={{ fontSize: 13 }}>{order.address}</Text>
              </div>
              {order.note && (
                <div style={{ background: '#fff7ed', padding: 8, borderRadius: 6, border: '1px dashed #fdba74' }}>
                  <Text type="warning" style={{ fontSize: 12 }}>Note: {order.note}</Text>
                </div>
              )}
            </Space>
          </Card>
          <Card title="Thông tin cửa hàng" size="small" bordered={false} className="shadow-sm" style={{ background: '#f9fafb' }}>
            <Space align="center">
              <Store size={18} className="text-gray-400" />
              <Text strong>{order.shop_name}</Text>
            </Space>
          </Card>
        </Col>

        <Col span={15}>
          <Table columns={orderColumns} dataSource={order.items} pagination={false} rowKey="id" size="small" bordered style={{ marginBottom: 24 }} />
          
          <Card size="small" title="Tổng kết tài chính" bordered={false} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <Row gutter={[16, 16]}>
              <Col span={12} style={{ borderRight: '1px dashed #d1d5db' }}>
                <Statistic title="Tổng tiền khách trả (COD)" value={order.total_price} precision={0} formatter={(val) => intcomma(val)} valueStyle={{ fontSize: 18, fontWeight: 700, color: '#111827' }} />
                <Space direction="vertical" size={0} style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}><Text type="secondary">Tiền hàng:</Text><Text>{intcomma(productTotal)}</Text></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}><Text type="secondary">Phí ship:</Text><Text>{intcomma(shippingFee)}</Text></div>
                </Space>
              </Col>
              <Col span={12} style={{ paddingLeft: 24 }}>
                <Statistic title="Doanh thu thực nhận của Shop" value={sellerRevenue} precision={0} formatter={(val) => intcomma(val)} valueStyle={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }} prefix={<span>+</span>} />
                <div style={{ marginTop: 8, padding: '4px 8px', background: 'rgba(255,255,255,0.6)', borderRadius: 4 }}>
                  <Text style={{ fontSize: 13, color: '#08979c', fontWeight: 500 }}>Đã trừ phí sàn: -{intcomma(totalPlatformCommission)}</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Drawer>
  );
}