import React, { useEffect, useState } from "react";
import { Table, Tag, Button, message } from "antd";
import API from "../../login_register/services/api";

export default function OrdersProcessing() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);

  const fetchProcessing = async () => {
    setLoading(true);
    try {
      const res = await API.get("orders/seller/processing/");
      setOrders(res.data || []);
    } catch (e) {
      console.error(e);
      message.error("Không thể tải đơn đang xử lý");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessing();
  }, []);

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
      render: s => <Tag color={s === 'shipping' ? 'blue' : 'gold'}>{s}</Tag>
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
        <Button disabled>Xử lý giao hàng…</Button>
      )
    }
  ];

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Đơn đang xử lý</h2>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={orders}
        columns={columns}
      />
    </div>
  );
}