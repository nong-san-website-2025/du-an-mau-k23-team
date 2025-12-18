import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  Tag,
  message,
  Popconfirm,
  Space,
  Modal,
  Descriptions,
  Table,
  notification,
} from "antd";
import API from "../../../login_register/services/api";
import OrdersBaseLayout from "../../components/OrderSeller/OrdersBaseLayout";
import "../../styles/OrderPage.css";
// 1. Import socket.io
import io from "socket.io-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function OrdersNew() {
  const queryClient = useQueryClient();
  const socketRef = useRef(null); // Ref giữ kết nối socket

  // ✅ Fetch danh sách đơn hàng ban đầu
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["sellerOrders", "pending"],
    queryFn: async () => {
      const res = await API.get("orders/seller/pending/");
      return res.data.sort((a, b) => b.id - a.id);
    },
    // Không dùng refetchInterval nữa
  });

  // ✅ LOGIC SOCKET.IO REAL-TIME
  useEffect(() => {
    // Chỉ kết nối nếu chưa có socket
    if (!socketRef.current) {
      // SỬA: Lấy đúng key "token"
      const token = localStorage.getItem("token");

      if (token) {
        // Kết nối Socket
        socketRef.current = io(process.env.REACT_APP_API_URL, {
          auth: { token }, // Gửi token để Backend xác thực Shop
          transports: ["websocket"],
        });

        // Lắng nghe sự kiện 'new_order'
        socketRef.current.on("new_order", (newOrder) => {
          console.log("🔥 Shop nhận đơn mới:", newOrder);

          // A. Thông báo góc màn hình
          notification.success({
            message: "🎉 Có đơn hàng mới!",
            description: `Đơn #${newOrder.id} - ${Number(newOrder.total_price).toLocaleString()}đ`,
            placement: "bottomRight",
            duration: 5,
          });

          // B. Cập nhật thẳng vào Cache (Hiển thị ngay lập tức)
          queryClient.setQueryData(["sellerOrders", "pending"], (oldData) => {
            const currentList = oldData || [];
            // Kiểm tra trùng lặp
            if (currentList.find((o) => o.id === newOrder.id))
              return currentList;
            // Chèn lên đầu
            return [newOrder, ...currentList];
          });
        });

        socketRef.current.on("connect_error", (err) => {
          console.error("Lỗi kết nối Socket:", err.message);
        });
      }
    }

    // Cleanup khi component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [queryClient]);

  // ✅ Mutations (Duyệt và Hủy đơn)
  const approveMutation = useMutation({
    mutationFn: (id) => API.post(`orders/${id}/seller/approve/`),
    onSuccess: () => {
      message.success("Đơn đã được duyệt");
      queryClient.invalidateQueries(["sellerOrders", "pending"]);
    },
    onError: () => message.error("Lỗi khi duyệt đơn"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => API.post(`orders/${id}/cancel/`),
    onSuccess: () => {
      message.success("Đơn đã được hủy");
      queryClient.invalidateQueries(["sellerOrders", "pending"]);
    },
    onError: () => message.error("Lỗi khi hủy đơn"),
  });

  // Đồng bộ state filter
  useEffect(() => {
    setFiltered(orders);
  }, [orders]);

  const [filtered, setFiltered] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tick, setTick] = useState(0);

  // Bộ đếm thời gian
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
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

  const getTimeWithWarning = (createdAt, tick) => {
    if (!createdAt) return { text: "-", color: "#999" };

    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let color = "#52c41a";
    if (diffMinutes >= 30) color = "#faad14";
    if (diffMinutes >= 60) color = "#ff4d4f";

    let text;
    if (diffMinutes < 1) text = "Mới";
    else if (diffMinutes < 60) text = `${diffMinutes} phút`;
    else if (diffHours < 24) {
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
      title: "Thời gian",
      dataIndex: "created_at",
      width: 180,
      align: "center",
      render: (created_at) => {
        const { text, color } = getTimeWithWarning(created_at, tick);
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
      onHeaderCell: () => ({
        style: { paddingRight: 16, paddingLeft: 10 },
      }),
      render: (_, r) => (
        <div style={{ paddingRight: 14, paddingLeft: 6 }}>
          <Space size="middle" onClick={(e) => e.stopPropagation()}>
            <Popconfirm
              title="Xác nhận duyệt đơn"
              description="Bạn chắc chắn muốn duyệt đơn hàng này?"
              onConfirm={() => approveMutation.mutate(r.id)}
              okText="Duyệt"
              cancelText="Hủy"
              okButtonProps={{ loading: approveMutation.isPending }}
            >
              <Button
                type="primary"
                size="middle"
                loading={
                  approveMutation.isPending &&
                  approveMutation.variables === r.id
                }
                disabled={cancelMutation.isPending}
                style={{ minWidth: 90 }}
                onClick={(e) => e.stopPropagation()}
              >
                Duyệt đơn
              </Button>
            </Popconfirm>

            <Popconfirm
              title="Xác nhận từ chối"
              description="Bạn chắc chắn muốn từ chối đơn hàng này?"
              onConfirm={() => cancelMutation.mutate(r.id)}
              okText="Từ chối"
              cancelText="Quay lại"
              okButtonProps={{
                danger: true,
                loading: cancelMutation.isPending,
              }}
            >
              <Button
                size="middle"
                danger
                ghost
                loading={
                  cancelMutation.isPending && cancelMutation.variables === r.id
                }
                disabled={approveMutation.isPending}
                style={{ minWidth: 90 }}
                onClick={(e) => e.stopPropagation()}
              >
                Từ chối
              </Button>
            </Popconfirm>
          </Space>
        </div>
      ),
    },
  ];

  return (
    <>
      <OrdersBaseLayout
        title="ĐƠN HÀNG MỚI"
        loading={isLoading}
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
