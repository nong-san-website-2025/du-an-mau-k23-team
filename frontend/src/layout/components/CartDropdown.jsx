import React from "react";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles//UserActions.css";

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
          <div className="dropdown-header">Sản phẩm trong giỏ hàng</div>
          
          {cartItems.length === 0 ? (
            <div className="empty-state">Giỏ hàng trống</div>
          ) : (
            <>
              {cartItems.slice(0, 4).map((item) => (
                <div key={item.id || item.product_id} className="cart-item" onClick={handleToCart}>
                  <img
                    src={item.product?.image || "/media/products/default.png"}
                    alt="Product"
                    className="cart-thumb"
                  />
                  <span className="cart-name">
                    {item.product?.name || "Sản phẩm"}
                  </span>
                  <span className="cart-qty">x{item.quantity}</span>
                </div>
              ))}
              <button className="view-all-btn" onClick={handleToCart}>
                Xem giỏ hàng
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CartDropdown;