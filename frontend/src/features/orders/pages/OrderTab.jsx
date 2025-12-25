import React, { useEffect, useState, useCallback } from "react";
import { 
  Tag, Skeleton, Empty, Button, Popconfirm, message, Divider, 
  Image, Modal, Space 
} from "antd";
import { 
  ShopOutlined, MessageOutlined, ReloadOutlined, 
  CloseCircleOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import API from "../../login_register/services/api";
import { useCart } from "../../cart/services/CartContext";
import { intcomma } from "./../../../utils/format";

// Imports các component con
import { statusMap, cancellableStatuses } from "../utils";
import OrderTimeline from "../components/OrderTimeline";
import OrderInfo from "../components/OrderInfo";
import ProductList from "../components/ProductList";
import RatingModal from "../components/RatingModal";

const OrderTab = ({ status }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingOrderIds, setCancelingOrderIds] = useState(new Set());
  
  // State quản lý Modal chi tiết
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // --- STATE KHIẾU NẠI ---
  const [activeComplaintItem, setActiveComplaintItem] = useState(null);
  const [complaintText, setComplaintText] = useState("");
  const [complaintFiles, setComplaintFiles] = useState([]);
  const [isSendingComplaint, setIsSendingComplaint] = useState(false);

  // --- STATE ĐÁNH GIÁ ---
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingProduct, setRatingProduct] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingImages, setRatingImages] = useState([]); // State lưu ảnh
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratedProducts, setRatedProducts] = useState(new Set());

  // --- FETCH DATA ---
  const fetchOrders = useCallback(() => {
    setLoading(true);
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

  // --- LOGIC XỬ LÝ ---

  // 1. Logic Khiếu nại
  const toggleComplaint = (orderItemId) => {
    setActiveComplaintItem(orderItemId);
    if (orderItemId) {
      setComplaintText("");
      setComplaintFiles([]);
    }
  };

  const handleSendComplaint = async (orderItemId) => {
    if (!complaintText.trim()) return message.warning("Vui lòng nhập lý do");
    setIsSendingComplaint(true);
    try {
      const formData = new FormData();
      formData.append("order_item_id", orderItemId);
      formData.append("reason", complaintText);
      if (complaintFiles?.length > 0) {
        for (let i = 0; i < complaintFiles.length; i++) {
          formData.append("media", complaintFiles[i]);
        }
      }
      await API.post("complaints/", formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      message.success("Gửi yêu cầu hoàn tiền thành công!");
      toggleComplaint(null);
      fetchOrders();
    } catch (error) {
      message.error(error.response?.data?.error || "Gửi khiếu nại thất bại");
    } finally {
      setIsSendingComplaint(false);
    }
  };

  // 2. Logic Hủy đơn & Mua lại
  const handleCancelOrder = async (orderId) => {
    setCancelingOrderIds((prev) => new Set(prev).add(orderId));
    try {
      await API.post(`orders/${orderId}/cancel/`);
      message.success(`Đơn #${orderId} đã được huỷ`);
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      if(selectedOrder?.id === orderId) setDetailModalVisible(false);
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
      let count = 0;
      for (const item of items) {
        await addToCart(item.product, item.quantity || 1, {
          id: item.product, name: item.product_name, price: item.price,
          image: item.product_image, store: item.store, store_name: item.store_name
        });
        count++;
      }
      count > 0 ? message.success(`Đã thêm ${count} sản phẩm vào giỏ!`) : message.warning("Lỗi sản phẩm");
    } catch (error) {
      message.error("Lỗi khi thêm vào giỏ hàng");
    }
  };

  // 3. Logic Đánh giá & Chat (FIX LỖI 400 TẠI ĐÂY)
  
  // Sửa hàm handleRating: Đảm bảo lấy ID chuẩn
  const handleRating = (item) => {
    // Nếu item.product là object thì lấy .id, nếu là số thì giữ nguyên
    const productId = (typeof item.product === 'object' && item.product !== null) 
                      ? item.product.id 
                      : item.product;

    setRatingProduct({ 
        product: productId, // ✅ ID chuẩn (VD: 42)
        name: item.product_name, 
        image: item.product_image 
    });
    setRatingValue(5); 
    setRatingComment(""); 
    setRatingImages([]); // Reset ảnh cũ
    setRatingModalVisible(true);
  };

  // Sửa hàm submitRating: Gửi FormData chuẩn và bắt lỗi chi tiết
  const submitRating = async () => {
    if (!ratingProduct || ratingValue === 0) return message.warning("Vui lòng chọn số sao!");
    setSubmittingRating(true);
    
    try {
      const formData = new FormData();
      // Gửi ID sản phẩm
      formData.append("product", ratingProduct.product);
      formData.append("rating", ratingValue);
      formData.append("comment", ratingComment.trim());

      // Gửi danh sách ảnh
      if (ratingImages && ratingImages.length > 0) {
        ratingImages.forEach((file) => {
          if (file.originFileObj) {
            formData.append("images", file.originFileObj);
          }
        });
      }

      // Log kiểm tra
      console.log("Submitting review for Product ID:", ratingProduct.product);

      await API.post("reviews/add/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success("Đánh giá thành công!");
      setRatedProducts((prev) => new Set([...prev, ratingProduct.product]));
      setRatingModalVisible(false);
      setRatingImages([]); 
    } catch (error) {
      console.error("Review Error:", error.response); // Debug log

      if (error.response?.status === 401) {
          message.error("Hết phiên đăng nhập! Vui lòng đăng nhập lại.");
      } else if (error.response?.data) {
          // Xử lý thông báo lỗi từ backend (VD: đã đánh giá rồi)
          const data = error.response.data;
          const msg = data.detail || 
                      data.non_field_errors?.[0] || 
                      (typeof data === 'string' ? data : "Lỗi gửi đánh giá");
          message.error(msg);
      } else {
          message.error("Gửi đánh giá thất bại.");
      }
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleChatWithShop = (order) => {
    const item = order.items?.[0];
    if (!item?.store && !item?.product_seller_id) return message.warning("Không tìm thấy Shop");
    window.dispatchEvent(new CustomEvent("chat:open", {
      detail: { sellerId: item.store?.id || item.product_seller_id, sellerName: item.store_name || "Shop", sellerImage: item.store?.image }
    }));
  };

  // 4. Logic Render Tag Khiếu nại/Hoàn tiền
  const renderDisputeTag = (order) => {
    if (!order.items || order.items.length === 0) return null;

    const activeDisputeStatuses = [
      'REFUND_REQUESTED', 'WAITING_RETURN', 'RETURNING',
      'SELLER_REJECTED', 'DISPUTE_TO_ADMIN', 'negotiating', 'pending'
    ];
    const resolvedStatuses = ['resolved_refund', 'REFUND_APPROVED'];

    const hasActiveDispute = order.items.some(item => {
      const cStatus = item.complaint?.status;
      if (cStatus) return activeDisputeStatuses.includes(cStatus);
      return activeDisputeStatuses.includes(item.status);
    });

    if (hasActiveDispute) return <Tag color="error">Đang có khiếu nại</Tag>;

    const hasResolvedRefund = order.items.some(item => {
      const cStatus = item.complaint?.status;
      if (cStatus) return resolvedStatuses.includes(cStatus);
      return resolvedStatuses.includes(item.status);
    });

    if (hasResolvedRefund) return <Tag color="success">Đã hoàn tiền</Tag>;

    const hasRejected = order.items.some(item =>
      item.status === 'REFUND_REJECTED' || item.complaint?.status === 'resolved_reject'
    );

    if (hasRejected) return <Tag color="default">Từ chối hoàn tiền</Tag>;

    return null;
  };

  const hasActiveDispute = (order) => {
    if (!order.items) return false;
    const activeDisputeStatuses = [
      'REFUND_REQUESTED', 'WAITING_RETURN', 'RETURNING',
      'SELLER_REJECTED', 'DISPUTE_TO_ADMIN', 'negotiating', 'pending'
    ];
    return order.items.some(item => {
      const cStatus = item.complaint?.status;
      if (cStatus) return activeDisputeStatuses.includes(cStatus);
      return activeDisputeStatuses.includes(item.status);
    });
  };

  const confirmReceived = async (orderId) => {
    try {
      await API.post(`orders/${orderId}/confirm-received/`);
      message.success('Đã xác nhận đã nhận hàng');
      fetchOrders();
    } catch (error) {
      message.error(error?.response?.data?.error || 'Không thể xác nhận');
    }
  };

  const openDetailModal = (order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  // --- RENDER ---
  if (loading) return <div style={{ padding: 20 }}><Skeleton active paragraph={{ rows: 4 }} /></div>;
  if (!orders.length) return <div style={{ minHeight: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}><Empty description="Chưa có đơn hàng nào" /></div>;

  return (
    <div style={{ width: '100%' }}>
      {orders.map((order) => {
        const orderStatus = statusMap[order.status] || { label: order.status, color: 'default', icon: null };
        const canCancel = cancellableStatuses.has(order.status);
        const firstItem = order.items?.[0];
        const otherItemsCount = (order.items?.length || 0) - 1;

        return (
          <div key={order.id} className="card-order" style={{ padding: '20px', background: '#fff', borderRadius: 8, marginBottom: 20, border: '1px solid #e5e7eb' }}>
            
            {/* Header: Shop Info & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottom: '1px solid #f0f0f0', paddingBottom: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 1, minWidth: 0, padding: '8px 12px', borderRadius: '6px', marginLeft: '-12px' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                onClick={() => {
                  const storeId = firstItem?.seller_id || firstItem?.store_id || firstItem?.product_seller_id;
                  if (storeId) {
                    setDetailModalVisible(false);
                    setTimeout(() => navigate(`/store/${storeId}`), 100);
                  } else {
                    message.warning("Không tìm thấy thông tin cửa hàng");
                  }
                }}
              >
                <div style={{ flexShrink: 0 }}>
                  {firstItem?.store?.image ? (
                    <img src={firstItem.store.image} alt={order.shop_name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #52c41a' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShopOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#333', fontSize: 15, marginBottom: 2 }}>{order.shop_name || "Cửa hàng"}</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>{order.shop_phone || ""}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <Button size="small" type="primary" ghost icon={<MessageOutlined />} onClick={(e) => { e.stopPropagation(); handleChatWithShop(order); }}>Chat</Button>
                {renderDisputeTag(order)}
                <Tag color={orderStatus.color} style={{ margin: 0, textTransform: 'uppercase', fontWeight: 600, border: 'none' }}>{orderStatus.label}</Tag>
              </div>
            </div>

            {/* Body: Preview Sản Phẩm */}
            <div style={{ cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'flex-start' }} onClick={() => openDetailModal(order)}>
                <div style={{ width: 80, height: 80, border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                  <Image 
                    src={firstItem?.product_image} 
                    preview={false} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    fallback="https://via.placeholder.com/80"
                  />
                </div>
                <div style={{ flex: 1 }}>
                   <div style={{ fontWeight: 500, color: '#1f2937', marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                     {firstItem?.product_name}
                   </div>
                   <div style={{ fontSize: 12, color: '#6b7280' }}>Phân loại: {firstItem?.variant_name || "Tiêu chuẩn"}</div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>x{firstItem?.quantity}</span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{intcomma(firstItem?.price)}đ</span>
                   </div>
                </div>
            </div>

            {otherItemsCount > 0 && (
                <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: '#6b7280', background: '#f9fafb', padding: '6px', borderRadius: 4, border: '1px dashed #e5e7eb' }}>
                  Xem thêm {otherItemsCount} sản phẩm khác
                </div>
            )}

            <Divider style={{ margin: "16px 0" }} />

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                 <span style={{ color: '#6b7280', fontSize: 14 }}>Thành tiền:</span>
                 <span style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>{intcomma(order.total_amount || order.total_price)}đ</span>
              </div>

              <Space wrap>
                {canCancel && (
                   <Popconfirm title="Hủy đơn hàng?" okText="Đồng ý" cancelText="Đóng" okButtonProps={{ danger: true }} onConfirm={() => handleCancelOrder(order.id)}>
                      <Button danger icon={<CloseCircleOutlined />} loading={cancelingOrderIds.has(order.id)}>Hủy đơn</Button>
                   </Popconfirm>
                )}
                {status === "completed" && (
                   <Button icon={<ReloadOutlined />} onClick={() => handleReorder(order)}>Mua lại</Button>
                )}
                {status === "delivered" && !hasActiveDispute(order) && (
                   <Button style={{ background: '#389E0D', borderColor: '#389E0D', color: '#fff' }} onClick={() => confirmReceived(order.id)}>Đã nhận</Button>
                )}
                <Button onClick={() => openDetailModal(order)}>Xem chi tiết</Button>
              </Space>
            </div>
          </div>
        );
      })}

      {/* --- MODAL CHI TIẾT --- */}
      <Modal
        title={<span style={{ fontWeight: 'bold', fontSize: 16 }}>Chi tiết đơn hàng #{selectedOrder?.id}</span>}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={1000}
        footer={null}
        destroyOnClose
        style={{ top: 20 }}
        bodyStyle={{ padding: '24px' }}
      >
        {selectedOrder && (
          <div>
             <div style={{ marginBottom: 24 }}>
               <OrderTimeline status={selectedOrder.status} orderId={selectedOrder.id} />
             </div>
             <div style={{ display: 'flex', gap: 24, flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <OrderInfo 
                        order={selectedOrder} 
                        cardStyle={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 8, padding: 0 }} 
                        isMobile={false} 
                    />
                </div>
                <div style={{ flex: 1.5, minWidth: 0 }}>
                    <ProductList 
                        order={selectedOrder} 
                        isMobile={false} status={status}
                        cardStyle={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 0, overflow: 'hidden' }}
                        ratedProducts={ratedProducts} onRate={handleRating}
                        activeComplaintItem={activeComplaintItem} toggleComplaint={toggleComplaint}
                        complaintText={complaintText} onChangeText={setComplaintText}
                        complaintFiles={complaintFiles} onChangeFiles={setComplaintFiles}
                        isSendingComplaint={isSendingComplaint} sendComplaint={handleSendComplaint}
                        onProductClick={(productId) => navigate(`/products/${productId}`)}
                    />
                </div>
             </div>
          </div>
        )}
      </Modal>

      {/* --- MODAL ĐÁNH GIÁ --- */}
      <RatingModal 
        open={ratingModalVisible} 
        onCancel={() => {
            setRatingModalVisible(false);
            setRatingImages([]);
        }}
        product={ratingProduct} 
        ratingValue={ratingValue}
        setRatingValue={setRatingValue}
        comment={ratingComment}
        setComment={setRatingComment}
        
        // 👇👇 TRUYỀN STATE ẢNH XUỐNG ĐỂ FIX LỖI 👇👇
        images={ratingImages}
        setImages={setRatingImages}
        // 👆👆 ----------------------------------- 👆👆

        onSubmit={submitRating}
        loading={submittingRating}
        isMobile={window.innerWidth < 576}
      />
    </div>
  );
};

export default OrderTab;