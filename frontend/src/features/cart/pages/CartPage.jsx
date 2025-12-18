// src/features/cart/pages/CartPage.jsx
import React, { useState, useEffect } from "react";
import { useCart, getItemProductId } from "../services/CartContext";
import {
  Card,
  Button,
  Modal,
  Checkbox,
  Popover,
  Row,
  Col,
  Avatar,
  Typography,
  Space,
  Divider,
  Tooltip,
} from "antd";
import { Store, Ticket, TicketIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { productApi } from "../../products/services/productApi";
import { formatVND } from "../../stores/components/StoreDetail/utils/utils";
import QuantityInput from "./QuantityInput";
import "../styles/CartPage.css";
import Layout from "../../../layout/LayoutDefault";
import { getSellerDetail } from "../../sellers/services/sellerService";
import NoImage from "../../../components/shared/NoImage";

const { Text, Title } = Typography;

function CartPage() {
  const { cartItems, clearCart, selectAllItems, deselectAllItems, toggleItem } =
    useCart();
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [sellerInfos, setSellerInfos] = useState({}); // { [storeId]: sellerData }

  const [voucherModal, setVoucherModal] = useState({
    visible: false,
    storeId: null,
    storeName: "",
  });

  const navigate = useNavigate();

  useEffect(() => { }, [cartItems]);

  useEffect(() => {
    const loadSellerInfos = async () => {
      const storeIds = new Set();
      cartItems.forEach((item) => {
        const storeId = item.product_data?.store?.id || item.product?.store?.id;
        if (storeId) storeIds.add(storeId);
      });

      const newSellerInfos = { ...sellerInfos };
      for (const storeId of storeIds) {
        if (!sellerInfos[storeId]) {
          try {
            const sellerData = await getSellerDetail(storeId);
            newSellerInfos[storeId] = sellerData;
          } catch (err) {
            console.warn(`❌ Không tải được thông tin seller ${storeId}:`, err);
            // Có thể gán giá trị mặc định nếu cần
            newSellerInfos[storeId] = { store_name: "Cửa hàng", image: null };
          }
        }
      }
      setSellerInfos(newSellerInfos);
    };

    if (cartItems.length > 0) {
      loadSellerInfos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems]);

  // Load sản phẩm liên quan khi thêm sản phẩm vào giỏ
  useEffect(() => {
    const loadRelatedOnAdd = async () => {
      try {
        if (!cartItems || cartItems.length === 0) return;

        const lastItem = cartItems[cartItems.length - 1];
        const lastProd = lastItem?.product_data || lastItem?.product;
        if (!lastProd) return;

        const categoryId = await productApi.getCategoryIdFromProduct(lastProd);
        if (!categoryId) return;

        const allProducts = await productApi.getAllProducts();

        const related = allProducts.filter((p) => {
          const prodCatId = p.category?.id || p.category;
          return prodCatId === categoryId;
        });

        const filtered = related.filter(
          (p) =>
            !cartItems.some(
              (item) => (item.product_data?.id || item.product?.id) === p.id
            )
        );

        setRelatedProducts(filtered.slice(0, 8));
      } catch (err) {
        console.error("❌ Lỗi load sản phẩm liên quan:", err);
      }
    };

    loadRelatedOnAdd();
  }, [cartItems]);

  const allChecked =
    cartItems.length > 0 && cartItems.every((item) => item.selected);

  const handleCheckAll = (e) => {
    if (e.target.checked) selectAllItems();
    else deselectAllItems();
  };

  const handleCheckItem = (itemId) => {
    toggleItem(itemId);
  };

  const selectedItemsData = cartItems.filter((item) => item.selected);

  const selectedTotal = selectedItemsData.reduce((sum, item) => {
    const prod = item.product_data || item.product || {};
    return sum + (Number(prod.price) || 0) * (Number(item.quantity) || 0);
  }, 0);

  // Popover content (Chi tiết đơn hàng)
  const popoverContent = (
    <div style={{ minWidth: 240 }}>
      <div className="summary-row">
        <span>Tạm tính:</span>
        <span>{formatVND(selectedTotal)}</span>
      </div>
      <div className="summary-row">
        <span>Phí vận chuyển:</span>
        <span>Miễn phí</span>
      </div>
      <div className="summary-row">
        <span>Khuyến mãi:</span>
        <span>{formatVND(0)}</span>
      </div>
    </div>
  );

  const groupedItems = cartItems.reduce((acc, item) => {
    const storeId =
      item.product_data?.store?.id || item.product?.store?.id || "store-less";

    if (!acc[storeId]) {
      acc[storeId] = { items: [] };
    }
    acc[storeId].items.push(item);
    return acc;
  }, {});

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="cart-empty text-center my-5">
          <Title level={3}>Giỏ hàng của bạn đang trống</Title>
          <Text type="secondary">
            Hãy thêm món ngon vào giỏ và quay lại sau nhé.
          </Text>
          <div style={{ marginTop: 20 }}>
            <Button
              type="primary"
              icon={<Store />}
              onClick={() => navigate("/")}
            >
              Đi tới chợ
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="cart-page container">
        <Row gutter={[24, 24]}>
          {/* LEFT: Danh sách sản phẩm */}
          <Col xs={24} lg={16} className="cart-left">
            {Object.entries(groupedItems).map(([storeId, { items }]) => {
              // ✅ Lấy thông tin seller từ state
              const sellerInfo = sellerInfos[storeId] || {};
              const displayName = sellerInfo.store_name || "Cửa hàng";
              const logoUrl = sellerInfo.image || null;

              return (
                <Card key={storeId} className="store-group card-elevated">
                  <div className="store-header">
                    <div className="store-meta">
                      <div
                        className="store-logo-wrapper clickable"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/store/${storeId}`)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && navigate(`/store/${storeId}`)
                        }
                      >
                        {logoUrl ? (
                          <Avatar src={logoUrl} size={56} />
                        ) : (
                          <Avatar size={56} icon={<Store />} />
                        )}
                      </div>

                      <div className="store-info">
                        <Title
                          level={5}
                          className="store-name clickable"
                          onClick={() => navigate(`/store/${storeId}`)}
                        >
                          {displayName}
                        </Title>
                      </div>
                    </div>


                  </div>

                  <Divider style={{ margin: "12px 0" }} />

                  <div className="cart-item-header grid-header">
                    <span className="col-checkbox" />
                    <span className="col-name">Sản phẩm</span>
                    <span className="col-price">Đơn giá</span>
                    <span className="col-quantity">Số lượng</span>
                    <span className="col-total">Thành tiền</span>
                  </div>

                  {items.map((item) => {
                    const prod = item.product_data || item.product || {};
                    const stableKey = item.id || item.product;
                    const itemId = getItemProductId(item);
                    return (
                      <div key={stableKey} className="cart-item grid-row">
                        <div className="col-checkbox">
                          <Checkbox
                            checked={item.selected || false}
                            onChange={() => handleCheckItem(itemId)}
                            aria-label={`Chọn ${prod.name || "sản phẩm"}`}
                          />
                        </div>

                        <div className="col-name item-main">
                          <div
                            className="item-thumb clickable"
                            onClick={() => navigate(`/products/${prod.id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              navigate(`/products/${prod.id}`)
                            }
                          >
                            {prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="item-img"
                              />
                            ) : (
                              <div className="item-img no-image">
                                <NoImage
                                  width="100%"
                                  height={90}
                                  text="Không có ảnh"
                                />
                              </div>
                            )}
                          </div>

                          <div className="item-meta">
                            <Text
                              style={{ fontSize: 14, fontWeight: 400 }}
                              className="item-name clickable"
                              onClick={() => navigate(`/products/${prod.id}`)}
                            >
                              {prod.name || "---"}
                            </Text>
                          </div>
                        </div>

                        <div className="col-price">
                          {/* Chuyển fontWeight thành 'normal' hoặc 400 */}
                          <Text style={{ fontWeight: 400 }} >
                            {formatVND(prod.price)}
                          </Text>
                        </div>

                        <div className="col-quantity">
                          <QuantityInput item={item} itemId={itemId} />
                        </div>

                        <div className="col-total">
                          <Text style={{ color: '#4caf50', fontWeight: 400 }}>
                            {formatVND(
                              Number(prod.price) * Number(item.quantity)
                            )}
                          </Text>
                        </div>
                      </div>
                    );
                  })}


                </Card>
              );
            })}

            {/* Sản phẩm liên quan */}
            {relatedProducts && relatedProducts.length > 0 && (
              <Card className="related-card">
                <Title level={5}>Sản phẩm gợi ý cho bạn</Title>
                <div className="related-list">
                  {relatedProducts.map((p) => (
                    <div
                      key={p.id}
                      className="related-item clickable"
                      onClick={() => navigate(`/products/${p.id}`)}
                    >
                      <div className="related-thumb">
                        {p.image ? (
                          <img src={p.image} alt={p.name} />
                        ) : (
                          <div className="related-no-image">No image</div>
                        )}
                      </div>
                      <div className="related-info">
                        <Text ellipsis style={{ maxWidth: 140 }}>
                          {p.name}
                        </Text>
                        <Text strong>{formatVND(p.price)}</Text>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Col>

          {/* RIGHT: Tổng quan & hành động */}
          <Col xs={24} lg={8} className="cart-right">
            <Card className="summary-card card-elevated sticky-summary">
              <div className="summary-top">
                <Title level={4}>Tóm tắt đơn hàng</Title>
                <Text type="secondary">
                  Chỉ thanh toán các sản phẩm đã chọn
                </Text>
              </div>

              <Divider />

              <div className="summary-lines">
                <div className="summary-line">
                  <span>Số sản phẩm đã chọn</span>
                  <span>{selectedItemsData?.length || 0}</span>
                </div>
                <div className="summary-line">
                  <span>Tạm tính</span>
                  <span>{formatVND(selectedTotal)}</span>
                </div>
              </div>

              <Divider />

              <div className="summary-actions">
                <Popover content={popoverContent} placement="topLeft">
                  <Button type="text">Chi tiết</Button>
                </Popover>

                <div className="summary-total">
                  <Text type="secondary">Tổng thanh toán</Text>
                  <Title style={{ color: '#4caf50' }} level={4}>{formatVND(selectedTotal)}</Title>
                </div>
              </div>

              <Space
                direction="vertical"
                size={12}
                style={{ width: "100%", marginTop: 8 }}
              >
                <Button
                  block
                  size="large"

                  disabled={selectedItemsData.length === 0}
                  onClick={() => navigate("/checkout")}
                  aria-disabled={selectedItemsData.length === 0}
                  className="btn-checkout"
                >
                  THANH TOÁN NGAY
                </Button>

                <Button
                  block
                  size="large"
                  onClick={() => setShowClearConfirm(true)}
                  style={{
                    backgroundColor: "#FF4D4F",
                    color: "#fff",
                    border: "none",
                  }}
                  className="btn-delete-all"
                >
                  Xóa tất cả
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Thanh tóm tắt đơn hàng cố định bên dưới (mobile) */}
        <div className="cart-bottom-bar-mobile">
          <Checkbox checked={allChecked} onChange={handleCheckAll} />
          <div className="mobile-summary">
            <div>
              <Text>Tổng: </Text>
              <Text strong>{formatVND(selectedTotal)}</Text>
            </div>
            <Button
              type="primary"
              disabled={selectedItemsData.length === 0}
              onClick={() => navigate("/checkout")}
            >
              Thanh toán
            </Button>
          </div>
        </div>

        {/* Modal xác nhận xóa tất cả */}
        <Modal
          open={showClearConfirm}
          onCancel={() => setShowClearConfirm(false)}
          onOk={async () => {
            await clearCart();
            setShowClearConfirm(false);
          }}
          title="Xóa tất cả sản phẩm"
          okText="Xóa tất cả"
          cancelText="Hủy"
        >
          Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ?
        </Modal>

        {/* Modal Voucher */}
        <Modal
          title={`Voucher cho shop ${voucherModal.storeName}`}
          open={voucherModal.visible}
          onCancel={() =>
            setVoucherModal({ visible: false, storeId: null, storeName: "" })
          }
          footer={[
            <Button
              key="back"
              onClick={() =>
                setVoucherModal({
                  visible: false,
                  storeId: null,
                  storeName: "",
                })
              }
            >
              Đóng
            </Button>,
          ]}
        >
          <p>Chức năng voucher đang được phát triển.</p>
          <p>Voucher cho cửa hàng ID: {voucherModal.storeId}</p>
        </Modal>
      </div>
    </Layout>
  );
}

export default CartPage;
