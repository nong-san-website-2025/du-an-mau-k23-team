import React from 'react';
import { useCart } from '../CartContext';
import { formatVND } from '../../stores/components/StoreDetail/utils/utils';
import { intcomma } from '../../../utils/format';

const CartSummary = () => {
  const { cartItems, loading } = useCart();
  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="cart-summary">
      <h3>Tổng số lượng: {totalQuantity}</h3>
      <h2>Tổng tiền: {intcomma(total)}</h2>
      <button disabled={loading || cartItems.length === 0} onClick={() => alert('Chuyển đến trang thanh toán')}>Thanh toán</button>
    </div>
  );
};

export default CartSummary;
