import React, { useEffect, useState } from "react";
import { Table, Tag, Button, message, Popconfirm, Space } from "antd";
import API from "../../login_register/services/api";

export default function OrdersNew({ onAction }) {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [sellerProductIds, setSellerProductIds] = useState(new Set());

  const fetchSellerProducts = async () => {
    try {
      const res = await API.get("sellers/productseller/");
      const products = res.data.results || res.data || [];
      const ids = new Set(products.map(p => p.id));
      setSellerProductIds(ids);
      return ids;
    } catch (e) {
      console.error(e);
      message.error("Không thể tải sản phẩm của shop");
      return new Set();
    }
  };

  const fetchPending = async (productIds = sellerProductIds) => {
    setLoading(true);
    try {
      const res = await API.get("orders/seller/pending/");
      const allOrders = res.data || [];
      // Lọc chỉ đơn hàng có ít nhất một sản phẩm thuộc shop
      const filteredOrders = allOrders.filter(order =>
        (order.items || []).some(item => productIds.has(item.product))
      );
      setOrders(filteredOrders);
    } catch (e) {
      console.error(e);
      message.error("Không thể tải đơn mới");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const productIds = await fetchSellerProducts();
      fetchPending(productIds);
    };
    loadData();
  }, []);

  const approve = async (orderId) => {
    try {
      await API.post(`orders/${orderId}/seller/approve/`);
      message.success("Đã duyệt đơn, chuyển sang Chờ lấy hàng");
      fetchPending(sellerProductIds);
      onAction?.();
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.error || "Duyệt đơn thất bại");
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      await API.post(`orders/${orderId}/cancel/`);
      message.success(`Đơn #${orderId} đã được hủy`);
      fetchPending(sellerProductIds);
      onAction?.();
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.error || "Không thể hủy đơn hàng");
    }
  };

  const approveAll = async () => {
    if (orders.length === 0) {
      message.warning("Không có đơn hàng nào để duyệt");
      return;
    }
    try {
      setLoading(true);
      const approvePromises = orders.map(order => API.post(`orders/${order.id}/seller/approve/`));
      await Promise.all(approvePromises);
      message.success(`Đã duyệt ${orders.length} đơn hàng thành công`);
      fetchPending(sellerProductIds);
      onAction?.();
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.error || "Duyệt tất cả đơn thất bại");
      setLoading(false);
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
        <Space>
          <Button type="primary" onClick={() => approve(r.id)}>Duyệt đơn</Button>
          <Popconfirm
            title="Xác nhận hủy đơn"
            description={`Bạn có chắc muốn hủy đơn #${r.id}?`}
            okText="Hủy đơn"
            cancelText="Đóng"
            onConfirm={() => cancelOrder(r.id)}
          >
            <Button danger>Hủy đơn</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Đơn mới cần xác nhận</h2>
        {orders.length > 0 && (
          <Button type="primary" onClick={approveAll} loading={loading}>
            Duyệt tất cả ({orders.length} đơn)
          </Button>
        )}
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={orders}
        columns={columns}
      />
    </div>
  );
}