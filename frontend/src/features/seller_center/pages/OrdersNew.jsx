import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  message,
  Popconfirm,
  Space,
  Modal,
  Descriptions,
  List,
  Image,
  Divider,
} from "antd";
import API from "../../login_register/services/api";

export default function OrdersNew({ onAction }) {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [sellerProductIds, setSellerProductIds] = useState(new Set());
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("vi-VN", {
      minimumFractionDigits: 0,
    });

  const resolveProductImage = (imagePath = "") => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/")) return `http://localhost:8000${imagePath}`;
    return `http://localhost:8000/media/${imagePath}`;
  };

  const fetchSellerProducts = async () => {
    try {
      const res = await API.get("sellers/productseller/");
      const products = res.data.results || res.data || [];
      const ids = new Set(products.map((p) => p.id));
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
      const filteredOrders = allOrders.filter((order) =>
        (order.items || []).some((item) => productIds.has(item.product))
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

  const openDetail = (order) => {
    setSelectedOrder(order);
    setDetailVisible(true);
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setSelectedOrder(null);
  };

  const renderStatusTag = (status) => (
    <Tag color={status === "pending" ? "gold" : "blue"}>{status}</Tag>
  );

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
      const approvePromises = orders.map((order) =>
        API.post(`orders/${order.id}/seller/approve/`)
      );
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
          <div style={{ fontSize: 12, color: "#666" }}>{r.customer_phone}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{r.address}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: renderStatusTag,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      render: (v) => <strong>{formatCurrency(v)}đ</strong>,
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, r) => (
        <Space>
          <Button onClick={() => openDetail(r)}>Xem chi tiết</Button>
          <Button type="primary" onClick={() => approve(r.id)}>
            Duyệt đơn
          </Button>
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
      ),
    },
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

      <Modal
        open={detailVisible}
        onCancel={closeDetail}
        footer={null}
        width={760}
        centered
        destroyOnClose
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>Chi tiết đơn #{selectedOrder?.id}</span>
            {selectedOrder?.status && renderStatusTag(selectedOrder.status)}
          </div>
        }
      >
        {selectedOrder && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Descriptions
              bordered
              size="small"
              column={2}
              labelStyle={{ fontWeight: 600 }}
            >
              <Descriptions.Item label="Khách hàng">
                {selectedOrder.customer_name || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedOrder.customer_phone || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {selectedOrder.address || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>
                {selectedOrder.note || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Thanh toán">
                {selectedOrder.payment_method || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {selectedOrder.created_at
                  ? new Date(selectedOrder.created_at).toLocaleString("vi-VN")
                  : "—"}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Sản phẩm trong đơn</h3>
              <List
                dataSource={selectedOrder.items || []}
                locale={{ emptyText: "Không có sản phẩm" }}
                renderItem={(item) => {
                  const productTotal =
                    Number(item.price || 0) * Number(item.quantity || 0);
                  return (
                    <List.Item
                      key={`${selectedOrder.id}-${item.product}`}
                      style={{ alignItems: "flex-start" }}
                    >
                      <Space align="start" size={16} style={{ width: "100%" }}>
                        <Image
                          src={resolveProductImage(item.product_image)}
                          alt={item.product_name}
                          width={56}
                          height={56}
                          style={{ borderRadius: 10, objectFit: "cover" }}
                          preview={false}
                          fallback="https://via.placeholder.com/56"
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                          <div style={{ fontSize: 13, color: "#4b5563" }}>
                            {formatCurrency(item.price)}đ × {item.quantity}
                          </div>
                          {item.seller_name && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#6b7280",
                                marginTop: 4,
                              }}
                            >
                              Nhà cung cấp: {item.seller_name}
                            </div>
                          )}
                        </div>
                        <div style={{ fontWeight: 600, color: "#16a34a" }}>
                          {formatCurrency(productTotal)}đ
                        </div>
                      </Space>
                    </List.Item>
                  );
                }}
              />
            </div>

            <Divider style={{ margin: "8px 0" }} />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 24 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "#6b7280" }}>Phí vận chuyển</div>
                <div style={{ fontWeight: 600 }}>
                  {formatCurrency(selectedOrder.shipping_fee || 0)}đ
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "#6b7280" }}>Tổng tiền</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#16a34a" }}>
                  {formatCurrency(selectedOrder.total_price)}đ
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}