import React, { useEffect, useState } from "react";
import { Table, Card, Button, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { intcomma } from "./../../../../utils/format";

export default function RecentOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://127.0.0.1:8000/api/orders/recent/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setOrders(res.data);
      } catch (err) {
        console.error("Error fetching recent orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const statusColors = {
    pending: "orange",
    shipping: "blue",
    success: "green",
    cancelled: "red",
  };

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      key: "id",
      render: (id) => <a onClick={() => navigate(`/orders/${id}`)}>#{id}</a>,
    },
    {
      title: "Khách hàng",
      dataIndex: "customer_name",
      key: "customer_name",
    },
    {
      title: "Số điện thoại",
      dataIndex: "customer_phone",
      key: "customer_phone",
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
     render: (val) => (val ? `${intcomma(val)} ₫` : "0 ₫"),

    },
    {
      title: "Thanh toán",
      dataIndex: "payment_method",
      key: "payment_method",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColors[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleString("vi-VN"),
    },
  ];

  return (
    <Card
      extra={
        <Button type="link" onClick={() => navigate("/orders")}>
          Xem tất cả
        </Button>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={orders}
        loading={loading}
        pagination={false}
      />
    </Card>
  );
}
