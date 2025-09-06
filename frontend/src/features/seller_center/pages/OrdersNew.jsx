import React, { useEffect, useState } from "react";
import { Table, Tag, Button, message } from "antd";
import API from "../../login_register/services/api";

export default function OrdersNew() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await API.get("orders/seller/pending/");
      setOrders(res.data || []);
    } catch (e) {
      console.error(e);
      message.error("Không thể tải đơn mới");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const approve = async (orderId) => {
    try {
      await API.post(`orders/${orderId}/seller/approve/`);
      message.success("Đã duyệt đơn, chuyển sang Chờ nhận hàng");
      fetchPending();
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.error || "Duyệt đơn thất bại");
    }
  };

  const columns = [
    { title: "Mã đơn", dataIndex: "id", key: "id" },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_, r) => (
        <div>
          <div><strong>{r.customer_name}</strong></div>
          <div style={{fontSize:12, color:'#666'}}>{r.customer_phone}</div>
          <div style={{fontSize:12, color:'#666'}}>{r.address}</div>
        </div>
      )
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: s => <Tag color={s === 'pending' ? 'gold' : 'blue'}>{s}</Tag>
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      render: v => <strong>{Number(v).toLocaleString()}đ</strong>
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, r) => (
        <Button type="primary" onClick={() => approve(r.id)}>Duyệt đơn</Button>
      )
    }
  ];

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Đơn mới cần xác nhận</h2>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={orders}
        columns={columns}
      />
    </div>
  );
}