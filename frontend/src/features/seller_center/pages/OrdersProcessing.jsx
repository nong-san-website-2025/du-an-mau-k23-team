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

export default function OrdersProcessing({ onAction }) {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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

  useEffect(() => {
    fetchProcessing();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
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

  const renderStatusTag = (status) => (
    <Tag color={status === "shipping" ? "blue" : "gold"}>{status}</Tag>
  );

  const columns = [
    { title: "Mã đơn", dataIndex: "id", key: "id" },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_, record) => (
        <div>
          <div><strong>{record.customer_name}</strong></div>
          <div style={{ fontSize: 12, color: "#666" }}>{record.customer_phone}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{record.address}</div>
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
      render: (value) => <strong>{formatCurrency(value)}đ</strong>,
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button onClick={() => openDetail(record)}>Xem chi tiết</Button>
          <Button
            type="primary"
            onClick={async () => {
              try {
                await API.post(`orders/${record.id}/seller/complete/`);
                message.success(`Đơn #${record.id} đã xác nhận giao thành công`);
                fetchProcessing();
                onAction?.();
              } catch (error) {
                console.error(error);
                message.error(error.response?.data?.error || "Không thể xác nhận giao hàng");
              }
            }}
          >
            Đã giao thành công
          </Button>
          <Popconfirm
            title="Xác nhận hủy đơn"
            description={`Bạn có chắc muốn hủy đơn #${record.id}?`}
            okText="Hủy đơn"
            cancelText="Đóng"
            onConfirm={async () => {
              try {
                await API.post(`orders/${record.id}/cancel/`);
                message.success(`Đơn #${record.id} đã được hủy`);
                fetchProcessing();
                onAction?.();
              } catch (error) {
                console.error(error);
                message.error(error.response?.data?.error || "Không thể hủy đơn hàng");
              }
            }}
          >
            <Button danger>Hủy đơn</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const isMobile = windowWidth < 576;
  const isTablet = windowWidth >= 576 && windowWidth < 992;

  const responsiveColumns = columns.map(col => {
    if (col.key === 'customer') {
      return {
        ...col,
        render: (_, record) => (
          <div>
            <div><strong>{record.customer_name}</strong></div>
            {!isMobile && (
              <>
                <div style={{ fontSize: 12, color: "#666" }}>{record.customer_phone}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{record.address}</div>
              </>
            )}
          </div>
        ),
      };
    }
    if (col.key === 'actions') {
      return {
        ...col,
        render: (_, record) => (
          <Space direction={isMobile ? "vertical" : "horizontal"}>
            <Button onClick={() => openDetail(record)}>Xem chi tiết</Button>
            <Button
              type="primary"
              onClick={async () => {
                try {
                  await API.post(`orders/${record.id}/seller/complete/`);
                  message.success(`Đơn #${record.id} đã xác nhận giao thành công`);
                  fetchProcessing();
                  onAction?.();
                } catch (error) {
                  console.error(error);
                  message.error(error.response?.data?.error || "Không thể xác nhận giao hàng");
                }
              }}
            >
              Đã giao thành công
            </Button>
            <Popconfirm
              title="Xác nhận hủy đơn"
              description={`Bạn có chắc muốn hủy đơn #${record.id}?`}
              okText="Hủy đơn"
              cancelText="Đóng"
              onConfirm={async () => {
                try {
                  await API.post(`orders/${record.id}/cancel/`);
                  message.success(`Đơn #${record.id} đã được hủy`);
                  fetchProcessing();
                  onAction?.();
                } catch (error) {
                  console.error(error);
                  message.error(error.response?.data?.error || "Không thể hủy đơn hàng");
                }
              }}
            >
              <Button danger>Hủy đơn</Button>
            </Popconfirm>
          </Space>
        ),
      };
    }
    return col;
  });

  return (
    <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px" }}>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={orders}
        columns={responsiveColumns}
        scroll={{ x: isMobile ? 800 : 'max-content' }}
        size={isMobile ? "small" : "middle"}
      />

      <Modal
        open={detailVisible}
        onCancel={closeDetail}
        footer={null}
        width={isMobile ? '90%' : 760}
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
              column={isMobile ? 1 : 2}
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
                            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
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