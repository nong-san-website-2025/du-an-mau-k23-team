// Tab 4: Lịch sử mua hàng
import React, { useEffect } from "react";
import { Table, Tag, Empty, Skeleton, Card, Statistic, Row, Col } from "antd";
import { ShoppingCart } from "lucide-react";
import { intcomma } from "../../../../../../../utils/format";

export default function OrdersTab({ userId, onLoad, loading, data }) {
  useEffect(() => {
    if (onLoad && userId) {
      onLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!data && loading) return <Skeleton active />;

  if (loading) return <Skeleton active />;

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "order_id",
      key: "order_id",
      render: (text) => <strong>#{text}</strong>,
    },
    {
      title: "Ngày đặt",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount) => <span>{intcomma(amount)} ₫</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusMap = {
          pending: { color: "orange", label: "Chờ xác nhận" },
          confirmed: { color: "blue", label: "Đã xác nhận" },
          shipped: { color: "cyan", label: "Đang giao" },
          delivered: { color: "green", label: "Đã giao" },
          cancelled: { color: "red", label: "Huỷ" },
        };
        const s = statusMap[status] || { color: "default", label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
  ];

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ padding: "20px" }}>
        <Card>
          <Empty
            description="Không có đơn hàng"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: "40px" }}
          />
        </Card>
      </div>
    );
  }

  const totalSpent = data.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const avgOrder = totalSpent / data.length;

  return (
    <div style={{ padding: "20px" }}>
      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Tổng đơn hàng" value={data.length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng chi tiêu"
              value={totalSpent}
              suffix="₫"
              formatter={(value) => intcomma(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Trung bình/đơn"
              value={avgOrder}
              suffix="₫"
              formatter={(value) => intcomma(Number(value))}
              precision={0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Hoàn thành"
              value={data.filter((o) => o.status === "delivered").length}
              suffix={`/${data.length}`}
            />
          </Card>
        </Col>
      </Row>

      {/* Orders Table */}
      <Card title={<><ShoppingCart size={16} style={{ marginRight: "8px" }} /> Danh sách đơn hàng</>}>
        <Table
          columns={columns}
          dataSource={data.map((item, idx) => ({ ...item, key: idx }))}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
}
