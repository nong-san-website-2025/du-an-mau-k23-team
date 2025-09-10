// src/features/cart/pages/CartPage.jsx
import React, { useState, useEffect } from "react";
import { useCart } from "../services/CartContext";
import { Container, Card, Button, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Store } from "lucide-react";
import "../styles/CartPage.css";
import QuantityInput from "./QuantityInput";
import { productApi } from "../../products/services/productApi";

function CartPage() {
  const { cartItems } = useCart();
  const [selectedItems, setSelectedItems] = useState([]);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  // Tick all khi cartItems thay đổi
  useEffect(() => {
    if (cartItems.length > 0) {
      setSelectedItems(cartItems.map((item) => item.id || item.product));
    }
  }, [cartItems]);

  // Load danh mục sản phẩm demo
  // useEffect(() => {
  //   const loadProducts = async () => {
  //     try {
  //       const data = await productApi.getAllProducts();
  //       setProducts(data.slice(0, 8)); // ✅ chỉ lấy 8 sản phẩm
  //     } catch (err) {
  //       console.error("❌ Lỗi load sản phẩm:", err);
  //     }
  //   };
  //   loadProducts();
  // }, []);

  const allChecked =
    cartItems.length > 0 && selectedItems.length === cartItems.length;

  const handleCheckAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(cartItems.map((item) => item.id || item.product));
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
    selectedItems.includes(item.id || item.product)
  );

  const selectedTotal = selectedItemsData.reduce((sum, item) => {
    const prod = item.product_data || item.product || {};
    return sum + (Number(prod.price) || 0) * (Number(item.quantity) || 0);
  }, 0);

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
              const prod = item.product_data || item.product || {};
              const itemId = item.id || item.product;
              return (
                <div key={itemId} className="cart-item">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(itemId)}
                    onChange={() => handleCheckItem(itemId)}
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
                    style={{ display: "flex", justifyContent: "center" }}
                  >
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

      <div className="product-category mt-4">
        <h4>Sản phẩm trong giỏ</h4>
        <Row>
          {cartItems.slice(0, 8).map((item) => {
            const prod = item.product_data || item.product || {};
            return (
              <Col key={prod.id} xs={6} sm={4} md={3} className="mb-3">
                <Card
                  className="product-card clickable-card"
                  onClick={() => navigate(`/products/${prod.id}`)} // ✅ click card là qua
                >
                  {prod.image ? (
                    <Card.Img variant="top" src={prod.image} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <Card.Body>
                    <Card.Title style={{ fontSize: "0.9rem" }}>
                      {prod.name || "---"}
                    </Card.Title>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </div>
  );
}

export default CartPage;
