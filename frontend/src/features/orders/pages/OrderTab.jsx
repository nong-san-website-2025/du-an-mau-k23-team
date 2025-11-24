import React, { useEffect, useState, useRef } from "react";
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
  Steps,
  Modal,
  Tooltip,
  Rate,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShoppingOutlined,
  TruckOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  ReloadOutlined,
  MessageOutlined,
  DownloadOutlined,
  StarOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import API from "../../login_register/services/api";
import { useCart } from "../../cart/services/CartContext";
import { intcomma } from "./../../../utils/format";
import NoImage from "../../../components/shared/NoImage";

const { Panel } = Collapse;
const { Text, Title } = Typography;

// Map trạng thái đơn hàng -> label + màu + icon
const statusMap = {
  pending: {
    label: "Chờ xác nhận",
    color: "gold",
    icon: <ClockCircleOutlined />,
    step: 0,
  },
  shipping: {
    label: "Chờ lấy hàng",
    color: "blue",
    icon: <ShoppingOutlined />,
    step: 1,
  },
  delivery: {
    label: "Đang giao hàng",
    color: "purple",
    icon: <TruckOutlined />,
    step: 2,
  },
  success: {
    label: "Đã giao hàng",
    color: "green",
    icon: <CheckCircleOutlined />,
    step: 3,
  },
  cancelled: {
    label: "Đã huỷ",
    color: "red",
    icon: <CloseCircleOutlined />,
    step: -1,
  },
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

// Order Timeline Component
const OrderTimeline = ({ status, orderId }) => {
  const statusInfo = statusMap[status];

  if (status === "cancelled") {
    return (
      <div
        style={{
          padding: "16px 20px",
          background: "#fff1f0",
          borderRadius: 8,
          border: "1px solid #ffccc7",
        }}
      >
        <Space>
          <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />
          <Text strong style={{ color: "#ff4d4f" }}>
            Đơn hàng đã bị hủy
          </Text>
        </Space>
      </div>
    );
  }

  const steps = [
    { title: "Chờ xác nhận", icon: <ClockCircleOutlined /> },
    { title: "Chờ lấy hàng", icon: <ShoppingOutlined /> },
    { title: "Đang giao", icon: <TruckOutlined /> },
    { title: "Hoàn thành", icon: <CheckCircleOutlined /> },
  ];

  return (
    <div
      style={{ padding: "20px 16px", background: "#fafafa", borderRadius: 8 }}
    >
      <Steps
        current={statusInfo.step}
        size="small"
        items={steps.map((step, idx) => ({
          title: step.title,
          icon: step.icon,
          status:
            idx < statusInfo.step
              ? "finish"
              : idx === statusInfo.step
                ? "process"
                : "wait",
        }))}
      />
      {orderId && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "#fff",
            borderRadius: 6,
            border: "1px solid #e8e8e8",
          }}
        >
          <Space>
            <Text type="secondary">Mã vận đơn:</Text>
            <Text strong copyable={{ tooltips: ["Sao chép", "Đã sao chép!"] }}>
              VN{String(orderId).padStart(8, "0")}GHN
            </Text>
          </Space>
        </div>
      )}
    </div>
  );
};

const OrderTab = ({ status }) => {
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingOrderIds, setCancelingOrderIds] = useState(new Set());
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Complaint UI state per product
  const [openComplaint, setOpenComplaint] = useState({});
  const [complaintTexts, setComplaintTexts] = useState({});
  const [complaintFiles, setComplaintFiles] = useState({});
  const [sendingByProduct, setSendingByProduct] = useState({});
  const [activePanels, setActivePanels] = useState([]);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingProduct, setRatingProduct] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const scrollRef = useRef(null);

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

      setComplaintTexts((prev) => ({ ...prev, [productId]: "" }));
      setComplaintFiles((prev) => ({ ...prev, [productId]: [] }));
      setOpenComplaint((prev) => ({ ...prev, [productId]: false }));
      setSuccessModalVisible(true);
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

  const handleReorder = async (order) => {
    try {
      const items = order.items || [];
      let successCount = 0;

      for (const item of items) {
        const productId = item.product;
        const quantity = item.quantity || 1;
        const productInfo = {
          id: productId,
          name: item.product_name,
          price: item.price,
          image: item.product_image,
          store: item.store,
          store_name: item.store_name,
        };

        await addToCart(productId, quantity, productInfo);
        successCount++;
      }

      if (successCount > 0) {
        message.success(`Đã thêm ${successCount} sản phẩm vào giỏ hàng!`);
      } else {
        message.warning("Không có sản phẩm nào để thêm vào giỏ hàng");
      }
    } catch (error) {
      console.error("Lỗi khi mua lại đơn hàng:", error);
      message.error("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng");
    }
  };

  const handleRating = (product) => {
    setRatingProduct(product);
    setRatingValue(0);
    setRatingComment("");
    setRatingModalVisible(true);
  };

  const submitRating = async () => {
    if (!ratingProduct || ratingValue === 0) {
      message.warning("Vui lòng chọn số sao đánh giá");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      message.info("Bạn cần đăng nhập để đánh giá sản phẩm");
      return;
    }

    try {
      setSubmittingRating(true);
      const response = await fetch("http://localhost:8000/api/reviews/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product: ratingProduct.product,
          rating: ratingValue,
          comment: ratingComment.trim(),
        }),
      });

      if (!response.ok) throw new Error(`Lỗi API: ${response.status}`);

      message.success("Đánh giá sản phẩm thành công!");
      setRatingModalVisible(false);
      setRatingProduct(null);
      setRatingValue(0);
      setRatingComment("");
    } catch (error) {
      console.error("Lỗi khi đánh giá:", error);
      message.error("Gửi đánh giá thất bại!");
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleExportInvoice = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        message.info("Bạn cần đăng nhập để xuất hóa đơn");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/orders/${orderId}/invoice/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error(`Lỗi API: ${response.status}`);

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hoa-don-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      message.success("Xuất hóa đơn thành công!");
    } catch (error) {
      console.error("Lỗi khi xuất hóa đơn:", error);
      message.error("Xuất hóa đơn thất bại!");
    }
  };

  const handleChatWithShop = (order) => {
    // Get seller info from the first item (assuming all items in order are from same seller)
    const firstItem = order.items?.[0];
    if (!firstItem) {
      message.warning("Không tìm thấy thông tin người bán");
      return;
    }

    const sellerId = firstItem.store?.id || firstItem.seller_id;
    const sellerName =
      firstItem.store_name ||
      firstItem.store?.store_name ||
      firstItem.store?.name ||
      "Shop";
    const sellerImage = firstItem.store?.image || firstItem.store?.logo;

    if (!sellerId) {
      message.warning("Không tìm thấy thông tin người bán");
      return;
    }

    // Dispatch custom event to open chat
    const chatEvent = new CustomEvent("chat:open", {
      detail: {
        sellerId: sellerId,
        sellerName: sellerName,
        sellerImage: sellerImage,
      },
    });
    window.dispatchEvent(chatEvent);

    message.success(`Đang mở chat với ${sellerName}`);
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div
        className="flex justify-center items-center min-h-[400px]"
        style={{ flexDirection: "column" }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size="small">
              <Text style={{ fontSize: 16, color: "#8c8c8c" }}>
                Chưa có đơn hàng nào
              </Text>
              <Text type="secondary" style={{ fontSize: 14 }}>
                Các đơn hàng của bạn sẽ hiển thị tại đây
              </Text>
            </Space>
          }
        />
      </div>
    );
  }

  const cardStyle = {
    background: "#fafafa",
    borderRadius: 12,
    padding: "20px",
    border: "1px solid #f0f0f0",
    minHeight: "100%",
  };

  const sectionTitleStyle = {
    fontWeight: 600,
    fontSize: 16,
    marginBottom: 16,
    color: "#262626",
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const isMobile = windowWidth < 576;

  return (
    <div
      style={{
        width: "100%",
        background: "#f5f5f5",
        minHeight: "100vh",
        paddingTop: 16,
      }}
    >
      <div
        ref={scrollRef}
        style={{
          maxWidth: isMobile ? "100%" : 1200,
          margin: "0 auto",
          paddingBottom: 32,
          paddingLeft: isMobile ? 16 : 24,
          paddingRight: isMobile ? 16 : 24,
        }}
      >
        <Collapse
          accordion
          bordered={false}
          style={{ background: "transparent" }}
          onChange={(keys) => {
            setActivePanels(
              Array.isArray(keys) ? keys.map(String) : [String(keys)]
            );
          }}
        >
          {orders.map((order) => {
            const orderStatus = statusMap[order.status];
            const canCancel = cancellableStatuses.has(order.status);

            return (
              <Panel
                key={order.id}
                header={
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <Space size="middle" style={{ flexWrap: "wrap" }}>
                      <Space>
                        {orderStatus.icon}
                        <Text strong style={{ fontSize: isMobile ? 14 : 15 }}>
                          Đơn hàng #{order.id}
                        </Text>
                      </Space>
                      <Tag
                        color={orderStatus.color}
                        style={{
                          fontSize: 13,
                          padding: "4px 12px",
                          borderRadius: 6,
                        }}
                        icon={orderStatus.icon}
                      >
                        {orderStatus.label}
                      </Tag>
                    </Space>

                    <Space
                      size="middle"
                      style={{
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                        alignItems: "center",
                      }}
                    >
                      {canCancel && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <Popconfirm
                            title="Xác nhận hủy đơn"
                            description={`Bạn có chắc muốn hủy đơn #${order.id}?`}
                            okText="Hủy đơn"
                            cancelText="Đóng"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleCancelOrder(order.id)}
                          >
                            <Button
                              danger
                              size={isMobile ? "small" : "middle"}
                              loading={cancelingOrderIds.has(order.id)}
                              icon={<CloseCircleOutlined />}
                              style={{
                                backgroundColor: "#ff4d4f",
                                color: "#fff",
                              }}
                            >
                              Hủy đơn
                            </Button>
                          </Popconfirm>
                        </div>
                      )}

                      <div style={{ textAlign: "right" }}>
                        <Text
                          strong
                          style={{
                            color: "#52c41a",
                            display: "block",
                            fontSize: isMobile ? 15 : 17,
                            fontWeight: 600,
                          }}
                        >
                          {intcomma(order.total_price)}đ
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(order.created_at).toLocaleString("vi-VN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </div>
                    </Space>
                  </div>
                }
                style={{
                  background: "#ffffff",
                  borderRadius: 16,
                  marginBottom: 20,
                  border: "1px solid #e8e8e8",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                {/* Order Timeline */}
                <OrderTimeline status={order.status} orderId={order.id} />

                <Divider style={{ margin: "24px 0" }} />

                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={10}>
                    <div style={cardStyle}>
                      <h3 style={sectionTitleStyle}>
                        <MessageOutlined style={{ color: "#1890ff" }} />
                        Thông tin người nhận
                      </h3>
                      <Descriptions
                        column={1}
                        size="small"
                        colon={false}
                        labelStyle={{
                          width: isMobile ? 100 : 120,
                          fontWeight: 600,
                          color: "#595959",
                          marginBottom: 8,
                          fontSize: 14,
                        }}
                        contentStyle={{
                          color: "#262626",
                          fontSize: 14,
                        }}
                      >
                        <Descriptions.Item label="Người nhận">
                          {order.customer_name || "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">
                          {order.customer_phone || "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ">
                          {order.address || "—"}
                        </Descriptions.Item>
                        {order.note && (
                          <Descriptions.Item label="Ghi chú">
                            <Text italic style={{ color: "#8c8c8c" }}>
                              {order.note}
                            </Text>
                          </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Thanh toán">
                          <Tag color="blue">{order.payment_method || "—"}</Tag>
                        </Descriptions.Item>
                      </Descriptions>
                    </div>
                  </Col>

                  <Col xs={24} lg={14}>
                    <div style={cardStyle}>
                      <h3 style={sectionTitleStyle}>
                        <ShoppingOutlined style={{ color: "#52c41a" }} />
                        Sản phẩm ({order.items?.length || 0})
                      </h3>
                      <List
                        dataSource={order.items || []}
                        rowKey={(item) =>
                          `${order.id}-${item.product}-${item.price}`
                        }
                        split
                        locale={{ emptyText: "Không có sản phẩm" }}
                        renderItem={(item) => {
                          const productTotal =
                            Number(item.price || 0) *
                            Number(item.quantity || 0);
                          const imageSrc = resolveProductImage(
                            item.product_image || ""
                          );
                          const complaintOpen = openComplaint[item.product];

                          return (
                            <List.Item
                              key={`${order.id}-${item.product}`}
                              style={{
                                padding: "16px 12px",
                                background: "#fff",
                                marginBottom: 12,
                                borderRadius: 8,
                                border: "1px solid #f0f0f0",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: 16,
                                  width: "100%",
                                  alignItems: "flex-start",
                                }}
                              >
                                {imageSrc ? (
                                  <Image
                                    src={imageSrc}
                                    alt={item.product_name}
                                    width={isMobile ? 70 : 80}
                                    height={isMobile ? 70 : 80}
                                    style={{
                                      borderRadius: 12,
                                      objectFit: "cover",
                                      background: "#fafafa",
                                      border: "1px solid #f0f0f0",
                                    }}
                                    preview={true}
                                  />
                                ) : (
                                  <NoImage
                                    width={isMobile ? 70 : 80}
                                    height={isMobile ? 70 : 80}
                                    text="Không có hình"
                                  />
                                )}

                                <div style={{ flex: 1 }}>
                                  <Text
                                    strong
                                    style={{
                                      display: "block",
                                      marginBottom: 6,
                                      fontSize: isMobile ? 14 : 15,
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    {item.product_name}
                                  </Text>
                                  <Space
                                    direction="vertical"
                                    size={4}
                                    style={{ width: "100%" }}
                                  >
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: isMobile ? 13 : 14 }}
                                    >
                                      {intcomma(item.price)}đ × {item.quantity}
                                    </Text>
                                    {item.category_name && (
                                      <Tag
                                        color="blue"
                                        style={{ fontSize: 12 }}
                                      >
                                        {item.category_name}
                                      </Tag>
                                    )}

                                    <Text
                                      strong
                                      style={{
                                        fontSize: isMobile ? 15 : 16,
                                        display: "block",
                                        marginTop: 4,
                                      }}
                                      color="black"
                                    >
                                      Thành tiền: {intcomma(productTotal)}đ
                                    </Text>
                                  </Space>

                                  {status === "completed" && (
                                    <Space
                                      size="small"
                                      style={{ marginTop: 12 }}
                                    >
                                      <Button
                                        size="small"
                                        type="primary"
                                        ghost
                                        icon={<WarningOutlined />}
                                        onClick={() =>
                                          toggleComplaint(item.product)
                                        }
                                      >
                                        Khiếu nại
                                      </Button>
                                      <Tooltip title="Đánh giá sản phẩm">
                                        <Button
                                          size="small"
                                          icon={<StarOutlined />}
                                          onClick={() => handleRating(item)}
                                        >
                                          Đánh giá
                                        </Button>
                                      </Tooltip>
                                    </Space>
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
                                    background: "rgba(0,0,0,0.5)",
                                    zIndex: 9999,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 16,
                                    backdropFilter: "blur(4px)",
                                  }}
                                  onClick={() => toggleComplaint(item.product)}
                                >
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      background: "#fff",
                                      boxShadow: "0 12px 48px rgba(0,0,0,0.2)",
                                      borderRadius: 20,
                                      padding: isMobile ? 24 : 40,
                                      maxWidth: isMobile ? "92%" : 520,
                                      width: "100%",
                                      position: "relative",
                                      maxHeight: "90vh",
                                      overflowY: "auto",
                                    }}
                                  >
                                    <button
                                      style={{
                                        position: "absolute",
                                        top: 16,
                                        right: 16,
                                        cursor: "pointer",
                                        fontSize: 24,
                                        color: "#8c8c8c",
                                        fontWeight: 400,
                                        border: "none",
                                        background: "#f5f5f5",
                                        width: 32,
                                        height: 32,
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.2s",
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.background = "#e8e8e8";
                                        e.target.style.color = "#262626";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.background = "#f5f5f5";
                                        e.target.style.color = "#8c8c8c";
                                      }}
                                      onClick={() =>
                                        toggleComplaint(item.product)
                                      }
                                    >
                                      ×
                                    </button>

                                    <Title
                                      level={4}
                                      style={{
                                        marginBottom: 24,
                                        color: "#262626",
                                      }}
                                    >
                                      Gửi khiếu nại sản phẩm
                                    </Title>

                                    <div style={{ marginBottom: 20 }}>
                                      <label
                                        style={{
                                          fontWeight: 600,
                                          fontSize: 15,
                                          color: "#262626",
                                          display: "block",
                                          marginBottom: 8,
                                        }}
                                      >
                                        Nội dung khiếu nại{" "}
                                        <Text type="danger">*</Text>
                                      </label>
                                      <textarea
                                        rows={5}
                                        value={
                                          complaintTexts[item.product] || ""
                                        }
                                        onChange={(event) =>
                                          onChangeText(
                                            item.product,
                                            event.target.value
                                          )
                                        }
                                        placeholder="Mô tả chi tiết vấn đề bạn gặp phải với sản phẩm này..."
                                        style={{
                                          width: "100%",
                                          padding: 12,
                                          borderRadius: 8,
                                          border: "1.5px solid #d9d9d9",
                                          fontSize: 14,
                                          background: "#fafafa",
                                          resize: "vertical",
                                          outline: "none",
                                          fontFamily: "inherit",
                                          transition: "all 0.2s",
                                        }}
                                        onFocus={(e) => {
                                          e.target.style.borderColor =
                                            "#1890ff";
                                          e.target.style.background = "#fff";
                                        }}
                                        onBlur={(e) => {
                                          e.target.style.borderColor =
                                            "#d9d9d9";
                                          e.target.style.background = "#fafafa";
                                        }}
                                      />
                                    </div>

                                    <div style={{ marginBottom: 24 }}>
                                      <label
                                        style={{
                                          fontWeight: 600,
                                          fontSize: 15,
                                          color: "#262626",
                                          display: "block",
                                          marginBottom: 8,
                                        }}
                                      >
                                        Ảnh/Video minh chứng
                                        <Text
                                          type="secondary"
                                          style={{
                                            fontSize: 13,
                                            fontWeight: 400,
                                            marginLeft: 8,
                                          }}
                                        >
                                          (không bắt buộc)
                                        </Text>
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
                                          fontSize: 14,
                                          padding: 10,
                                          borderRadius: 8,
                                          border: "1.5px solid #d9d9d9",
                                          background: "#fafafa",
                                          width: "100%",
                                          cursor: "pointer",
                                        }}
                                      />
                                      {complaintFiles[item.product]?.length >
                                        0 && (
                                        <Text
                                          type="secondary"
                                          style={{
                                            fontSize: 12,
                                            marginTop: 8,
                                            display: "block",
                                          }}
                                        >
                                          Đã chọn{" "}
                                          {complaintFiles[item.product].length}{" "}
                                          tệp
                                        </Text>
                                      )}
                                    </div>

                                    <Space
                                      size="middle"
                                      style={{
                                        width: "100%",
                                        justifyContent: "flex-end",
                                      }}
                                    >
                                      <Button
                                        onClick={() =>
                                          toggleComplaint(item.product)
                                        }
                                        size="large"
                                      >
                                        Hủy
                                      </Button>
                                      <Button
                                        type="primary"
                                        size="large"
                                        onClick={() =>
                                          sendComplaint(
                                            item.product,
                                            item.price,
                                            item.quantity
                                          )
                                        }
                                        loading={
                                          !!sendingByProduct[item.product]
                                        }
                                        icon={<MessageOutlined />}
                                      >
                                        Gửi khiếu nại
                                      </Button>
                                    </Space>
                                  </div>
                                </div>
                              )}
                            </List.Item>
                          );
                        }}
                      />
                      <Divider style={{ margin: "16px 0" }} />
                      <div
                        style={{
                          textAlign: "right",
                          padding: "12px 16px",
                          background: "#f0f9ff",
                          borderRadius: 8,
                        }}
                      >
                        <Space direction="vertical" size={4} align="end">
                          {order.shipping_fee > 0 && (
                            <Text style={{ fontSize: 14, color: "#595959" }}>
                              Phí vận chuyển:{" "}
                              <Text
                                style={{ color: "#262626", fontWeight: 500 }}
                              >
                                {intcomma(order.shipping_fee)}đ
                              </Text>
                            </Text>
                          )}
                          <Text style={{ fontSize: 14, color: "#595959" }}>
                            Tổng số tiền:
                          </Text>
                          <Text
                            strong
                            style={{
                              fontSize: isMobile ? 18 : 20,
                              color: "#52c41a",
                            }}
                          >
                            {intcomma(order.total_price)}đ
                          </Text>
                        </Space>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Action Buttons */}
                <Divider style={{ margin: "24px 0" }} />
                <div style={{ textAlign: "right" }}>
                  <Space size="middle" wrap>
                    <Tooltip title="Liên hệ người bán">
                      <Button
                        icon={<MessageOutlined />}
                        onClick={() => handleChatWithShop(order)}
                      >
                        Chat với Shop
                      </Button>
                    </Tooltip>
                    {status === "completed" && (
                      <>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={() => handleReorder(order)}
                        >
                          Mua lại
                        </Button>
                      </>
                    )}
                  </Space>
                </div>
              </Panel>
            );
          })}
        </Collapse>
      </div>

      {/* Success Modal */}
      <Modal
        open={successModalVisible}
        onCancel={() => setSuccessModalVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setSuccessModalVisible(false)}
            size="large"
          >
            Đã hiểu
          </Button>,
        ]}
        centered
        width={isMobile ? "90%" : 480}
      >
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <CheckCircleOutlined
            style={{
              fontSize: 64,
              color: "#52c41a",
              marginBottom: 16,
            }}
          />
          <Title level={4} style={{ marginBottom: 12 }}>
            Gửi khiếu nại thành công!
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Chúng tôi đã nhận được khiếu nại của bạn và sẽ xử lý trong vòng
            24-48 giờ. Bạn sẽ nhận được thông báo qua email khi có kết quả.
          </Text>
        </div>
      </Modal>

      {/* Rating Modal */}
      <Modal
        open={ratingModalVisible}
        onCancel={() => setRatingModalVisible(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setRatingModalVisible(false)}
            size="large"
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={submitRating}
            loading={submittingRating}
            size="large"
          >
            Gửi đánh giá
          </Button>,
        ]}
        centered
        width={isMobile ? "90%" : 500}
        title="Đánh giá sản phẩm"
      >
        {ratingProduct && (
          <div style={{ padding: "20px 0" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Image
                src={resolveProductImage(ratingProduct.product_image)}
                alt={ratingProduct.product_name}
                width={60}
                height={60}
                style={{
                  borderRadius: 8,
                  objectFit: "cover",
                  marginRight: 16,
                  border: "1px solid #f0f0f0",
                }}
              />
              <div>
                <Text strong style={{ fontSize: 16, display: "block" }}>
                  {ratingProduct.product_name}
                </Text>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {intcomma(ratingProduct.price)}đ × {ratingProduct.quantity}
                </Text>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <Text
                strong
                style={{ fontSize: 15, display: "block", marginBottom: 8 }}
              >
                Đánh giá của bạn <Text type="danger">*</Text>
              </Text>
              <Rate
                value={ratingValue}
                onChange={setRatingValue}
                style={{ fontSize: 24 }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <Text
                strong
                style={{ fontSize: 15, display: "block", marginBottom: 8 }}
              >
                Nhận xét (không bắt buộc)
              </Text>
              <textarea
                rows={4}
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 8,
                  border: "1.5px solid #d9d9d9",
                  fontSize: 14,
                  background: "#fafafa",
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#1890ff";
                  e.target.style.background = "#fff";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d9d9d9";
                  e.target.style.background = "#fafafa";
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderTab;
