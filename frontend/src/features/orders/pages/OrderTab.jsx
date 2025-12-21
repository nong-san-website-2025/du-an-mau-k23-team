import React, { useEffect, useState } from "react";
import { Collapse, Tag, Typography, Skeleton, Empty, Space, Button, Popconfirm, message, Row, Col, Divider, Tooltip } from "antd";
import { CloseCircleOutlined, MessageOutlined, ReloadOutlined } from "@ant-design/icons";
import API from "../../login_register/services/api";
import { useCart } from "../../cart/services/CartContext";
import { intcomma } from "./../../../utils/format";

// Imports from separated components
import { statusMap, cancellableStatuses } from "../utils";
import OrderTimeline from "../components/OrderTimeline";
import OrderInfo from "../components/OrderInfo"; // Component đã được nâng cấp
import ProductList from "../components/ProductList";
import RatingModal from "../components/RatingModal";
import SuccessModal from "../components/SuccessModal";

const { Panel } = Collapse;
const { Text } = Typography;

const OrderTab = ({ status }) => {
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingOrderIds, setCancelingOrderIds] = useState(new Set());
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Complaint UI state
  const [openComplaint, setOpenComplaint] = useState({});
  const [complaintTexts, setComplaintTexts] = useState({});
  const [complaintFiles, setComplaintFiles] = useState({});
  const [sendingByProduct, setSendingByProduct] = useState({});
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Rating UI state
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
    if (!token) return message.info("Bạn cần đăng nhập để gửi khiếu nại");

    const reason = (complaintTexts[productId] || "").trim();
    if (!reason) return message.warning("Vui lòng nhập nội dung khiếu nại");

    try {
      setSendingByProduct((prev) => ({ ...prev, [productId]: true }));
      const formData = new FormData();
      formData.append("product", productId);
      formData.append("reason", reason);
      if (quantity != null) formData.append("quantity", String(quantity));
      if (unitPrice != null) formData.append("unit_price", String(unitPrice));
      (complaintFiles[productId] || []).forEach((file) => formData.append("media", file));

      const res = await fetch("http://localhost:8000/api/complaints/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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
    setCancelingOrderIds((prev) => new Set(prev).add(orderId));
    try {
      await API.post(`orders/${orderId}/cancel/`);
      message.success(`Đơn #${orderId} đã được huỷ`);
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
          id: item.product,
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

  const handleRating = (product) => {
    setRatingProduct(product);
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
      setRatingValue(0);
      setRatingComment("");

    } catch (error) {
      console.error("Lỗi đánh giá:", error);
      if (error.response) {
        if (error.response.status === 401) {
          message.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        } else {
          const errorMsg = error.response.data.detail || "Gửi đánh giá thất bại.";
          message.error(errorMsg);
        }
      } else {
        message.error("Lỗi kết nối server.");
      }
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleChatWithShop = (order) => {
    const firstItem = order.items?.[0];
    if (!firstItem) return message.warning("Không tìm thấy thông tin shop");
    const sellerId = firstItem.store?.id || firstItem.seller_id;
    if (!sellerId) return message.warning("Không tìm thấy thông tin shop");

    window.dispatchEvent(new CustomEvent("chat:open", {
      detail: { sellerId, sellerName: firstItem.store_name || "Shop", sellerImage: firstItem.store?.image }
    }));
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setLoading(true);
    const statusParam = status === "completed" ? "success" : status;
    API.get(`orders/?status=${statusParam}`)
      .then((res) => setOrders(res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))))
      .catch(() => { message.error("Không thể tải đơn hàng"); setOrders([]); })
      .finally(() => setLoading(false));
  }, [status]);

  if (loading) return <div className="flex justify-center items-center min-h-[300px]"><Skeleton active paragraph={{ rows: 4 }} /></div>;
  if (!orders.length) return <div className="flex justify-center items-center min-h-[400px]" style={{ flexDirection: "column" }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đơn hàng nào" /></div>;

  return (
    <div style={{ width: "100%", background: "#f5f5f5", minHeight: "100vh", paddingTop: 16 }}>
      <div style={{ maxWidth: isMobile ? "100%" : 1200, margin: "0 auto", paddingBottom: 32, paddingLeft: isMobile ? 16 : 24, paddingRight: isMobile ? 16 : 24 }}>
        <Collapse accordion bordered={false} style={{ background: "transparent" }}>
          {orders.map((order) => {
            const orderStatus = statusMap[order.status] || { label: "Không xác định", color: "default", icon: null };
            const canCancel = cancellableStatuses.has(order.status);

            return (
              <Panel
                key={order.id}
                header={
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                    <Space size="middle" style={{ flexWrap: "wrap" }}>
                      <Space>{orderStatus.icon} <Text strong>Đơn hàng #{order.id}</Text></Space>
                      <Tag color={orderStatus.color} icon={orderStatus.icon}>{orderStatus.label}</Tag>
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
                        {/* Hiển thị Tổng tiền cuối cùng (Đã trừ voucher) */}
                        <Text strong style={{ color: "#52c41a", display: "block", fontSize: isMobile ? 15 : 17 }}>
                            {intcomma(order.total_amount || order.total_price)}đ
                        </Text>
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
                  {/* Cột Trái: Thông tin người nhận & Chi tiết thanh toán */}
                  <Col xs={24} lg={10}>
                    <OrderInfo 
                        order={order} 
                        cardStyle={cardStyle} 
                        sectionTitleStyle={sectionTitleStyle} 
                        isMobile={isMobile} 
                    />
                  </Col>
                  
                  {/* Cột Phải: Danh sách sản phẩm */}
                  <Col xs={24} lg={14}>
                    <ProductList
                      order={order}
                      cardStyle={cardStyle}
                      sectionTitleStyle={sectionTitleStyle}
                      isMobile={isMobile}
                      status={status}
                      ratedProducts={ratedProducts}
                      onRate={handleRating}
                      openComplaint={openComplaint}
                      toggleComplaint={toggleComplaint}
                      complaintTexts={complaintTexts}
                      onChangeText={onChangeText}
                      complaintFiles={complaintFiles}
                      onChangeFiles={onChangeFiles}
                      sendingByProduct={sendingByProduct}
                      sendComplaint={sendComplaint}
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

      <SuccessModal open={successModalVisible} onCancel={() => setSuccessModalVisible(false)} isMobile={isMobile} />

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