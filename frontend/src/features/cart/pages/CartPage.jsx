// src/features/cart/pages/CartPage.jsx
import React, { useState, useEffect } from "react";
import { useCart } from "../services/CartContext";
import { Container, Card, Button, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Store } from "lucide-react";
import "../styles/CartPage.css";
import QuantityInput from "./QuantityInput";

function CartPage() {
  const { cartItems } = useCart();
  const [selectedItems, setSelectedItems] = useState([]);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  // Tick all khi cartItems thay đổi
  useEffect(() => {
    if (cartItems.length > 0) {
      setSelectedItems(cartItems.map((item) => item.id));
    }
  }, [cartItems]);

  // Load danh mục sản phẩm (ví dụ từ API hoặc tạm thời)
  useEffect(() => {
    // Giả lập danh mục
    setProducts([
      { id: 1, name: "Sản phẩm A", image: "/images/prodA.jpg" },
      { id: 2, name: "Sản phẩm B", image: "/images/prodB.jpg" },
      { id: 3, name: "Sản phẩm C", image: "/images/prodC.jpg" },
      { id: 4, name: "Sản phẩm D", image: "/images/prodD.jpg" },
    ]);
  }, []);

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
    <div className="cart-page">
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
                  <div
                    className="item-quantity"
                    style={{
                      color: "#000",
                      justifyContent: "center",
                      display: "flex",
                    }}
                  >
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
            <Button
              className="btn-checkout"
              onClick={() =>
                navigate("/", { state: { items: selectedItemsData } })
              }
            >
              Tiếp tục mua hàng
            </Button>
          </Card>
        </div>
      </div>

      {/* DANH MỤC SẢN PHẨM */}
      <div className="product-category mt-4">
        <h4>Khám phá các sản phẩm khác</h4>
        <Row>
          {products.map((prod) => (
            <Col key={prod.id} xs={6} sm={4} md={3} className="mb-3">
              <Card className="product-card">
                {prod.image ? (
                  <Card.Img variant="top" src={prod.image} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
                <Card.Body>
                  <Card.Title style={{ fontSize: "0.9rem" }}>{prod.name}</Card.Title>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/product/${prod.id}`)}
                  >
                    Xem sản phẩm
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}

export default CartPage;
