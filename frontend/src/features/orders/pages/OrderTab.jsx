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
  Button,
  Popconfirm,
  message,
} from "antd";
import API from "../../login_register/services/api";

const { Panel } = Collapse;
const { Text } = Typography;

// Map trạng thái đơn hàng -> label + màu
const statusMap = {
  pending: { label: "Chờ xác nhận", color: "gold" },
  shipping: { label: "Chờ lấy hàng", color: "blue" },
  delivery: { label: "Chờ giao hàng", color: "purple" },
  success: { label: "Đã thanh toán", color: "green" },
  cancelled: { label: "Đã huỷ", color: "red" },
};

const cancellableStatuses = new Set(["pending", "shipping"]);

const OrderTab = ({ status }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingOrderIds, setCancelingOrderIds] = useState(new Set());

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

  const handleCancelOrder = async (orderId) => {
    setCancelingOrderIds((prev) => {
      const next = new Set(prev);
      next.add(orderId);
      return next;
    });

    try {
      await API.post(`orders/${orderId}/cancel/`);
      message.success(`Đơn #${orderId} đã được huỷ`);
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    } catch (error) {
      console.error(error);
      const apiMessage = error?.response?.data?.error || "Hủy đơn thất bại";
      message.error(apiMessage);
    } finally {
      setCancelingOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
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

                  <Space size="middle">
                    {cancellableStatuses.has(order.status) && (
                      <Popconfirm
                        title="Xác nhận hủy đơn"
                        description={`Bạn có chắc muốn hủy đơn #${order.id}?`}
                        okText="Hủy đơn"
                        cancelText="Đóng"
                        onConfirm={() => handleCancelOrder(order.id)}
                      >
                        <Button
                          danger
                          type="primary"
                          loading={cancelingOrderIds.has(order.id)}
                        >
                          Huỷ đơn
                        </Button>
                      </Popconfirm>
                    )}

                    {/* Tổng tiền + Ngày đặt */}
                    <Space size="large">
                      <Text strong style={{ color: "#27ae60" }}>
                        {Number(order.total_price).toLocaleString()}đ
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(order.created_at).toLocaleString("vi-VN")}
                      </Text>
                    </Space>
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
                                      background: "linear-gradient(90deg,#16a34a 0%,#27ae60 100%)",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: 8,
                                      padding: "6px 18px",
                                      fontWeight: 600,
                                      fontSize: 14,
                                      boxShadow: "0 2px 8px rgba(22,163,74,0.12)",
                                      cursor: "pointer",
                                      transition: "all 0.2s",
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = "linear-gradient(90deg,#27ae60 0%,#16a34a 100%)"}
                                    onMouseOut={e => e.currentTarget.style.background = "linear-gradient(90deg,#16a34a 0%,#27ae60 100%)"}
                                  >
                                    <span style={{display:'flex',alignItems:'center',gap:8}}>
                                      <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19v-6M12 13l-4 4m4-4l4 4"/><circle cx="12" cy="7" r="4"/></svg>
                                      Khiếu nại
                                    </span>
                                  </button>
                                  {openComplaint[item.product] && (
                                    <div style={{
                                      position: 'fixed',
                                      top: 0,
                                      left: 0,
                                      width: '100vw',
                                      height: '100vh',
                                      background: 'rgba(0,0,0,0.18)',
                                      zIndex: 9999,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}>
                                      <div style={{
                                        background: "#fff",
                                        border: "1px solid #e0e0e0",
                                        boxShadow: "0 8px 32px rgba(22,163,74,0.18)",
                                        borderRadius: 18,
                                        padding: 32,
                                        maxWidth: 480,
                                        minWidth: 340,
                                        width: '100%',
                                        position: "relative",
                                        animation: 'fadeInModal 0.2s',
                                      }}>
                                        <div style={{ position: 'absolute', top: 18, right: 18, cursor: 'pointer', fontSize: 22, color: '#16a34a', fontWeight: 700 }} onClick={() => toggleComplaint(item.product)}>
                                          ×
                                        </div>
                                        <div style={{ marginBottom: 18 }}>
                                          <label style={{fontWeight:700, fontSize:17, color:'#16a34a'}}>Nội dung khiếu nại</label>
                                          <textarea
                                            rows={4}
                                            value={complaintTexts[item.product] || ""}
                                            onChange={(e) => onChangeText(item.product, e.target.value)}
                                            placeholder="Mô tả vấn đề bạn gặp phải..."
                                            style={{
                                              width: "100%",
                                              marginTop: 10,
                                              padding: 12,
                                              borderRadius: 10,
                                              border: "1.5px solid #b5e3c7",
                                              fontSize: 16,
                                              background: "#f6fff8",
                                              resize: "vertical",
                                            }}
                                          />
                                        </div>
                                        <div style={{ marginBottom: 18 }}>
                                          <label style={{fontWeight:700, fontSize:17, color:'#16a34a'}}>Ảnh/Video minh hoạ (tuỳ chọn)</label>
                                          <input
                                            type="file"
                                            multiple
                                            accept="image/*,video/*"
                                            onChange={(e) => onChangeFiles(item.product, e.target.files)}
                                            style={{ marginTop: 10, fontSize:15, padding:6, borderRadius:8, border:'1.5px solid #b5e3c7', background:'#f6fff8' }}
                                          />
                                        </div>
                                        <div style={{ display: "flex", gap: 16, marginTop: 16, justifyContent:'center' }}>
                                          <button
                                            onClick={() => sendComplaint(item.product, item.price, item.quantity)}
                                            disabled={!!sendingByProduct[item.product]}
                                            style={{
                                              background: "linear-gradient(90deg,#16a34a 0%,#27ae60 100%)",
                                              color: "#fff",
                                              border: "none",
                                              borderRadius: 10,
                                              padding: "10px 28px",
                                              fontWeight: 700,
                                              fontSize: 16,
                                              boxShadow: "0 2px 8px rgba(22,163,74,0.12)",
                                              cursor: "pointer",
                                              transition: "all 0.2s",
                                            }}
                                          >
                                            {sendingByProduct[item.product] ? "Đang gửi..." : "Gửi khiếu nại"}
                                          </button>
                                          <button
                                            onClick={() => toggleComplaint(item.product)}
                                            style={{
                                              background: "#fff",
                                              color: "#16a34a",
                                              border: "1.5px solid #16a34a",
                                              borderRadius: 10,
                                              padding: "10px 28px",
                                              fontWeight: 700,
                                              fontSize: 16,
                                              cursor: "pointer",
                                              transition: "all 0.2s",
                                            }}
                                          >
                                            Huỷ
                                          </button>
                                        </div>
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