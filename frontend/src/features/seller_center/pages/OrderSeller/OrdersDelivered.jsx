import React, { useEffect, useState } from "react";
import {
  Tag,
  message,
  Modal,
  Descriptions,
  Table,
} from "antd";
import API from "../../../login_register/services/api";
import OrdersBaseLayout from "../../components/OrderSeller/OrdersBaseLayout";
import "../../styles/OrderPage.css";

export default function OrdersDelivered() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get("orders/seller/complete/");
      setOrders(res.data);
      setFiltered(res.data);
    } catch (e) {
      message.error("Không thể tải đơn đã giao");
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
          o.customer_phone?.includes(lower) ||
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
        <Tag color="green">
          {s === "delivered" ? "Đã giao" : "Hoàn thành"}
        </Tag>
      ),
      align: "center",
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      render: (v) => <strong>{Number(v).toLocaleString()}đ</strong>,
      align: "center",
    },
    {
      title: "Số lượng SP",
      render: (_, o) => o.items?.length || 0,
      align: "center",
      width: 120,
    },
    {
      title: "Thời gian giao",
      dataIndex: "updated_at",
      render: (t, o) => {
        const time = t || o.delivered_at || o.created_at;
        if (!time) return "-";
        const date = new Date(time);
        return (
          <div>
            <div style={{ fontSize: 13 }}>
              {date.toLocaleDateString("vi-VN")}
            </div>
            <div style={{ fontSize: 12, color: "#999" }}>
              {date.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        );
      },
      width: 150,
    },
  ];

  return (
    <>
      <OrdersBaseLayout
        title="ĐƠN HÀNG ĐÃ GIAO"
        loading={loading}
        data={filtered}
        columns={columns}
        onSearch={handleSearch}
        searchPlaceholder="Tìm theo tên, SĐT hoặc mã đơn"
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
                <Tag color="green">
                  {selectedOrder.status === "delivered"
                    ? "Đã giao"
                    : "Hoàn thành"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                {Number(selectedOrder.total_price).toLocaleString()}đ
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian giao" span={2}>
                {selectedOrder.updated_at
                  ? new Date(selectedOrder.updated_at).toLocaleString("vi-VN")
                  : "-"}
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