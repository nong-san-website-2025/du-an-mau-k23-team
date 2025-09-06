import React, { useEffect, useState } from "react";
import {
  Collapse,
  Tag,
  Typography,
  Skeleton,
  Empty,
  List,
  Divider,
  Image,
  Space,
  message,
} from "antd";
import API from "../../login_register/services/api";

const { Panel } = Collapse;
const { Text } = Typography;

// Map trạng thái đơn hàng -> label + màu
const statusMap = {
  pending: { label: "Chờ xác nhận", color: "gold" },
  shipping: { label: "Chờ nhận hàng", color: "blue" },
  success: { label: "Đã thanh toán", color: "green" },
  cancelled: { label: "Đã huỷ", color: "red" },
};

const OrderTab = ({ status }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dữ liệu từ API
  useEffect(() => {
    setLoading(true);

    const statusParam = status === "completed" ? "success" : status;

    API.get(`orders/?status=${statusParam}`)
      .then((res) => {
        const sortedOrders = res.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setOrders(sortedOrders);
      })
      .catch(() => {
        message.error("Không thể tải đơn hàng");
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [status]);

  // Loading
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    );
  }

  // Không có đơn hàng
  if (!orders.length) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Empty description="Không có đơn hàng nào" />
      </div>
    );
  }

  return (
    <div className="flex justify-content-center min-h-screen py-10 bg-gray-50 w-75" style={{ paddingLeft: '300px' }}>
      <div className="w-full max-w-6xl">
        <Collapse accordion bordered={false} style={{ background: "#fff" }}>
          {orders.map((order) => (
            <Panel
              key={order.id}
              header={
                <div className="flex justify-between items-center w-full">
                  {/* Mã đơn + trạng thái */}
                  <Space size="middle">
                    <Text strong>Mã đơn: #{order.id}</Text>
                    <Tag
                      color={statusMap[order.status]?.color || "default"}
                      style={{ fontSize: 12 }}
                    >
                      {statusMap[order.status]?.label || "Không xác định"}
                    </Tag>
                  </Space>

                  {/* Tổng tiền + Ngày đặt */}
                  <Space size="large">
                    <Text strong style={{ color: "#27ae60" }}>
                      {Number(order.total_price).toLocaleString()}đ
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(order.created_at).toLocaleString("vi-VN")}
                    </Text>
                  </Space>
                </div>
              }
              style={{
                background: "#fafafa",
                borderRadius: 8,
                marginBottom: 12,
                border: "1px solid #f0f0f0",
              }}
            >
              {/* Nội dung chi tiết */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* BÊN TRÁI - Thông tin người nhận */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-lg mb-3">
                    Thông tin người nhận
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Người nhận:</strong> {order.customer_name}
                    </p>
                    <p>
                      <strong>SĐT:</strong> {order.customer_phone}
                    </p>
                    <p>
                      <strong>Địa chỉ:</strong> {order.address}
                    </p>
                    {order.note && (
                      <p>
                        <strong>Ghi chú:</strong> {order.note}
                      </p>
                    )}
                    <p>
                      <strong>Thanh toán:</strong> {order.payment_method}
                    </p>
                  </div>
                </div>

                {/* BÊN PHẢI - Sản phẩm trong đơn */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-lg mb-3">Sản phẩm</h3>
                  <List
                    dataSource={order.items}
                    renderItem={(item) => (
                      <List.Item style={{ padding: "8px 0" }}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <Image
                              src={`http://localhost:8000/media/${item.product_image}`}
                              alt={item.product_name}
                              width={50}
                              height={50}
                              style={{
                                borderRadius: 8,
                                objectFit: "cover",
                                marginRight: 12,
                              }}
                              preview={false}
                            />
                            <div>
                              <Text strong>{item.product_name}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 13 }}>
                                {Number(item.price).toLocaleString()}đ x{" "}
                                {item.quantity}
                              </Text>
                            </div>
                          </div>

                          {/* Thành tiền */}
                          <Text strong style={{ color: "#27ae60" }}>
                            {(
                              Number(item.price) * Number(item.quantity)
                            ).toLocaleString()}
                            đ
                          </Text>
                        </div>
                      </List.Item>
                    )}
                  />
                  <Divider />
                  <div className="text-right">
                    <Text strong style={{ fontSize: 16, color: "#27ae60" }}>
                      Tổng tiền: {Number(order.total_price).toLocaleString()}đ
                    </Text>
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </Collapse>
      </div>
    </div>
  );
};

export default OrderTab;
