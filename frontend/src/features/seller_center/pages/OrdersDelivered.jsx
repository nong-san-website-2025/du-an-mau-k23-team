import React, { useEffect, useState } from "react";
import { Table, Tag, message, Typography } from "antd";
import API from "../../login_register/services/api";

const { Text } = Typography;

export default function OrdersDelivered() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);

  const fetchDelivered = async () => {
    setLoading(true);
    try {
      const res = await API.get("orders/seller/delivered/");
      setOrders(res.data || []);
    } catch (error) {
      console.error(error);
      message.error("Không thể tải danh sách đơn đã giao");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelivered();
  }, []);

  const columns = [
    { title: "Mã đơn", dataIndex: "id", key: "id" },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_, order) => (
        <div>
          <div>
            <strong>{order.customer_name}</strong>
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>{order.customer_phone}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{order.address}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const isDelivered = status === "delivery" || status === "delivered";
        return <Tag color={isDelivered ? "green" : "blue"}>{status}</Tag>;
      },
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      render: (value) => <strong>{Number(value).toLocaleString()}đ</strong>,
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
      render: (time, order) => {
        const displayTime = time || order.delivered_at || order.created_at;
        if (!displayTime) return "-";
        return new Date(displayTime).toLocaleString("vi-VN");
      },
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Đơn đã giao cho khách</h2>
        <Text type="secondary">
          Tổng: <strong>{orders.length}</strong> đơn
        </Text>
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