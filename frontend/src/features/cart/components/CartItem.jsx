import React from 'react';
import { useCart } from '../services/CartContext';
import '../styles/AppCart.css'; // Assuming you have a CSS file for styling

const CartItem = ({ item, showPrice = true }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="cart-item">
      <img src={item.image} alt={item.product?.name || ''} width={80} />
      <div className="cart-item-info">
        <h4>{item.product?.name || ''}</h4>
        {showPrice && item.product && (
          <p>Giá: {Number(item.product.price || 0).toLocaleString()}₫</p>
        )}
        <div className="cart-item-actions">
          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
          <input
            type="number"
            value={item.quantity}
            min={0}
            onChange={e => updateQuantity(item.id, Number(e.target.value))}
            style={{ width: 40 }}
          />
          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
          <button onClick={() => removeFromCart(item.id)} style={{ marginLeft: 10 }}>Xóa</button>
        </div>
        {showPrice && item.product && (
          <p>Tổng: {Number(item.product.price * item.quantity || 0).toLocaleString()}₫</p>
        )}
      </div>
    </div>
  );
};

export default CartItem;
