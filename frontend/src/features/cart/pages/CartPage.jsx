import React from 'react';
import { useCart } from '../services/CartContext';
import { Container, Card, Button, Spinner, Image } from 'react-bootstrap';

const green = "#22C55E";
const darkGreen = "#16A34A";

function QuantityInput({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  const handleChange = (val) => {
    if (val > 0) {
      updateQuantity(item.id, val);
    } else {
      removeFromCart(item.id);
    }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button
        style={{ width: 28, height: 28, border: 'none', background: '#f3f4f6', color: '#222', borderRadius: 5, fontWeight: 700, fontSize: 18, cursor: 'pointer' }}
        onClick={() => handleChange(Number(item.quantity) - 1)}
      >-</button>
      <input
        type="number"
        min={1}
        value={item.quantity}
        onChange={e => handleChange(Number(e.target.value))}
        style={{ width: 38, textAlign: 'center', fontWeight: 600, fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 5, background: '#fff', padding: 0 }}
      />
      <button
        style={{ width: 28, height: 28, border: 'none', background: '#f3f4f6', color: '#222', borderRadius: 5, fontWeight: 700, fontSize: 18, cursor: 'pointer' }}
        onClick={() => handleChange(Number(item.quantity) + 1)}
      >+</button>
    </div>
  );
}

function CartPage() {
  const { cartItems, loading } = useCart();
  const [selectedItems, setSelectedItems] = React.useState([]);
  const [showSuccess, setShowSuccess] = React.useState(false);


  // Chọn tất cả
  const allChecked = cartItems.length > 0 && selectedItems.length === cartItems.length;
  const handleCheckAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(cartItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };
  // Chọn từng item
  const handleCheckItem = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  // Tính tổng tiền và tổng số lượng các sản phẩm đã chọn
  const selectedItemsData = cartItems.filter(item => selectedItems.includes(item.id));
  const selectedTotal = selectedItemsData.reduce((sum, item) => {
    const price = Number(item.product?.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return sum + price * quantity;
  }, 0);
  const selectedQuantity = selectedItemsData.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" style={{ color: green }} />
        <div className="mt-3" style={{ color: green, fontWeight: 600 }}>Đang tải giỏ hàng...</div>
      </Container>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Container className="py-5 d-flex flex-column align-items-center justify-content-center">
        <Image src="/empty-cart.png" alt="empty" width={180} className="mb-4" />
        <h2 className="mb-2 fw-bold" style={{ color: green }}>Giỏ hàng của bạn đang trống</h2>
        <p className="mb-3 text-secondary">Hãy chọn sản phẩm yêu thích và thêm vào giỏ hàng để mua sắm dễ dàng hơn!</p>
        <Button href="/productuser" size="lg" style={{ borderRadius: 12, fontWeight: 700, padding: '12px 36px', background: green, border: 'none', fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(34,197,94,0.10)' }}>
          Tiếp tục mua sắm
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-0">
      <h1 style={{ fontWeight: 900, fontSize: 32, marginBottom: 32, color: darkGreen, letterSpacing: 0.5 }}>Giỏ hàng của bạn</h1>
      <div style={{ display: 'flex', gap: 32, alignItems: 'stretch'}}>
        {/* LEFT: Danh sách sản phẩm */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', paddingLeft: 0 }}>
          <Card className="shadow border-0 rounded-4 p-4 h-100" style={{ background: "#fff", minHeight: 420, height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8f9fa', borderRadius: 10, minHeight: 44, marginBottom: 16, fontWeight: 700, color: green, fontSize: 16, padding: '0 0 0 18px', boxShadow: '0 1px 4px #00000005', letterSpacing: 0.2 }}>
              <input
                type="checkbox"
                checked={allChecked}
                onChange={handleCheckAll}
                style={{ width: 18, height: 18, marginRight: 8, accentColor: green }}
                aria-label="Chọn tất cả"
              />
              <span style={{ flex: 2 }}>Tên sản phẩm</span>
              <span style={{ flex: 1, textAlign: 'center' }}>Đơn giá</span>
              <span style={{ flex: 1, textAlign: 'center' }}>Số lượng</span>
              <span style={{ flex: 1, textAlign: 'center' }}>Số tiền</span>
            </div>
            {cartItems.map((item) => (
              <div
                key={item.id}
                style={{ display: 'flex', alignItems: 'center', background: '#fff', border: `1.2px solid #ebe5e8ff`, borderRadius: 8, minHeight: 72, marginBottom: 10, boxShadow: '0 1px 4px #00000008', padding: '0 0 0 4px', position: 'relative', transition: 'box-shadow 0.2s, border 0.2s' }}
                onMouseOver={e => {
                  e.currentTarget.style.boxShadow = '0 2px 8px #22C55E22';
                  e.currentTarget.style.border = `1.2px solid ${green}`;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.boxShadow = '0 1px 4px #00000008';
                  e.currentTarget.style.border = '1.2px solid #e5e7eb';
                }}
              >
                {/* Checkbox chọn item */}
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleCheckItem(item.id)}
                  style={{ width: 18, height: 18, marginRight: 8, accentColor: green }}
                  aria-label={`Chọn sản phẩm ${item.product?.name || ''}`}
                />
                {/* Tên sản phẩm + Ảnh */}
                <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600, color: '#222', fontSize: 17, paddingLeft: 8 }}>
                  {item.product?.image && (
                    <img
                      src={item.product.image}
                      alt=""
                      style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee', background: '#fafafa', marginRight: 6, boxShadow: '0 1px 4px #0001' }}
                    />
                  )}
                  <span>{item.product?.name || '---'}</span>
                </div>
                {/* Đơn giá */}
                <div style={{ flex: 1, minWidth: 120, textAlign: 'center', fontWeight: 700, color: '#111', fontSize: 18, padding: '8px 0' }}>
                  {item.product?.price ? Number(item.product.price).toLocaleString('vi-VN') + '₫' : '--'}
                </div>
                {/* Số lượng (có thể chỉnh) */}
                <div style={{ flex: 1, minWidth: 100, textAlign: 'center', fontWeight: 700, color: '#111', fontSize: 18, padding: '8px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <QuantityInput item={item} />
                </div>
                {/* Số tiền */}
                <div style={{ flex: 1, minWidth: 120, textAlign: 'center', fontWeight: 700, color: '#16A34A', fontSize: 18, padding: '8px 0' }}>
                  {item.product?.price ? (Number(item.product.price) * Number(item.quantity)).toLocaleString('vi-VN') + '₫' : '--'}
                </div>
              </div>
            ))}
          </Card>
        </div>
        {/* RIGHT: Tóm tắt đơn hàng */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: 12 }}>
          <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, width: 340, minWidth: 320, maxWidth: 370, minHeight: 320, boxShadow: '0 1.5px 8px #00000008', padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 21, color: '#111', marginBottom: 16, letterSpacing: 0.2 }}>Tóm tắt đơn hàng</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 400, fontSize: 15.5, marginBottom: 8 }}>
              <span>Tổng sản phẩm:</span>
              <span>{selectedQuantity} sản phẩm</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 400, fontSize: 15.5, marginBottom: 8 }}>
              <span>Tạm tính:</span>
              <span>{selectedTotal.toLocaleString('vi-VN')}₫</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 400, fontSize: 15.5, marginBottom: 8 }}>
              <span>Phí vận chuyển:</span>
              <span>Miễn phí</span>
            </div>
            <hr style={{ margin: '16px 0 12px 0', borderTop: '1.5px solid #eee' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 19, marginBottom: 16 }}>
              <span style={{ color: '#111' }}>Tổng cộng:</span>
              <span style={{ color: '#111' }}>{selectedTotal.toLocaleString('vi-VN')}₫</span>
            </div>
            <Button
              size="lg"
              disabled={selectedItems.length === 0}
              style={{ width: '100%', borderRadius: 6, fontWeight: 600, fontSize: 16.5, padding: '11px 0 7px 0', background: selectedItems.length === 0 ? '#fff' : green, color: selectedItems.length === 0 ? green : '#fff', border: selectedItems.length === 0 ? `1.5px solid ${green}` : 'none', marginBottom: 7, marginTop: 2, boxShadow: 'none', letterSpacing: 0.2, cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: selectedItems.length === 0 ? 0.7 : 1 }}
              onClick={() => setShowSuccess(true)}
            >
              Tiến hành thanh toán
            </Button>
            {showSuccess && (
              <div style={{ background: '#d1fae5', color: '#065f46', border: '1.5px solid #10b981', borderRadius: 8, padding: '14px 0', textAlign: 'center', fontWeight: 700, fontSize: 17, marginBottom: 10, marginTop: 8, boxShadow: '0 2px 8px #10b98122', letterSpacing: 0.2 }}>
                Thanh toán thành công!
              </div>
            )}
            <Button
              href="/productuser"
              style={{ width: '100%', borderRadius: 6, fontWeight: 500, fontSize: 15.5, padding: '9px 0', marginTop: 0, background: '#fff', color: '#111', border: '1.5px solid #111', boxShadow: 'none', transition: 'all 0.2s' }}
            >
              Tiếp tục mua sắm
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default CartPage;