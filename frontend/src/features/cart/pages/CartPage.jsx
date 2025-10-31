// src/features/cart/pages/CartPage.jsx
import React, { useState, useEffect } from "react";
import { useCart } from "../services/CartContext";
import { Card, Button, Modal, Checkbox, Popover } from "antd";
import { Store, Ticket, TicketIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { productApi } from "../../products/services/productApi";
import QuantityInput from "./QuantityInput";
import "../styles/CartPage.css";
import Layout from "../../../Layout/LayoutDefault";
import { getSellerDetail } from "../../sellers/services/sellerService";

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

  useEffect(() => {
  }, [cartItems]);

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
    <div style={{ minWidth: 200 }}>
      <div className="summary-row">
        <span>Tạm tính:</span>
        <span>{selectedTotal.toLocaleString("vi-VN")}₫</span>
      </div>
      <div className="summary-row">
        <span>Phí vận chuyển:</span>
        <span>Miễn phí</span>
      </div>
      <div className="summary-row">
        <span>Khuyến mãi:</span>
        <span>-0₫</span>
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
      <>
        <div className="cart-empty text-center my-5">
          <h2>Giỏ hàng của bạn đang trống</h2>
          <Button
            type="primary"
            icon={<Store />}
            onClick={() => navigate("/")}
            style={{ marginTop: 20 }}
          >
            Đi tới chợ
          </Button>
        </div>
      </>
    );
  }

  return (
    <Layout>
      <div className="cart-page">
        <div className="cart-container">
          {/* LEFT: Danh sách sản phẩm */}
          <div className="cart-left">
            {Object.entries(groupedItems).map(([storeId, { items }]) => {
              // ✅ Lấy thông tin seller từ state
              const sellerInfo = sellerInfos[storeId] || {};
              const displayName = sellerInfo.store_name || "Cửa hàng";
              const logoUrl = sellerInfo.image || null;

              return (
                <Card key={storeId} className="store-group">
                  <div
                    className="store-header"
                    style={{ padding: "16px 23px" }}
                  >
                    <div className="store-logo-wrapper">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={displayName}
                          className="store-logo"
                          onClick={() => navigate(`/store/${storeId}`)}
                        />
                      ) : (
                        <Store size={20} color="#16a34a" />
                      )}
                    </div>
                    <span
                      className="store-name"
                      onClick={() => navigate(`/store/${storeId}`)}
                    >
                      {displayName}
                    </span>
                  </div>

                  <div className="cart-item-header">
                    <span className="col-checkbox" />
                    <span style={{ paddingLeft: 16 }} className="col-name">
                      Sản phẩm
                    </span>
                    <span className="col-price">Đơn giá</span>
                    <span className="col-quantity">Số lượng</span>
                    <span className="col-total">Thành tiền</span>
                  </div>

                  {items.map((item) => {
                    const prod = item.product_data || item.product || {};
                    const stableKey = item.id || item.product;
                    const itemId =
                      item.id || item.product_data?.id || item.product;
                    return (
                      <div key={stableKey} className="cart-item px-4">
                        <Checkbox
                          checked={item.selected || false}
                          onChange={() => handleCheckItem(stableKey)}
                        />
                        <div className="item-info">
                          <img
                            src={prod.image || "/no-image.png"}
                            alt={prod.name}
                            className="item-img"
                            onClick={() => navigate(`/products/${prod.id}`)}
                          />
                          <span
                            className="item-name"
                            onClick={() => navigate(`/products/${prod.id}`)}
                          >
                            {prod.name || "---"}
                          </span>
                        </div>

                        <div className="item-price" style={{ paddingLeft: 12 }}>
                          {Number(prod.price)
                            ?.toLocaleString("vi-VN")
                            .replaceAll(".", ",")}
                          ₫
                        </div>
                        <div
                          className="item-quantity"
                          style={{ paddingLeft: 48 }}
                        >
                          <QuantityInput item={item} itemId={itemId} />
                        </div>
                        <div className="item-total">
                          {(Number(prod.price) * Number(item.quantity))
                            .toLocaleString("vi-VN")
                            .replaceAll(".", ",")}
                          ₫
                        </div>
                      </div>
                    );
                  })}

                  <div className="store-voucher" style={{ padding: "0 22px" }}>
                    <span>
                      <TicketIcon color="#16a34a" />
                    </span>
                    <Button
                      type="link"
                      onClick={() =>
                        setVoucherModal({
                          visible: true,
                          storeId,
                          storeName: displayName,
                        })
                      }
                    >
                      Thêm mã giảm giá
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Thanh tóm tắt đơn hàng cố định bên dưới */}
        <div className="cart-bottom-bar" style={{ padding: "15px 140px" }}>
          <div className="cart-global-header">
            <Checkbox checked={allChecked} onChange={handleCheckAll} />
            <span>Chọn tất cả ({cartItems.length} sản phẩm)</span>
            <Button
              danger
              size="small"
              onClick={() => setShowClearConfirm(true)}
            >
              Xóa tất cả
            </Button>
          </div>

          <div className="d-flex align-items-center gap-4">
            <Popover content={popoverContent} placement="topLeft">
              <div className="total-section">
                <span className="total-label">
                  Tổng cộng{" "}
                  <span style={{ fontWeight: 500 }}>
                    ({selectedItemsData?.length || 0} sản phẩm)
                  </span>
                  :
                </span>
                <span className="total-price">
                  {selectedTotal.toLocaleString("vi-VN").replaceAll(".", ",")}₫
                </span>
              </div>
            </Popover>
            <Button
              disabled={selectedItemsData.length === 0}
              onClick={() => navigate("/checkout")}
              style={{
                height: 50,
                minWidth: 200,
                fontSize: "16px",
                fontWeight: 500,
                backgroundColor: "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: 4,
              }}
              className="btn-payment"
            >
              Thanh Toán
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
          transitionName="ant-zoom-big"
          maskTransitionName="ant-fade"
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
