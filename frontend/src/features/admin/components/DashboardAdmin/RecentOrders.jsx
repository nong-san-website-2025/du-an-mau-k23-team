import React, { useEffect, useState } from "react";
import { Table, Card, Button, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { formatVND } from "../../../stores/components/StoreDetail/utils/utils";

export default function RecentOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Sử dụng biến môi trường giống TopSellingProducts
  const API_URL =
    process.env.REACT_APP_API_URL || "http://172.16.144.88:8000/api";

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        // Gọi API sử dụng biến môi trường
        const res = await axios.get(`${API_URL}/orders/recent/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data);
      } catch (err) {
        console.error("Error fetching recent orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [API_URL]);

  // Mapping trạng thái tiếng Việt
  const statusConfig = {
    pending: { text: "Chờ xác nhận", color: "orange" },
    shipping: { text: "Đang giao hàng", color: "blue" },
    delivered: { text: "Thành công", color: "green" },
    success: { text: "Thành công", color: "green" },
    completed: { text: "Hoàn thành", color: "green" },
    cancelled: { text: "Đã hủy", color: "red" },
  };

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id,
      render: (id) => (
        <Button
          type="link"
          onClick={() => navigate(`/orders/${id}`)}
          style={{ padding: 0 }}
        >
          #{id}
        </Button>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer_name",
      key: "customer_name",
      sorter: (a, b) =>
        (a.customer_name || "").localeCompare(b.customer_name || ""),
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
      sorter: (a, b) => a.total_price - b.total_price,
      render: (val) => formatVND(val),
    },
    {
      title: "Thanh toán",
      dataIndex: "payment_method",
      key: "payment_method",
      render: (method) =>
        method?.toLowerCase() === "cod" ? "Tiền mặt" : method,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status) => {
        const config = statusConfig[status] || {
          text: status,
          color: "default",
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => new Date(date).toLocaleString("vi-VN"),
    },
  ];

  return (
    <Card
      title=""
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
        pagination={{ pageSize: 5 }}
      />
    </Card>
  );
}
