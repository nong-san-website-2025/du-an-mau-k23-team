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
  Descriptions,
  Row,
  Col,
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

const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN");

const resolveProductImage = (imagePath = "") => {
  if (!imagePath) return "";
  if (imagePath.startsWith("/")) {
    return `http://localhost:8000${imagePath}`;
  }
  if (imagePath.startsWith("http")) {
    return imagePath;
  }
  return `http://localhost:8000/media/${imagePath}`;
};

const OrderTab = ({ status }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingOrderIds, setCancelingOrderIds] = useState(new Set());

  // Complaint UI state per product
  const [openComplaint, setOpenComplaint] = useState({}); // { [productId]: boolean }
  const [complaintTexts, setComplaintTexts] = useState({}); // { [productId]: string }
  const [complaintFiles, setComplaintFiles] = useState({}); // { [productId]: File[] }
  const [sendingByProduct, setSendingByProduct] = useState({}); // { [productId]: boolean }
  const [activePanels, setActivePanels] = useState([]);

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

      // Gửi thêm số lượng và giá để backend xử lý hoàn tiền chính xác
      if (quantity != null) formData.append("quantity", String(quantity));
      if (unitPrice != null) formData.append("unit_price", String(unitPrice));
      (complaintFiles[productId] || []).forEach((file) =>
        formData.append("media", file)
      );

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
    } catch (error) {
      console.error(error);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Empty description="Không có đơn hàng nào" />
      </div>
    );
  }

  const cardStyle = {
    background: "#f9fafb",
    borderRadius: 12,
    padding: "16px 20px",
    border: "1px solid #eef2f7",
    minHeight: "100%",
  };

  const sectionTitleStyle = {
    fontWeight: 600,
    fontSize: 16,
    marginBottom: 12,
    color: "#1f2937",
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 24 }}>
        <Collapse
          accordion
          bordered={false}
          style={{ background: "transparent" }}
          onChange={(keys) => {
            // keys là string hoặc string[] tuỳ trường hợp, nhưng với accordion thì thường là string[]
            setActivePanels(
              Array.isArray(keys) ? keys.map(String) : [String(keys)]
            );
          }}
        >
          {orders.map((order) => (
            <Panel
              key={order.id}
              header={
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <Space size="middle" style={{ flexWrap: "wrap" }}>
                    <Text strong>Mã đơn: #{order.id}</Text>
                    <Tag
                      color={statusMap[order.status]?.color || "default"}
                      style={{ fontSize: 12 }}
                    >
                      {statusMap[order.status]?.label || "Không xác định"}
                    </Tag>
                  </Space>

                  <Space
                    size="middle"
                    style={{ flexWrap: "wrap", justifyContent: "flex-end" }}
                  >
                    {cancellableStatuses.has(order.status) &&
                      activePanels.includes(String(order.id)) && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation(); // 👈 Ngăn sự kiện lan lên header
                          }}
                        >
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
                        </div>
                      )}

                    <div style={{ textAlign: "right" }}>
                      <Text
                        strong
                        style={{ color: "#27ae60", display: "block" }}
                      >
                        {formatCurrency(order.total_price)}đ
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(order.created_at).toLocaleString("vi-VN")}
                      </Text>
                    </div>
                  </Space>
                </div>
              }
              style={{
                background: "#ffffff",
                borderRadius: 12,
                marginBottom: 16,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={10}>
                  <div style={cardStyle}>
                    <h3 style={sectionTitleStyle}>Thông tin người nhận</h3>
                    <Descriptions
                      column={1}
                      size="small"
                      colon={false}
                      labelStyle={{
                        width: 110,
                        fontWeight: 600,
                        color: "#4b5563",
                        marginBottom: 4,
                      }}
                      contentStyle={{ color: "#111827" }}
                    >
                      <Descriptions.Item label="Người nhận">
                        {order.customer_name || "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="SĐT">
                        {order.customer_phone || "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Địa chỉ">
                        {order.address || "—"}
                      </Descriptions.Item>
                      {order.note && (
                        <Descriptions.Item label="Ghi chú">
                          {order.note}
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="Thanh toán">
                        {order.payment_method || "—"}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                </Col>

                <Col xs={24} lg={14}>
                  <div style={cardStyle}>
                    <h3 style={sectionTitleStyle}>Sản phẩm</h3>
                    <List
                      dataSource={order.items || []}
                      rowKey={(item) =>
                        `${order.id}-${item.product}-${item.price}`
                      }
                      split
                      locale={{ emptyText: "Không có sản phẩm" }}
                      renderItem={(item) => {
                        const productTotal =
                          Number(item.price || 0) * Number(item.quantity || 0);
                        const imageSrc = resolveProductImage(
                          item.product_image || ""
                        );
                        const complaintOpen = openComplaint[item.product];

                        return (
                          <List.Item
                            key={`${order.id}-${item.product}`}
                            style={{ padding: "12px 0" }}
                            extra={
                              <Text
                                strong
                                style={{
                                  color: "#27ae60",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {formatCurrency(productTotal)}đ
                              </Text>
                            }
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: 12,
                                width: "100%",
                                alignItems: "flex-start",
                              }}
                            >
                              <Image
                                src={imageSrc}
                                alt={item.product_name}
                                width={56}
                                height={56}
                                style={{
                                  borderRadius: 10,
                                  objectFit: "cover",
                                  background: "#fff",
                                }}
                                preview={false}
                              />
                              <div style={{ flex: 1 }}>
                                <Text
                                  strong
                                  style={{
                                    display: "block",
                                    marginBottom: 4,
                                    fontSize: 15,
                                  }}
                                >
                                  {item.product_name}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                  {formatCurrency(item.price)}đ x{" "}
                                  {item.quantity}
                                </Text>
                                {status === "completed" && (
                                  <Button
                                    size="small"
                                    type="primary"
                                    ghost
                                    style={{ marginTop: 10 }}
                                    onClick={() =>
                                      toggleComplaint(item.product)
                                    }
                                  >
                                    Khiếu nại
                                  </Button>
                                )}
                              </div>
                            </div>

                            {status === "completed" && complaintOpen && (
                              <div
                                style={{
                                  position: "fixed",
                                  top: 0,
                                  left: 0,
                                  width: "100vw",
                                  height: "100vh",
                                  background: "rgba(0,0,0,0.18)",
                                  zIndex: 9999,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: 16,
                                }}
                              >
                                <div
                                  style={{
                                    background: "#fff",
                                    border: "1px solid #e0e0e0",
                                    boxShadow:
                                      "0 8px 32px rgba(22,163,74,0.18)",
                                    borderRadius: 18,
                                    padding: 32,
                                    maxWidth: 480,
                                    width: "100%",
                                    position: "relative",
                                  }}
                                >
                                  <button
                                    style={{
                                      position: "absolute",
                                      top: 16,
                                      right: 16,
                                      cursor: "pointer",
                                      fontSize: 20,
                                      color: "#16a34a",
                                      fontWeight: 700,
                                      border: "none",
                                      background: "transparent",
                                    }}
                                    onClick={() =>
                                      toggleComplaint(item.product)
                                    }
                                  >
                                    ×
                                  </button>

                                  <div style={{ marginBottom: 18 }}>
                                    <label
                                      style={{
                                        fontWeight: 700,
                                        fontSize: 17,
                                        color: "#16a34a",
                                      }}
                                    >
                                      Nội dung khiếu nại
                                    </label>
                                    <textarea
                                      rows={4}
                                      value={complaintTexts[item.product] || ""}
                                      onChange={(event) =>
                                        onChangeText(
                                          item.product,
                                          event.target.value
                                        )
                                      }
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
                                        outline: "none",
                                      }}
                                    />
                                  </div>

                                  <div style={{ marginBottom: 18 }}>
                                    <label
                                      style={{
                                        fontWeight: 700,
                                        fontSize: 17,
                                        color: "#16a34a",
                                      }}
                                    >
                                      Ảnh/Video minh hoạ (tuỳ chọn)
                                    </label>
                                    <input
                                      type="file"
                                      multiple
                                      accept="image/*,video/*"
                                      onChange={(event) =>
                                        onChangeFiles(
                                          item.product,
                                          event.target.files
                                        )
                                      }
                                      style={{
                                        marginTop: 10,
                                        fontSize: 15,
                                        padding: 6,
                                        borderRadius: 8,
                                        border: "1.5px solid #b5e3c7",
                                        background: "#f6fff8",
                                      }}
                                    />
                                  </div>

                                  <Space
                                    size="middle"
                                    style={{
                                      width: "100%",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Button
                                      type="primary"
                                      onClick={() =>
                                        sendComplaint(
                                          item.product,
                                          item.price,
                                          item.quantity
                                        )
                                      }
                                      loading={!!sendingByProduct[item.product]}
                                    >
                                      {sendingByProduct[item.product]
                                        ? "Đang gửi..."
                                        : "Gửi khiếu nại"}
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        toggleComplaint(item.product)
                                      }
                                    >
                                      Huỷ
                                    </Button>
                                  </Space>
                                </div>
                              </div>
                            )}
                          </List.Item>
                        );
                      }}
                    />
                    <Divider style={{ margin: "12px 0" }} />
                    <div style={{ textAlign: "right" }}>
                      <Text strong style={{ fontSize: 16, color: "#27ae60" }}>
                        Tổng tiền: {formatCurrency(order.total_price)}đ
                      </Text>
                    </div>
                  </div>
                </Col>
              </Row>
            </Panel>
          ))}
        </Collapse>
      </div>
    </div>
  );
};

export default OrderTab;
