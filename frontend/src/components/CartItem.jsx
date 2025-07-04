import React from 'react';
import { useCart } from '../CartContext';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="cart-item">
      <img src={item.image} alt={item.product.name} width={80} />
      <div className="cart-item-info">
        <h4>{item.product.name}</h4>
        <p>Giá: {item.product.price.toLocaleString()}₫</p>
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
        <p>Tổng: {(item.product.price * item.quantity).toLocaleString()}₫</p>
      </div>
    </div>
  );
};

export default CartItem;
