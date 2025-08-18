import React, { useState } from "react";
import { useCart } from "../services/CartContext";
import { Container, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Store } from "lucide-react";
import "../styles/CartPage.css";
import QuantityInput from "./QuantityInput ";

function CartPage() {
  const { cartItems } = useCart();
  const [selectedItems, setSelectedItems] = useState([]);
  const navigate = useNavigate();

  const allChecked =
    cartItems.length > 0 && selectedItems.length === cartItems.length;

  const handleCheckAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(cartItems.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleCheckItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectedItemsData = cartItems.filter((item) =>
    selectedItems.includes(item.id)
  );

  const selectedTotal = selectedItemsData.reduce(
    (sum, item) =>
      sum + (Number(item.product?.price) || 0) * (Number(item.quantity) || 0),
    0
  );

  const selectedQuantity = selectedItemsData.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  if (cartItems.length === 0) {
    return (
      <Container className="cart-empty">
        <h2>Giỏ hàng của bạn đang trống</h2>
        <Button href="/productuser" className="btn-go-market">
          <Store /> Đi tới chợ
        </Button>
      </Container>
    );
  }

  return (
    <div className="cart-container">
      {/* LEFT: Danh sách sản phẩm */}
      <div className="cart-left">
        <Card className="cart-card">
          <div className="cart-header">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={handleCheckAll}
            />
            <span className="col-name">Sản phẩm</span>
            <span className="col-price">Đơn giá</span>
            <span className="col-quantity">Số lượng</span>
            <span className="col-total">Thành tiền</span>
          </div>
          {cartItems.map((item) => {
            const prod =
              typeof item.product === "object"
                ? item.product
                : item.product_data || {};
            return (
              <div key={item.id} className="cart-item">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleCheckItem(item.id)}
                />
                <div className="item-info">
                  {prod.image ? (
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="item-img"
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <span className="item-name">{prod.name || "---"}</span>
                </div>
                <div className="item-price">
                  {Number(prod.price)?.toLocaleString("vi-VN")}₫
                </div>
                <div className="item-quantity" style={{ color: "#000", justifyContent: "center", display: "flex" }}>
                  <QuantityInput item={item} />
                </div>
                <div className="item-total">
                  {(Number(prod.price) * Number(item.quantity)).toLocaleString(
                    "vi-VN"
                  )}
                  ₫
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      {/* RIGHT: Tóm tắt đơn hàng */}
      <div className="cart-right">
        <Card className="summary-card">
          <h4>Tóm tắt đơn hàng</h4>
          <div className="summary-row">
            <span>Tổng sản phẩm:</span>
            <span>{selectedQuantity} sản phẩm</span>
          </div>
          <div className="summary-row">
            <span>Tạm tính:</span>
            <span>{selectedTotal.toLocaleString("vi-VN")}₫</span>
          </div>
          <div className="summary-row">
            <span>Phí vận chuyển:</span>
            <span>Miễn phí</span>
          </div>
          <hr />
          <div className="summary-row total">
            <span>Tổng cộng:</span>
            <span>{selectedTotal.toLocaleString("vi-VN")}₫</span>
          </div>
          <Button
            disabled={selectedItems.length === 0}
            className="btn-checkout"
            onClick={() =>
              navigate("/checkout", { state: { items: selectedItemsData } })
            }
          >
            Tiến hành thanh toán
          </Button>
        </Card>
      </div>
    </div>
  );
}

export default CartPage;
