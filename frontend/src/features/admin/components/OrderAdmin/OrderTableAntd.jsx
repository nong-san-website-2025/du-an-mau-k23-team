import React from "react";
import { Table, Tag, Space, Button, Popconfirm } from "antd";
import dayjs from "dayjs";

// Ant Design table for Orders, similar style to ProductTable in approval page
export default function OrderTableAntd({
  orders,
  loading,
  getStatusLabel,
  formatCurrency,
  formatDate,
  onViewDetail,
  onCancel,
}) {
  const statusColors = {
    pending: "warning",
    processing: "blue",
    shipped: "geekblue",
    delivered: "green",
    completed: "green",
    cancelled: "red",
    refunded: "default",
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
      align: "center",
      render: (id) => `#${id}`,
    },
    {
      title: "Khách hàng",
      dataIndex: "customer_name",
      key: "customer_name",
      width: 220,
      render: (name) => name || "N/A",
    },
    {
      title: "Số điện thoại",
      dataIndex: "customer_phone",
      key: "customer_phone",
      width: 150,
      render: (phone) => phone || "N/A",
      align: "center",
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      width: 140,
      render: (v) => (v != null ? formatCurrency(v) : "—"),
      sorter: (a, b) => (a.total_price || 0) - (b.total_price || 0),
      align: "right",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => (
        <Tag color={statusColors[status] || "default"}>{getStatusLabel(status)}</Tag>
      ),
      align: "center",
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "—"),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      align: "center",
    },
    {
      title: "Shop",
      key: "shop",
      width: 220,
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{record.shop_name || "N/A"}</span>
          <span style={{ color: "#888" }}>{record.shop_phone || ""}</span>
        </div>
      ),
    },
  ];

  const expandedRowRender = (order) => {
    return (
      <div style={{ background: "#fafafa", padding: 16, border: "1px solid #f0f0f0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <h4 style={{ marginBottom: 12 }}>Thông tin khách hàng</h4>
            <div><strong>Tên:</strong> {order.customer_name || "N/A"}</div>
            <div><strong>SĐT:</strong> {order.customer_phone || "N/A"}</div>
            <div><strong>Địa chỉ:</strong> {order.address || "N/A"}</div>
            <div><strong>Ghi chú:</strong> {order.note || "Không có"}</div>
          </div>
          <div>
            <h4 style={{ marginBottom: 12 }}>Thông tin đơn hàng</h4>
            <div>
              <strong>Trạng thái:</strong>
              <Tag style={{ marginLeft: 8 }} color={statusColors[order.status] || "default"}>
                {getStatusLabel(order.status)}
              </Tag>
            </div>
            <div><strong>Phương thức thanh toán:</strong> {order.payment_method || "N/A"}</div>
            <div><strong>Tổng tiền:</strong> {formatCurrency(order.total_price)}</div>
            <div><strong>Ngày tạo:</strong> {formatDate(order.created_at)}</div>
            <div>
              <strong>Shop:</strong> {order.shop_name || "N/A"}
              {order.shop_phone ? ` - ${order.shop_phone}` : ""}
            </div>
            {(order.status !== "cancelled" && order.status !== "success") && (
              <div style={{ marginTop: 8 }}>
                <Space>
                  <Popconfirm
                    title={`Xác nhận hủy đơn #${order.id}?`}
                    okText="Hủy đơn"
                    cancelText="Không"
                    onConfirm={() => onCancel?.(order)}
                  >
                    <Button danger size="small">Hủy đơn hàng</Button>
                  </Popconfirm>
                  {!order.items && (
                    <Button size="small" onClick={() => onViewDetail?.(order.id)}>
                      Tải chi tiết
                    </Button>
                  )}
                </Space>
              </div>
            )}
          </div>
        </div>

        {order.items && order.items.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 12 }}>Sản phẩm trong đơn hàng</h4>
            <Table
              size="small"
              bordered
              pagination={false}
              rowKey={(r, idx) => idx}
              columns={[
                { title: "Sản phẩm", dataIndex: "product_name", key: "product_name" },
                { title: "Số lượng", dataIndex: "quantity", key: "quantity", width: 100, align: "center" },
                { title: "Đơn giá", dataIndex: "price", key: "price", width: 140, align: "right", render: (v) => formatCurrency(v) },
                { title: "Thành tiền", key: "total", width: 160, align: "right", render: (_, it) => formatCurrency((it.price || 0) * (it.quantity || 0)) },
              ]}
              dataSource={order.items}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Table
      columns={columns}
      dataSource={orders}
      rowKey="id"
      bordered
      loading={loading}
      pagination={{ pageSize: 10 }}
      size="small"
      expandable={{
        expandedRowRender,
        onExpand: async (expanded, record) => {
          if (expanded && !record.items) {
            await onViewDetail?.(record.id);
          }
        },
      }}
      scroll={{ x: 1100 }}
    />
  );
}