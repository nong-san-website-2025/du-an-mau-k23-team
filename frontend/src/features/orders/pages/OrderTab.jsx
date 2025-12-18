// OrderTab.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Collapse, Tag, Typography, Skeleton, Empty, Space, Button, Popconfirm, message, Row, Col, Divider, Tooltip } from "antd";
import { CloseCircleOutlined, MessageOutlined, ReloadOutlined } from "@ant-design/icons";
import API from "../../login_register/services/api";
import { useCart } from "../../cart/services/CartContext";
import { intcomma } from "./../../../utils/format";

// Imports from separated components
import { statusMap, cancellableStatuses } from "../utils";
import OrderTimeline from "../components/OrderTimeline";
import OrderInfo from "../components/OrderInfo";
import ProductList from "../components/ProductList";
import RatingModal from "../components/RatingModal";

const { Panel } = Collapse;
const { Text } = Typography;

const OrderTab = ({ status }) => {
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingOrderIds, setCancelingOrderIds] = useState(new Set());
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // --- 1. STATE CHO KHIẾU NẠI (COMPLAINT) ---
  const [activeComplaintItem, setActiveComplaintItem] = useState(null); // ID của OrderItem đang mở form
  const [complaintText, setComplaintText] = useState("");
  const [complaintFiles, setComplaintFiles] = useState([]);
  const [isSendingComplaint, setIsSendingComplaint] = useState(false);

  // --- 2. STATE CHO ĐÁNH GIÁ (RATING) ---
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingProduct, setRatingProduct] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratedProducts, setRatedProducts] = useState(new Set());

  // Layout Helpers
  const isMobile = windowWidth < 576;
  const cardStyle = { background: "#fafafa", borderRadius: 12, padding: "20px", border: "1px solid #f0f0f0", minHeight: "100%" };
  const sectionTitleStyle = { fontWeight: 600, fontSize: 16, marginBottom: 16, color: "#262626", display: "flex", alignItems: "center", gap: 8 };

  // --- 3. HÀM FETCH ĐƠN HÀNG (Tách ra để tái sử dụng) ---
  const fetchOrders = useCallback(() => {
    setLoading(true);
    // XÓA DÒNG NÀY: const statusParam = status === "completed" ? "success" : status;

    // Sử dụng trực tiếp status từ props
    API.get(`orders/?status=${status}`)
      .then((res) => {
        setOrders(res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      })
      .catch((err) => {
        console.error(err);
        message.error("Không thể tải đơn hàng");
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- 4. LOGIC KHIẾU NẠI ---
  const toggleComplaint = (orderItemId) => {
    setActiveComplaintItem(orderItemId);
    // Reset form khi mở mới hoặc đóng
    if (orderItemId) {
      setComplaintText("");
      setComplaintFiles([]);
    }
  };

  const handleChangeText = (val) => setComplaintText(val);
  const handleChangeFiles = (files) => setComplaintFiles(files);

  const handleSendComplaint = async (orderItemId) => {
    if (!complaintText.trim()) return message.warning("Vui lòng nhập lý do");

    setIsSendingComplaint(true);
    try {
      const formData = new FormData();
      // Backend yêu cầu: order_item_id
      formData.append("order_item_id", orderItemId);
      formData.append("reason", complaintText);

      // Append files
      if (complaintFiles && complaintFiles.length > 0) {
        for (let i = 0; i < complaintFiles.length; i++) {
          formData.append("media", complaintFiles[i]);
        }
      }

      // Gọi API ComplaintViewSet
      await API.post("complaints/", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      message.success("Gửi yêu cầu hoàn tiền thành công!");
      toggleComplaint(null); // Đóng form

      // Gọi lại API lấy đơn hàng để cập nhật trạng thái (Tag: Đang yêu cầu hoàn tiền)
      fetchOrders();

    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error || "Gửi khiếu nại thất bại";
      message.error(errorMsg);
    } finally {
      setIsSendingComplaint(false);
    }
  };

  // --- 5. LOGIC HỦY ĐƠN & MUA LẠI ---
  const handleCancelOrder = async (orderId) => {
    setCancelingOrderIds((prev) => new Set(prev).add(orderId));
    try {
      await API.post(`orders/${orderId}/cancel/`);
      message.success(`Đơn #${orderId} đã được huỷ`);
      // Update local state để không cần load lại trang
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    } catch (error) {
      message.error(error?.response?.data?.error || "Hủy đơn thất bại");
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
        await addToCart(item.product, item.quantity || 1, {
          id: item.product, // Product ID
          name: item.product_name,
          price: item.price,
          image: item.product_image,
          store: item.store,
          store_name: item.store_name
        });
        successCount++;
      }
      successCount > 0 ? message.success(`Đã thêm ${successCount} sản phẩm vào giỏ hàng!`) : message.warning("Không có sản phẩm nào");
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra khi thêm vào giỏ hàng");
    }
  };

  // --- 6. LOGIC ĐÁNH GIÁ ---
  const handleRating = (item) => {
    // Lưu ý: item ở đây là OrderItem, cần lấy product ID từ nó
    setRatingProduct({
      product: item.product, // Product ID
      name: item.product_name,
      image: item.product_image
    });
    setRatingValue(0);
    setRatingComment("");
    setRatingModalVisible(true);
  };

  const submitRating = async () => {
    if (!ratingProduct || ratingValue === 0) {
      return message.warning("Vui lòng chọn số sao để đánh giá!");
    }

    try {
      setSubmittingRating(true);
      await API.post("reviews/add/", {
        product: ratingProduct.product,
        rating: ratingValue,
        comment: ratingComment.trim(),
      });

      message.success("Gửi đánh giá thành công!");
      setRatedProducts((prev) => new Set([...prev, ratingProduct.product]));
      setRatingModalVisible(false);
    } catch (error) {
      console.error("Lỗi đánh giá:", error);
      message.error(error.response?.data?.detail || "Gửi đánh giá thất bại.");
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleChatWithShop = (order) => {
    const firstItem = order.items?.[0];
    if (!firstItem) return message.warning("Không tìm thấy thông tin shop");
    // Logic tìm sellerId tùy thuộc vào data trả về từ API OrderDetail
    // Với serializer mới, có thể cần check lại field store/seller
    const sellerId = firstItem.store?.id || firstItem.product_seller_id;

    if (!sellerId) {
      // Fallback nếu API OrderItem chưa trả về seller_id, thử lấy từ product detail (nếu có)
      // Hoặc bắn event chung
      message.info("Chức năng chat đang được cập nhật cho đơn hàng này");
      return;
    }

    window.dispatchEvent(new CustomEvent("chat:open", {
      detail: { sellerId, sellerName: firstItem.store_name || "Shop", sellerImage: firstItem.store?.image }
    }));
  };

  // --- RENDER ---
  if (loading) return <div className="flex justify-center items-center min-h-[300px]"><Skeleton active paragraph={{ rows: 4 }} /></div>;
  if (!orders.length) return <div className="flex justify-center items-center min-h-[400px]" style={{ flexDirection: "column" }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đơn hàng nào" /></div>;

  return (
    <div style={{ width: "100%", background: "#f5f5f5", minHeight: "100vh", paddingTop: 16 }}>
      <div style={{ maxWidth: isMobile ? "100%" : 1200, margin: "0 auto", paddingBottom: 32, paddingLeft: isMobile ? 16 : 24, paddingRight: isMobile ? 16 : 24 }}>
        <Collapse accordion bordered={false} style={{ background: "transparent" }}>
          {orders.map((order) => {
            const orderStatus = statusMap[order.status] || { label: order.status, color: 'default', icon: null };
            const canCancel = cancellableStatuses.has(order.status);

            return (
              <Panel
                key={order.id}
                header={
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                    <Space size="middle" style={{ flexWrap: "wrap" }}>
                      <Space>{orderStatus.icon} <Text strong>Đơn hàng #{order.id}</Text></Space>
                      <Tag color={orderStatus.color} icon={orderStatus.icon}>{orderStatus.label}</Tag>
                      {/* Hiển thị thêm tag nếu đơn hàng đang có tranh chấp tổng */}
                      {order.is_disputed && <Tag color="error">Đang có khiếu nại</Tag>}
                    </Space>
                    <Space size="middle" style={{ flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
                      {canCancel && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Popconfirm title="Xác nhận hủy đơn" okText="Hủy đơn" cancelText="Đóng" okButtonProps={{ danger: true }} onConfirm={() => handleCancelOrder(order.id)}>
                            <Button danger size={isMobile ? "small" : "middle"} loading={cancelingOrderIds.has(order.id)} icon={<CloseCircleOutlined />}>Hủy đơn</Button>
                          </Popconfirm>
                        </div>
                      )}
                      <div style={{ textAlign: "right" }}>
                        <Text strong style={{ color: "#52c41a", display: "block", fontSize: isMobile ? 15 : 17 }}>{intcomma(order.total_price)}đ</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{new Date(order.created_at).toLocaleString("vi-VN")}</Text>
                      </div>
                    </Space>
                  </div>
                }
                style={{ background: "#ffffff", borderRadius: 16, marginBottom: 20, border: "1px solid #e8e8e8", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                <OrderTimeline status={order.status} orderId={order.id} />
                <Divider style={{ margin: "24px 0" }} />
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={10}>
                    <OrderInfo order={order} cardStyle={cardStyle} sectionTitleStyle={sectionTitleStyle} isMobile={isMobile} />
                  </Col>
                  <Col xs={24} lg={14}>
                    <ProductList
                      order={order}
                      cardStyle={cardStyle}
                      sectionTitleStyle={sectionTitleStyle}
                      isMobile={isMobile}
                      status={status}
                      ratedProducts={ratedProducts}
                      onRate={handleRating}

                      // --- Props mới cho Khiếu nại ---
                      activeComplaintItem={activeComplaintItem}
                      toggleComplaint={toggleComplaint}
                      complaintText={complaintText}
                      onChangeText={handleChangeText}
                      complaintFiles={complaintFiles}
                      onChangeFiles={handleChangeFiles}
                      isSendingComplaint={isSendingComplaint}
                      sendComplaint={handleSendComplaint}
                    />
                  </Col>
                </Row>
                <Divider style={{ margin: "24px 0" }} />
                <div style={{ textAlign: "right" }}>
                  <Space size="middle" wrap>
                    <Tooltip title="Liên hệ người bán"><Button icon={<MessageOutlined />} onClick={() => handleChatWithShop(order)}>Chat với Shop</Button></Tooltip>
                    {status === "completed" && <Button icon={<ReloadOutlined />} onClick={() => handleReorder(order)}>Mua lại</Button>}
                  </Space>
                </div>
              </Panel>
            );
          })}
        </Collapse>
      </div>

      <RatingModal
        open={ratingModalVisible}
        onCancel={() => setRatingModalVisible(false)}
        product={ratingProduct}
        ratingValue={ratingValue}
        setRatingValue={setRatingValue}
        comment={ratingComment}
        setComment={setRatingComment}
        onSubmit={submitRating}
        loading={submittingRating}
        isMobile={isMobile}
      />
    </div>
  );
};

export default OrderTab;