// src/features/cart/pages/CartPage.jsx
import React, { useState, useEffect } from "react";
import { useCart } from "../services/CartContext";
import { Card, Button, Row, Col, Modal, Checkbox, Popover } from "antd";
import { Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { productApi } from "../../products/services/productApi";
import { Helmet } from "react-helmet";
import QuantityInput from "./QuantityInput";
import "../styles/CartPage.css";

function CartPage() {
  const { cartItems, clearCart, selectAllItems, deselectAllItems, toggleItem } =
    useCart();
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    console.log("🛒 cartItems:", JSON.stringify(cartItems, null, 2));
  }, [cartItems]);

  const getCategoryIdFromProduct = (product) => {
    return product?.category?.id || product?.category || null;
  };

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

  const selectedQuantity = selectedItemsData.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

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

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty text-center my-5">
        <Helmet>
          <title>Giỏ hàng</title>
          <meta name="description" content="Giỏ hàng" />
        </Helmet>
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
    );
  }

  return (
    <div className="cart-page" style={{ padding: "2px 190px" }}>
      <Helmet>
        <title>Giỏ hàng</title>
        <meta name="description" content="Giỏ hàng" />
      </Helmet>

      <div className="cart-container ">
        {/* LEFT: Danh sách sản phẩm */}
        <div className="cart-left">
          <Card
          >
            <div className="cart-header">
              <Checkbox checked={allChecked} onChange={handleCheckAll} />
              <span className="col-name">Sản phẩm</span>
              <span className="col-price">Đơn giá</span>
              <span className="col-quantity">Số lượng</span>
              <span className="col-total">Thành tiền</span>
            </div>

            {cartItems.map((item) => {
              const prod = item.product_data || item.product || {};
              const stableKey = item.id || item.product;
              return (
                <div key={stableKey} className="cart-item">
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

                  <div className="item-price">
                    {Number(prod.price)?.toLocaleString("vi-VN")}₫
                  </div>
                  <div className="item-quantity " style={{ padding: "0 70px" }}>
                    <QuantityInput item={item} />
                  </div>
                  <div className="item-total">
                    {(
                      Number(prod.price) * Number(item.quantity)
                    ).toLocaleString("vi-VN")}
                    ₫
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </div>

      {/* Thanh tóm tắt đơn hàng cố định bên dưới */}
      <div className="cart-bottom-bar " style={{ padding: "15px 190px"}}>
        <Button danger size="small" onClick={() => setShowClearConfirm(true)}>
          Xóa tất cả
        </Button>
        <div className="d-flex align-items-center gap-4" >
          <Popover content={popoverContent} placement="topLeft" >
            <div className="total-section">
              <span className="total-label">Tổng cộng:</span>
              <span className="total-price">
                {selectedTotal.toLocaleString("vi-VN")}₫
              </span>
            </div>
          </Popover>
          <Button
            type="primary"
            disabled={selectedItemsData.length === 0}
            onClick={() => navigate("/checkout")}
            style={{ height: 50, fontSize: "16px", fontWeight: 500 }}
          >
            Tiến hành thanh toán ({selectedQuantity})
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
    </div>
  );
}

export default CartPage;
