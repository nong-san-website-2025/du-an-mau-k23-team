
import React from 'react';
import { useCart } from '../services/CartContext';
import { formatVND } from '../../stores/components/StoreDetail/utils/utils';
import '../styles/AppCart.css';

const CartItem = ({ item, showPrice = true, buttonStyleOverrides = {} }) => {
  const { updateQuantity, removeFromCart } = useCart();

  // Style overrides
  const minusStyle = buttonStyleOverrides.minus || {};
  const plusStyle = buttonStyleOverrides.plus || {};
  const inputWrapStyle = buttonStyleOverrides.inputWrap || {};
  const inputStyle = buttonStyleOverrides.input || {};
  const dividerStyle = buttonStyleOverrides.divider || {};
  const deleteStyle = buttonStyleOverrides.delete || {};

  // Get product info and price
  const productData = item.product_data || item.product || {};
  const productName = productData?.name || '';
  const currentPrice = productData?.price || item.price || 0;
  const originalPrice = productData?.original_price || 0;
  const hasFlashSale = productData?.flash_sale_price && productData?.flash_sale_price < (originalPrice || currentPrice);
  const discountPercent = productData?.discount_percent || 0;

  return (
    <div className="cart-item" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0' }}>
      <img src={item.image} alt={productName} width={64} style={{ borderRadius: 8, boxShadow: '0 1px 4px #0001' }} />
      <div className="cart-item-info" style={{ flex: 1 }}>
        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#222' }}>{productName}</h4>
        {showPrice && (
          <p style={{ margin: '2px 0 8px 0', color: '#888', fontSize: 14 }}>
            Giá: 
            {hasFlashSale && originalPrice > 0 && (
              <span style={{ textDecoration: 'line-through', marginLeft: 6, color: '#ccc', fontWeight: 400 }}>{formatVND(originalPrice)}</span>
            )}
            <span style={{ color: hasFlashSale ? '#ef4444' : '#16A34A', fontWeight: 600, marginLeft: 8 }}>{formatVND(currentPrice)}</span>
            {hasFlashSale && <span style={{ color: '#ef4444', fontWeight: 600, marginLeft: 8 }}>-{discountPercent}%</span>}
          </p>
        )}
        <div className="cart-item-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              width: 36,
              height: 36,
              fontSize: 20,
              color: '#222',
              background: '#fff',
              cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
              opacity: item.quantity <= 1 ? 0.5 : 1,
              transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700,
              boxShadow: 'none',
              padding: 0,
            }}
            disabled={item.quantity <= 1}
            title="Giảm"
          >
            <span style={{ fontWeight: 700, fontSize: 20, lineHeight: 1 }}>-</span>
          </button>
          <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700, fontSize: 18, color: '#222', display: 'inline-block' }}>{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              width: 36,
              height: 36,
              fontSize: 20,
              color: '#222',
              background: '#fff',
              cursor: 'pointer',
              transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700,
              boxShadow: 'none',
              padding: 0,
            }}
            title="Tăng"
          >
            <span style={{ fontWeight: 700, fontSize: 20, lineHeight: 1 }}>+</span>
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => removeFromCart(item.id)}
            style={{
              marginLeft: 8,
              background: 'transparent',
              color: '#dc2626',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
       
              transition: 'background 0.2s',
              cursor: 'pointer',
              boxShadow: 'none',
              padding: 0,
            }}
            title="Xóa sản phẩm"
            onMouseOver={e => e.currentTarget.style.background = '#fee2e2'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Professional, minimal Material Design trash bin icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="7.5" width="14" height="11" rx="2.2" stroke="#dc2626" strokeWidth="1.4" fill="#fff"/>
              <path d="M9.5 10.5V16.5" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M12 10.5V16.5" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M14.5 10.5V16.5" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round"/>
              <rect x="8" y="4" width="8" height="3" rx="1.5" stroke="#dc2626" strokeWidth="1.2" fill="#fff"/>
              <path d="M3 7.5H21" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
