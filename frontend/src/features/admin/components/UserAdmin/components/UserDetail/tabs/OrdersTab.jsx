// Tab 2: Lịch sử mua hàng
import React, { useEffect } from "react";
import { Table, Tag, Empty, Skeleton, Card, Statistic, Row, Col, Space } from "antd";
import { ShoppingCart, TrendingUp, DollarSign } from "lucide-react";
import { intcomma } from "../../../../../../../utils/format";

export default function OrdersTab({ userId, onLoad, loading, data }) {
  useEffect(() => {
    if (onLoad && userId) {
      onLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!data && loading) return <Skeleton active style={{ padding: "20px" }} />;

  if (loading) return <Skeleton active style={{ padding: "20px" }} />;

  const getOrderTotal = (order) => {
    const amount = order.total_amount || order.totalAmount || order.total || 0;
    return parseFloat(amount) || 0;
  };

  const getOrderStatus = (order) => {
    return (order.status || order.order_status || "pending").toLowerCase();
  };

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (text) => <strong style={{ color: "#1890ff" }}>#{text}</strong>,
    },
    {
      title: "Ngày đặt",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 130,
      render: (amount, record) => (
        <span style={{ color: "#52c41a", fontWeight: 600 }}>
          {intcomma(getOrderTotal(record) || 0)} đ
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status, record) => {
        const statusMap = {
          success: { color: "green", label: "Thành công" },
          pending: { color: "orange", label: "Chờ xác nhận" },
          confirmed: { color: "blue", label: "Đã xác nhận" },
          shipping: { color: "cyan", label: "Đang giao" },
          delivered: { color: "green", label: "Đã giao" },
          cancelled: { color: "red", label: "Huỷ" },
          preparing: { color: "blue", label: "Đang chuẩn bị" },
          ready_for_pickup: { color: "cyan", label: "Sẵn sàng lấy" },
          failed: { color: "red", label: "Thất bại" },
        };
        const orderStatus = getOrderStatus(record);
        const s = statusMap[orderStatus] || { color: "default", label: orderStatus || "N/A" };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
  ];

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ padding: "12px", background: "#f5f5f5" }}>
        <Card>
          <Empty
            description="Người dùng này chưa có đơn hàng"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: "40px", marginBottom: "40px" }}
          />
        </Card>
      </div>
    );
  }

  const totalSpent = data.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const avgOrder = data.length > 0 ? totalSpent / data.length : 0;
  const completedOrders = data.filter((o) => getOrderStatus(o) === "success").length;

  return (
    <div style={{ padding: "12px", background: "#f5f5f5", minHeight: "100vh" }}>
      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card bodyStyle={{ padding: "16px" }}>
            <Statistic
              title="Tổng đơn hàng"
              value={data.length}
              prefix={<ShoppingCart size={16} style={{ marginRight: "8px" }} />}
              valueStyle={{ color: "#1890ff", fontSize: "18px", fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bodyStyle={{ padding: "16px" }}>
            <Statistic
              title="Tổng chi tiêu"
              value={totalSpent}
              formatter={(value) => `${intcomma(value)} đ`}
              valueStyle={{ color: "#52c41a", fontSize: "18px", fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bodyStyle={{ padding: "16px" }}>
            <Statistic
              title="TB/đơn"
              value={avgOrder}
              formatter={(value) =>
                `${intcomma(value)} đ`
              }
              valueStyle={{ color: "#722ed1", fontSize: "18px", fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bodyStyle={{ padding: "16px" }}>
            <Statistic
              title="Đã giao"
              value={`${completedOrders}/${data.length}`}
              prefix={<TrendingUp size={16} style={{ marginRight: "8px" }} />}
              valueStyle={{ color: "#52c41a", fontSize: "18px", fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Orders Table */}
      <Card
        title={
          <Space>
            <ShoppingCart size={18} style={{ color: "#1890ff" }} />
            <span style={{ fontSize: "16px", fontWeight: 600 }}>Danh sách đơn hàng</span>
          </Space>
        }
        bodyStyle={{ padding: "16px" }}
      >
        <Table
          columns={columns}
          dataSource={data.map((item, idx) => ({ ...item, key: idx }))}
          pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }}
          scroll={{ x: 600 }}
          size="middle"
          bordered
        />
      </Card>
    </div>
  );
}
