import React, {useRef} from "react";
import { ShoppingCart, ShoppingBag, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CartDropdown = ({ cartCount, cartItems, showDropdown, setShowDropdown }) => {
  const navigate = useNavigate();

  const timerRef = useRef(null);

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current); // Xóa bộ đếm hủy
    }
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setShowDropdown(false);
    }, 200); // 200ms là thời gian vàng, đủ nhanh nhưng không bị giật
  };

  const handleToCart = () => {
    setShowDropdown(false);
    navigate("/cart");
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const subTotal = cartItems?.reduce(
    (acc, item) => acc + (Number(item.product?.price || 0) * item.quantity), 0
  );

  return (
    <div
      className="action-item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="action-btn" onClick={handleToCart}>
        <ShoppingCart size={22} strokeWidth={2} />
        {cartCount > 0 && <span className="badge-count">{cartCount}</span>}
      </button>

      {showDropdown && (
        <div className="dropdown-panel">
          <div className="dropdown-header">
            <span>Sản phẩm mới thêm</span>
          </div>

          <div className="dropdown-body">
            {!cartItems || cartItems.length === 0 ? (
              <div className="empty-state">
                <ShoppingBag size={48} className="empty-icon" />
                <span>Chưa có sản phẩm nào</span>
              </div>
            ) : (
              cartItems.slice(0, 5).map((item, idx) => (
                <div key={idx} className="cart-item-row" onClick={handleToCart}>
                  <img
                    src={item.product?.image || "/media/default-product.png"}
                    alt="product"
                    className="cart-img-thumb"
                    onError={(e) => (e.target.src = "https://placehold.co/50x50?text=No+Img")}
                  />
                  <div className="cart-info">
                    <div className="cart-name" title={item.product?.name}>
                        {item.product?.name}
                    </div>
                    {/* Giả sử có phân loại hàng */}
                    {item.variant && <div className="cart-variant">{item.variant}</div>}
                    
                    <div className="cart-price-row">
                      <span className="price-highlight">{formatPrice(item.product?.price)}</span>
                      <span className="qty-text">x{item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cartItems && cartItems.length > 0 && (
            <div className="dropdown-footer">
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px'}}>
                <span style={{color: '#64748b'}}>Tạm tính:</span>
                <span style={{fontWeight: '700', color: '#ef4444'}}>{formatPrice(subTotal)}</span>
              </div>
              <button className="btn-primary-full" onClick={handleToCart}>
                Xem Giỏ Hàng
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CartDropdown;