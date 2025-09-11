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

  // Complaint UI state per product
  const [openComplaint, setOpenComplaint] = useState({}); // { [productId]: boolean }
  const [complaintTexts, setComplaintTexts] = useState({}); // { [productId]: string }
  const [complaintFiles, setComplaintFiles] = useState({}); // { [productId]: File[] }
  const [sendingByProduct, setSendingByProduct] = useState({}); // { [productId]: boolean }

  const toggleComplaint = (productId) => {
    setOpenComplaint((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };
  const onChangeText = (productId, val) => {
    setComplaintTexts((prev) => ({ ...prev, [productId]: val }));
  };
  const onChangeFiles = (productId, files) => {
    setComplaintFiles((prev) => ({ ...prev, [productId]: Array.from(files) }));
  };
  const sendComplaint = async (productId, unitPrice, quantity) => {
    const token = localStorage.getItem("token");
    if (!token) {
      message.info("Bạn cần đăng nhập để gửi khiếu nại");
      return;
    }
    const reason = (complaintTexts[productId] || "").trim();
    if (!reason) {
      message.warning("Vui lòng nhập nội dung khiếu nại");
      return;
    }

    try {
      setSendingByProduct((prev) => ({ ...prev, [productId]: true }));
      const formData = new FormData();
      formData.append("product", productId);
      formData.append("reason", reason);
      // Send quantity and unit_price so backend can refund correctly
      if (quantity != null) formData.append("quantity", String(quantity));
      if (unitPrice != null) formData.append("unit_price", String(unitPrice));
      (complaintFiles[productId] || []).forEach((f) => formData.append("media", f));

      const res = await fetch("http://localhost:8000/api/complaints/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error(`Lỗi API: ${res.status}`);

      message.success("Đã gửi khiếu nại thành công!");
      setComplaintTexts((prev) => ({ ...prev, [productId]: "" }));
      setComplaintFiles((prev) => ({ ...prev, [productId]: [] }));
      setOpenComplaint((prev) => ({ ...prev, [productId]: false }));
    } catch (e) {
      console.error(e);
      message.error("Gửi khiếu nại thất bại!");
    } finally {
      setSendingByProduct((prev) => ({ ...prev, [productId]: false }));
    }
  };

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
                              src={
                                item.product_image?.startsWith("/")
                                  ? `http://localhost:8000${item.product_image}`
                                  : item.product_image?.startsWith("http")
                                  ? item.product_image
                                  : `http://localhost:8000/media/${item.product_image || ""}`
                              }
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
                                {Number(item.price).toLocaleString()}đ x {item.quantity}
                              </Text>
                              {status === "completed" && (
                                <div style={{ marginTop: 8 }}>
                                  <button
                                    onClick={() => toggleComplaint(item.product)}
                                    style={{
                                      background: "#16a34a",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: 6,
                                      padding: "4px 10px",
                                      fontSize: 12,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Khiếu nại
                                  </button>
                                  {openComplaint[item.product] && (
                                    <div
                                      style={{
                                        background: "#f0fdf4",
                                        border: "1px solid #bbf7d0",
                                        borderRadius: 8,
                                        padding: 10,
                                        marginTop: 8,
                                        maxWidth: 420,
                                      }}
                                    >
                                      <div style={{ marginBottom: 6 }}>
                                        <strong>Nội dung khiếu nại:</strong>
                                        <textarea
                                          rows={3}
                                          value={complaintTexts[item.product] || ""}
                                          onChange={(e) => onChangeText(item.product, e.target.value)}
                                          placeholder="Mô tả vấn đề bạn gặp phải..."
                                          style={{
                                            width: "100%",
                                            marginTop: 6,
                                            padding: 6,
                                            borderRadius: 6,
                                            border: "1px solid #ddd",
                                            resize: "vertical",
                                          }}
                                        />
                                      </div>
                                      <div style={{ marginBottom: 8 }}>
                                        <strong>Ảnh/Video minh hoạ (tuỳ chọn):</strong>
                                        <input
                                          type="file"
                                          multiple
                                          accept="image/*,video/*"
                                          onChange={(e) => onChangeFiles(item.product, e.target.files)}
                                          style={{ marginTop: 6 }}
                                        />
                                      </div>
                                      <div style={{ display: "flex", gap: 8 }}>
                                        <button
                                          onClick={() => sendComplaint(item.product, item.price, item.quantity)}
                                          disabled={!!sendingByProduct[item.product]}
                                          style={{
                                            background: "#16a34a",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 6,
                                            padding: "6px 12px",
                                            cursor: "pointer",
                                          }}
                                        >
                                          {sendingByProduct[item.product] ? "Đang gửi..." : "Gửi khiếu nại"}
                                        </button>
                                        <button
                                          onClick={() => toggleComplaint(item.product)}
                                          style={{
                                            background: "#fff",
                                            color: "#16a34a",
                                            border: "1px solid #16a34a",
                                            borderRadius: 6,
                                            padding: "6px 12px",
                                            cursor: "pointer",
                                          }}
                                        >
                                          Huỷ
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Thành tiền */}
                          <Text strong style={{ color: "#27ae60" }}>
                            {(Number(item.price) * Number(item.quantity)).toLocaleString()}đ
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
