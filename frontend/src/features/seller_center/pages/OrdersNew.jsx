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

  // --- CẤU HÌNH CỘT CHO TABLE RESPONSIVE ---
  const columns = [
    { 
      title: "Mã", 
      dataIndex: "id", 
      key: "id",
      width: 60, // Cố định chiều rộng nhỏ
      fixed: 'left', // Ghim bên trái
      render: (text) => <span style={{fontWeight: 'bold'}}>#{text}</span>
    },
    {
      title: "Khách hàng",
      key: "customer",
      width: 160, // Đặt chiều rộng cụ thể để text tự xuống dòng
      render: (_, r) => (
        <div style={{ fontSize: 13 }}>
          <div style={{fontWeight: 600}}>{r.customer_name}</div>
          <div style={{ color: "#666" }}>{r.customer_phone}</div>
          {/* Giới hạn địa chỉ hiển thị gọn gàng */}
          <div style={{ 
            color: "#888", 
            fontSize: 11,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {r.address}
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (status) => (
        <Tag style={{margin: 0}} color={status === "pending" ? "gold" : "blue"}>
           {status === "pending" ? "Chờ" : status}
        </Tag>
      )
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      width: 110,
      render: (v) => <strong style={{color: '#16a34a'}}>{formatCurrency(v)}đ</strong>,
    },
    {
      title: "Hành động",
      key: "actions",
      fixed: 'right', // Ghim bên phải để luôn nhìn thấy nút
      width: 140,
      render: (_, r) => (
        // QUAN TRỌNG: paddingRight ở đây giúp đẩy các nút qua trái, tránh sát viền màn hình
        <div style={{ paddingRight: 15 }}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Button size="small" block onClick={() => openDetail(r)}>
              Chi tiết
            </Button>
            <Button type="primary" size="small" block onClick={() => approve(r.id)}>
              Duyệt
            </Button>
            <Popconfirm
              title="Hủy đơn này?"
              okText="Có"
              cancelText="Không"
              onConfirm={() => cancelOrder(r.id)}
              placement="topRight"
            >
              <Button danger size="small" block>Hủy</Button>
            </Popconfirm>
          </Space>
        </div>
      ),
    },
  ];

  return (
    // Thêm padding cho container ngoài cùng để nội dung không dính sát lề trái/phải
    <div style={{ padding: '0 10px', paddingBottom: 20 }}>
      
      <div className="flex justify-between items-center mb-4 pt-2">
        <h2 className="text-xl font-bold" style={{margin: 0}}>Đơn mới ({orders.length})</h2>
        {orders.length > 0 && (
          <Button type="primary" size="small" onClick={approveAll} loading={loading}>
            Duyệt hết
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={orders}
        columns={columns}
        // QUAN TRỌNG: Kích hoạt thanh cuộn ngang khi màn hình nhỏ
        scroll={{ x: 750 }} 
        pagination={{ pageSize: 5 }}
        size="small"
        bordered
      />

      {/* Modal Chi Tiết */}
      <Modal
        open={detailVisible}
        onCancel={closeDetail}
        footer={null}
        width="95%" // Modal rộng gần full màn hình điện thoại
        style={{ top: 20, maxWidth: 760 }}
        centered
        destroyOnClose
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>Đơn #{selectedOrder?.id}</span>
            {selectedOrder?.status && renderStatusTag(selectedOrder.status)}
          </div>
        }
      >
        {selectedOrder && (
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <Descriptions
              bordered
              size="small"
              column={1} // Trên mobile hiển thị 1 cột
              labelStyle={{ width: '100px', fontWeight: 600 }}
            >
              <Descriptions.Item label="Khách hàng">
                {selectedOrder.customer_name || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="SĐT">
                <a href={`tel:${selectedOrder.customer_phone}`}>{selectedOrder.customer_phone}</a>
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {selectedOrder.address || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú">
                {selectedOrder.note || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {selectedOrder.created_at
                  ? new Date(selectedOrder.created_at).toLocaleString("vi-VN")
                  : "—"}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Sản phẩm</h3>
              <List
                dataSource={selectedOrder.items || []}
                locale={{ emptyText: "Không có sản phẩm" }}
                renderItem={(item) => {
                  const productTotal =
                    Number(item.price || 0) * Number(item.quantity || 0);
                  return (
                    <List.Item
                      key={`${selectedOrder.id}-${item.product}`}
                      style={{ alignItems: "flex-start", padding: '10px 0' }}
                    >
                      <Space align="start" size={12} style={{ width: "100%" }}>
                        <Image
                          src={resolveProductImage(item.product_image)}
                          alt={item.product_name}
                          width={50}
                          height={50}
                          style={{ borderRadius: 6, objectFit: "cover" }}
                          preview={false}
                          fallback="https://via.placeholder.com/50"
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>{item.product_name}</div>
                          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                            {formatCurrency(item.price)}đ × {item.quantity}
                          </div>
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

            <Divider style={{ margin: "5px 0" }} />

            <div style={{ display: "flex", flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ fontSize: 13, color: "#666" }}>
                  Phí vận chuyển: {formatCurrency(selectedOrder.shipping_fee || 0)}đ
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#16a34a" }}>
                  Tổng cộng: {formatCurrency(selectedOrder.total_price)}đ
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}