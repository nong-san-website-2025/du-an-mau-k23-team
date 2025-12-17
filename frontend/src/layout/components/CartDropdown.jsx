import React from "react";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/UserActions.css";

const CartDropdown = ({
  cartCount,
  cartItems,
  showDropdown,
  setShowDropdown,
}) => {
  const navigate = useNavigate();

  const handleToCart = () => {
    setShowDropdown(false);
    navigate("/cart");
  };

  return (
    <div
      className="action-item"
      onMouseEnter={() => setShowDropdown(true)}
      onMouseLeave={() => setShowDropdown(false)}
    >
      <button
        className="action-btn"
        onClick={handleToCart}
        aria-label="Giỏ hàng"
      >
        <ShoppingCart size={22} className="icon-default" />
        {cartCount > 0 && (
          <span className="badge-count badge-yellow">{cartCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="dropdown-panel cart-panel">
          <div className="dropdown-header">Sản phẩm mới thêm</div>

          <div className="cart-scroll-area">
            {cartItems.length === 0 ? (
              <div className="empty-state">Giỏ hàng đang trống</div>
            ) : (
              <>
                {cartItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id || item.product_id}
                    className="cart-item"
                    onClick={handleToCart}
                  >
                    <img
                      src={item.product?.image || "/media/products/default.png"}
                      alt="Product"
                      className="cart-thumb"
                      style={{
                        marginRight: "4px",
                      }} /* Đẩy ảnh xa chữ thêm xíu */
                    />
                    <div className="cart-info" style={{ flex: 1 }}>
                      <div className="cart-name">
                        {item.product?.name || "Sản phẩm"}
                      </div>
                      <div
                        className="cart-qty"
                        style={{ fontSize: "13px", color: "#16a34a" }}
                      >
                        x{item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <button className="view-all-btn" onClick={handleToCart}>
            Xem giỏ hàng của tôi
          </button>
        </div>
      )}
    </div>
  );
};

export default CartDropdown;
