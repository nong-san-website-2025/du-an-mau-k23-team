import React, { useEffect, useState } from "react";
import {
  Button,
  Tag,
  message,
  Popconfirm,
  Space,
  Modal,
  Descriptions,
  Table,
} from "antd";
import API from "../../../login_register/services/api";
import OrdersBaseLayout from "../../components/OrderSeller/OrdersBaseLayout";
import "../../styles/OrderPage.css";

export default function OrdersNew() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get("orders/seller/pending/");
      // Sắp xếp theo id giảm dần (đơn mới nhất trước)
      const sortedOrders = res.data.sort((a, b) => b.id - a.id);
      setOrders(sortedOrders);
      setFiltered(sortedOrders);
    } catch (e) {
      message.error("Không thể tải đơn mới");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = (value) => {
    const lower = value.toLowerCase();
    setFiltered(
      orders.filter(
        (o) =>
          o.customer_name?.toLowerCase().includes(lower) ||
          String(o.id).includes(lower)
      )
    );
  };

  const fetchOrderDetail = async (id) => {
    try {

      const res = await API.get(`orders/${id}/detail/`);
      setSelectedOrder(res.data);
      setIsModalVisible(true);
    } catch {
      message.error("Không thể tải chi tiết đơn hàng");
    }
  };

  const approve = async (id) => {
    setProcessingId(id);
    try {
      await API.post(`orders/${id}/seller/approve/`);
      message.success("Đơn đã được duyệt");
      fetchOrders();
    } catch {
      message.error("Lỗi khi duyệt đơn");
    } finally {
      setProcessingId(null);
    }
  };

  const cancel = async (id) => {
    setProcessingId(id);
    try {
      await API.post(`orders/${id}/cancel/`);
      message.success("Đơn đã được hủy");
      fetchOrders();
    } catch {
      message.error("Lỗi khi hủy đơn");
    } finally {
      setProcessingId(null);
    }
  };

  const getTimeWithWarning = (createdAt) => {
    if (!createdAt) return { text: "-", color: "#999" };

    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Màu cảnh báo dựa trên PHÚT
    let color = "#52c41a"; // Xanh - mới (< 30 phút)
    if (diffMinutes >= 30) color = "#faad14"; // Vàng - >= 30 phút
    if (diffMinutes >= 60) color = "#ff4d4f"; // Đỏ - >= 60 phút (1 giờ)

    // Text hiển thị
    let text;
    if (diffMinutes < 1) {
      text = "Mới";
    } else if (diffMinutes < 60) {
      text = `${diffMinutes} phút`;
    } else if (diffHours < 24) {
      const remainMinutes = diffMinutes % 60;
      text =
        remainMinutes > 0
          ? `${diffHours}h ${remainMinutes}m`
          : `${diffHours} giờ`;
    } else {
      const remainHours = diffHours % 24;
      text = `${diffDays} ngày ${remainHours}h`;
    }

    return { text, color };
  };

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      width: 120,
      render: (id) => <strong>#{id}</strong>,
    },
    {
      title: "Khách hàng",
      render: (_, r) => (
        <>
          <div style={{ fontWeight: 600 }}>{r.customer_name}</div>
        </>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (s) => (
        <Tag color="gold">{s === "pending" ? "Chờ duyệt" : s}</Tag>
      ),
      align: "center",
    },

    {
      title: "Thời gian tồn tại",
      dataIndex: "created_at",
      width: 180,
      align: "center",
      render: (created_at) => {
        const { text, color } = getTimeWithWarning(created_at);
        return (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color }}>{text}</div>
            <div style={{ fontSize: 11, color: "#999" }}>
              {created_at
                ? new Date(created_at).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-"}
            </div>
          </div>
        );
      },
      sorter: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      render: (v) => <strong>{Number(v).toLocaleString()}đ</strong>,
      align: "center",
    },

    {
      title: "Hành động",
      align: "center",
      width: 240,
      render: (_, r) => (
        <Space size="middle" onClick={(e) => e.stopPropagation()}>
          <Popconfirm
            title="Xác nhận duyệt đơn"
            description="Bạn chắc chắn muốn duyệt đơn hàng này?"
            onConfirm={() => approve(r.id)}
            okText="Duyệt"
            cancelText="Hủy"
            okButtonProps={{ loading: processingId === r.id }}
          >
            <Button
              type="primary"
              size="middle"
              loading={processingId === r.id}
              disabled={processingId !== null}
              style={{ minWidth: 90 }}
              onClick={(e) => {
                e.stopPropagation(); // Ngăn event bubble lên row
                approve(r.id);
              }}
            >
              Duyệt đơn
            </Button>
          </Popconfirm>

          <Popconfirm
            title="Xác nhận từ chối"
            description="Bạn chắc chắn muốn từ chối đơn hàng này?"
            onConfirm={() => cancel(r.id)}
            okText="Từ chối"
            cancelText="Quay lại"
            okButtonProps={{
              danger: true,
              loading: processingId === r.id,
            }}
          >
            <Button
              size="middle"
              danger
              ghost
              loading={processingId === r.id}
              disabled={processingId !== null}
              style={{ minWidth: 90 }}
              onClick={(e) => e.stopPropagation()}
            >
              Từ chối
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <OrdersBaseLayout
        title="ĐƠN HÀNG MỚI"
        loading={loading}
        data={filtered}
        columns={columns}
        onSearch={handleSearch}
        onRow={(record) => ({
          className: "order-item-row-hover",
          onClick: () => fetchOrderDetail(record.id),
        })}
      />

      {/* Modal chi tiết đơn */}
      <Modal
        open={isModalVisible}
        title={`Chi tiết đơn #${selectedOrder?.id}`}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedOrder ? (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Khách hàng">
                {selectedOrder.user?.username || selectedOrder.customer_name}
              </Descriptions.Item>
              <Descriptions.Item label="SĐT">
                {selectedOrder.user?.phone || selectedOrder.customer_phone}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {selectedOrder.address}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {selectedOrder.status}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                {Number(selectedOrder.total_price).toLocaleString()}đ
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Table
                dataSource={selectedOrder.items}
                pagination={false}
                rowKey={(item) => item.id}
                columns={[
                  {
                    title: "ID",
                    dataIndex: "id",
                    width: 80,
                    align: "center",
                    render: (id) => <small>#{id}</small>,
                  },
                  {
                    title: "Sản phẩm",
                    render: (item) => (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: "cover",
                              borderRadius: 4,
                              border: "1px solid #eee",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 4,
                              backgroundColor: "#f5f5f5",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#999",
                              fontSize: 12,
                            }}
                          >
                            ?
                          </div>
                        )}
                        <span>{item.product_name}</span>
                      </div>
                    ),
                  },
                  {
                    title: "Số lượng",
                    dataIndex: "quantity",
                    align: "center",
                    width: 100,
                  },
                  {
                    title: "Giá",
                    dataIndex: "price",
                    render: (v) => `${Number(v).toLocaleString()}đ`,
                    align: "center",
                    width: 120,
                  },
                  {
                    title: "Thành tiền",
                    render: (item) => {
                      const total = Number(item.quantity) * Number(item.price);
                      return <strong>{total.toLocaleString()}đ</strong>;
                    },
                    align: "center",
                    width: 130,
                  },
                ]}
                size="small"
              />
            </div>
          </>
        ) : (
          <p>Đang tải...</p>
        )}
      </Modal>
    </>
  );
}
