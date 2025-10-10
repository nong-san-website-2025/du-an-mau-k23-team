import React, { useEffect, useState } from "react";
import { Table, Tag, message, Typography, Button } from "antd";
import { useNavigate } from "react-router-dom";
import API from "../../login_register/services/api";

const { Text } = Typography;

export default function OrdersCancelled() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  const fetchCancelledOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get("orders/seller/cancelled/");
      setOrders(res.data || []);
    } catch (error) {
      console.error(error);
      message.error("Không thể tải danh sách đơn đã hủy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancelledOrders();
  }, []);

  const columns = [
    { title: "Mã đơn", dataIndex: "id", key: "id" },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_, order) => (
        <div>
          <div><strong>{order.customer_name}</strong></div>
          <div style={{ fontSize: 12, color: "#666" }}>{order.customer_phone}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{order.address}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color="red">{status}</Tag>,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      render: (value) => <strong>{Number(value || 0).toLocaleString()}đ</strong>,
    },
    {
      title: "Số lượng sản phẩm",
      key: "items_count",
      render: (_, order) => order.items?.length || 0,
    },
    {
      title: "Cập nhật lần cuối",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (value, order) => {
        const time = value || order.cancelled_at || order.created_at;
        if (!time) return "-";
        return new Date(time).toLocaleString("vi-VN");
      },
    },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold">Đơn đã hủy</h2>
          <Text type="secondary">Danh sách các đơn bị hủy sẽ hiển thị tại đây để bạn dễ dàng theo dõi.</Text>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/seller-center/orders/new")}>Xem đơn mới</Button>
          <Button type="primary" onClick={fetchCancelledOrders} loading={loading}>
            Tải lại
          </Button>
        </div>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={orders}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}