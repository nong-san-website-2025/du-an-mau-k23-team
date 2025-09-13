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
  const [relatedProducts, setRelatedProducts] = useState([]);
  const navigate = useNavigate();
  // console.log("🟢 CartPage render - cartItems:", cartItems);
  // console.log("🟢 relatedProducts state:", relatedProducts);

  // Tick all khi cartItems thay đổi
  useEffect(() => {
    if (cartItems.length > 0) {
      setSelectedItems(cartItems.map((item) => item.id || item.product));
    }
  }, [cartItems]);
  useEffect(() => {
    console.log("🛒 cartItems chi tiết:", JSON.stringify(cartItems, null, 2));
  }, [cartItems]);

  const getCategoryIdFromProduct = (product) => {
    return product?.category?.id || product?.category || null;
  };

  // CartPage.jsx (chỉ sửa phần useEffect loadRelated)
  useEffect(() => {
    const loadRelated = async () => {
      try {
        if (!cartItems || cartItems.length === 0) {
          console.log("🟡 Giỏ hàng rỗng -> bỏ qua load sản phẩm liên quan");
          return;
        }

        const firstItem = cartItems[0];
        const firstProd = firstItem?.product_data || firstItem?.product;
        if (!firstProd) {
          console.warn("⚠️ Không có dữ liệu sản phẩm trong giỏ");
          return;
        }

        const categoryId = getCategoryIdFromProduct(firstProd);
        if (!categoryId) {
          console.warn(
            "⚠️ Không tìm thấy category id cho sản phẩm:",
            firstProd
          );
          return;
        }

        // Tiếp tục logic load sản phẩm liên quan ...
      } catch (err) {
        console.error("❌ Lỗi load sản phẩm liên quan:", err);
      }
    };

    loadRelated();
  }, [cartItems]);

  // Thêm useEffect để lắng nghe sự thay đổi của cartItems và tải sản phẩm liên quan
  useEffect(() => {
    const loadRelatedOnAdd = async () => {
      try {
        if (!cartItems || cartItems.length === 0) {
          console.log("🟡 Giỏ hàng rỗng -> bỏ qua load sản phẩm liên quan");
          return;
        }

        // Lấy sản phẩm cuối cùng được thêm vào giỏ hàng
        const lastItem = cartItems[cartItems.length - 1];
        const lastProd = lastItem?.product_data || lastItem?.product;
        if (!lastProd) {
          console.warn("⚠️ Không có dữ liệu sản phẩm trong giỏ");
          return;
        }

        // Lấy categoryId từ productApi
        const categoryId = await productApi.getCategoryIdFromProduct(lastProd);
        if (!categoryId) {
          console.warn("⚠️ Không tìm thấy category id cho sản phẩm:", lastProd);
          return;
        }

        console.log("🟢 Lọc sản phẩm cùng danh mục bằng getAllProducts()");

        // Lấy toàn bộ sản phẩm
        const allProducts = await productApi.getAllProducts();

        // Lọc cùng danh mục
        const related = allProducts.filter((p) => {
          const prodCatId = p.category?.id || p.category;
          return prodCatId === categoryId;
        });

        // Lọc bỏ sản phẩm đã có trong giỏ
        const filtered = related.filter(
          (p) =>
            !cartItems.some(
              (item) => (item.product_data?.id || item.product?.id) === p.id
            )
        );

        console.log(`✅ Lấy được ${filtered.length} sản phẩm cùng danh mục`);
        setRelatedProducts(filtered.slice(0, 8));
      } catch (err) {
        console.error("❌ Lỗi load sản phẩm liên quan:", err);
      }
    };

    loadRelatedOnAdd();
  }, [cartItems]);

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
              const stableKey = item.id || item.product;
              return (
                <div
                  key={item.product_data?.id || item.product}
                  className="cart-item"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(stableKey)}
                    onChange={() => handleCheckItem(stableKey)}
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
            <div style={{ display: "flex", gap: "10px" }}>
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
            </div>
          </Card>
        </div>
      </div>

      {/* SẢN PHẨM CÙNG DANH MỤC */}
      <div className="product-category mt-4">
        <h4>Sản phẩm cùng danh mục</h4>
        <Row>
          {relatedProducts.length > 0 ? (
            relatedProducts.map((prod) => (
              <Col key={prod.id} xs={6} sm={4} md={3} className="mb-3">
                <Card
                  className="product-card"
                  onClick={() => navigate(`/products/${prod.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  {prod.image ? (
                    <Card.Img variant="top" src={prod.image} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <Card.Body>
                    <Card.Title style={{ fontSize: "0.9rem" }}>
                      {prod.name}
                    </Card.Title>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <p>Không có sản phẩm liên quan</p>
          )}
        </Row>
      </div>
    </div>
  );
}

export default CartPage;
