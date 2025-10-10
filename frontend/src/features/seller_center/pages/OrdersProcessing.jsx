import React, { useEffect, useState } from "react";
import { Table, Tag, Button, message, Popconfirm, Space } from "antd";
import API from "../../login_register/services/api";

export default function OrdersProcessing({ onAction }) {
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
        <Space>
          <Button
            type="primary"
            onClick={async () => {
              try {
                await API.post(`orders/${r.id}/seller/complete/`);
                message.success(`Đơn #${r.id} đã xác nhận giao thành công`);
                fetchProcessing();
                onAction?.();
              } catch (e) {
                console.error(e);
                message.error(e.response?.data?.error || "Không thể xác nhận giao hàng");
              }
            }}
          >
            Đã giao thành công
          </Button>
          <Popconfirm
            title="Xác nhận hủy đơn"
            description={`Bạn có chắc muốn hủy đơn #${r.id}?`}
            okText="Hủy đơn"
            cancelText="Đóng"
            onConfirm={async () => {
              try {
                await API.post(`orders/${r.id}/cancel/`);
                message.success(`Đơn #${r.id} đã được hủy`);
                fetchProcessing();
                onAction?.();
              } catch (e) {
                console.error(e);
                message.error(e.response?.data?.error || "Không thể hủy đơn hàng");
              }
            }}
          >
            <Button danger>Hủy đơn</Button>
          </Popconfirm>
        </Space>
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