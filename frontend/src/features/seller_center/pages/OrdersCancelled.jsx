import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  message,
  Typography,
  Button,
  Modal,
  Descriptions,
  List,
  Image,
  Divider,
  Space,
} from "antd";
import { useNavigate } from "react-router-dom";
import API from "../../login_register/services/api";

const { Text } = Typography;

export default function OrdersCancelled() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();

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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openDetail = (order) => {
    setSelectedOrder(order);
    setDetailVisible(true);
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setSelectedOrder(null);
  };

  const renderStatusTag = (status) => <Tag color="red">{status}</Tag>;

  const getColumnWidth = (mobile, tablet, desktop) => {
    if (windowWidth < 768) return mobile;
    if (windowWidth < 1024) return tablet;
    return desktop;
  };

  const getButtonSize = () => {
    if (windowWidth < 768) return "small";
    if (windowWidth < 1024) return "default";
    return "default";
  };

  const columns = [
    { title: "Mã đơn", dataIndex: "id", key: "id", width: getColumnWidth(80, 90, 100) },
    {
      title: "Khách hàng",
      key: "customer",
      width: getColumnWidth(150, 180, 200),
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
      width: getColumnWidth(100, 110, 120),
      render: renderStatusTag,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      width: getColumnWidth(120, 130, 140),
      render: (value) => <strong>{formatCurrency(value)}đ</strong>,
    },
    {
      title: "Số lượng sản phẩm",
      key: "items_count",
      width: getColumnWidth(100, 110, 120),
      render: (_, order) => order.items?.length || 0,
    },
    {
      title: "Cập nhật lần cuối",
      dataIndex: "updated_at",
      key: "updated_at",
      width: getColumnWidth(150, 170, 180),
      render: (value, order) => {
        const time = value || order.cancelled_at || order.created_at;
        if (!time) return "-";
        return new Date(time).toLocaleString("vi-VN");
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: getColumnWidth(120, 130, 140),
      render: (_, record) => (
        <Button size={getButtonSize()} onClick={() => openDetail(record)}>Xem chi tiết</Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold">Đơn đã hủy</h2>
          <Text type="secondary">
            Danh sách các đơn bị hủy sẽ hiển thị tại đây để bạn dễ dàng theo dõi.
          </Text>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/seller-center/orders/new")}>
            Xem đơn mới
          </Button>
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
        scroll={{ x: windowWidth < 1024 ? 800 : 1200 }}
        size={windowWidth < 768 ? "small" : "middle"}
        pagination={{ pageSize: windowWidth < 768 ? 5 : 10 }}
      />

      <Modal
        open={detailVisible}
        onCancel={closeDetail}
        footer={null}
        width={windowWidth < 768 ? windowWidth - 32 : windowWidth < 1024 ? 700 : 760}
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
              column={windowWidth < 768 ? 1 : 2}
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