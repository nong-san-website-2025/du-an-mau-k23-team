import React from 'react';
import { useCart } from '../CartContext';
import CartItem from '../components/CartItem';
// import CartSummary from '../components/CartSummary';
import { Container, Row, Col, Card, Button, Spinner, Image, Badge } from 'react-bootstrap';

const green = "#22C55E";
const darkGreen = "#16A34A";
const mintLight = "#f6fff8"; // Xanh lá nhạt, đồng bộ với tổng thể trang

const CartPage = () => {
  const { cartItems, loading } = useCart();
  // State for selected items
  const [selectedItems, setSelectedItems] = React.useState([]);
  const [showSuccess, setShowSuccess] = React.useState(false);


  // Handler for select one item
  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Handler for select all
  const handleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => item.id));
    }
  };

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
        <Button href="/" size="lg" style={{
          borderRadius: 12,
          fontWeight: 700,
          padding: '12px 36px',
          background: green,
          border: 'none',
          fontSize: '1.1rem',
          boxShadow: '0 2px 8px rgba(34,197,94,0.10)'
        }}>
          Tiếp tục mua sắm
        </Button>
      </Container>
    );
  }

  // Tính tổng tiền và tổng số lượng các sản phẩm đã chọn
  const selectedItemsData = cartItems.filter(item => selectedItems.includes(item.id));
  const selectedTotal = selectedItemsData.reduce((sum, item) => {
    const price = Number(item.product?.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return sum + price * quantity;
  }, 0);
  const selectedQuantity = selectedItemsData.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <Container className="py-5">
      <h1 style={{ fontWeight: 900, fontSize: 32, marginBottom: 32, color: darkGreen, letterSpacing: 0.5 }}>Giỏ hàng của bạn</h1>
      <div style={{ display: 'flex', gap: 32, alignItems: 'stretch' }}>
        {/* LEFT: Danh sách sản phẩm */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', paddingLeft: 24 }}>
          <Card className="shadow border-0 rounded-4 p-4 h-100" style={{ background: "#fff", minHeight: 420, height: '100%' }}>
            {/* Header row với checkbox tổng */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f8f9fa',
              borderRadius: 10,
              minHeight: 44,
              marginBottom: 16,
              fontWeight: 700,
              color: green,
              fontSize: 16,
              padding: '0 0 0 18px',
              boxShadow: '0 1px 4px #00000005',
              letterSpacing: 0.2,
            }}>
              <span style={{ flex: 2 }}>Sản phẩm</span>
              <span style={{ flex: 1, textAlign: 'center' }}>Đơn giá</span>
              <span style={{ flex: 1, textAlign: 'center' }}>Số lượng</span>
              <span style={{ flex: 1, textAlign: 'center' }}>Số tiền</span>
            </div>
            {cartItems.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#fff',
                  border: `1.2px solid #ebe5e8ff`,
                  borderRadius: 8,
                  minHeight: 72,
                  marginBottom: 10,
                  boxShadow: '0 1px 4px #00000008',
                  padding: '0 0 0 4px',
                  position: 'relative',
                  transition: 'box-shadow 0.2s, border 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.boxShadow = '0 2px 8px #22C55E22';
                  e.currentTarget.style.border = `1.2px solid ${green}`;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.boxShadow = '0 1px 4px #00000008';
                  e.currentTarget.style.border = '1.2px solid #e5e7eb';
                }}
              >
                {/* Checkbox chọn sản phẩm - gọn, đẹp, hiện đại */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minWidth: 38 }}>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 6,
                      border: `2px solid ${green}`,
                      accentColor: green,
                      boxShadow: '0 1px 4px #22C55E22',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s',
                      outline: 'none',
                    }}
                    onMouseOver={e => e.target.style.boxShadow = '0 2px 8px #22C55E44'}
                    onMouseOut={e => e.target.style.boxShadow = '0 1px 4px #22C55E22'}
                  />
                </div>
                {/* Sản phẩm */}
                <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <CartItem
                    item={item}
                    buttonStyleOverrides={{
                      minus: {
                        background: 'transparent',
                        color: '#222',
                        border: 'none',
                        borderRadius: 0,
                        fontWeight: 700,
                        fontSize: 18,
                        width: 28,
                        height: 28,
                        margin: 0,
                        padding: 0,
                        lineHeight: 1,
                        transition: 'background 0.2s',
                        boxShadow: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                      plus: {
                        background: 'transparent',
                        color: '#222',
                        border: 'none',
                        borderRadius: 0,
                        fontWeight: 700,
                        fontSize: 18,
                        width: 28,
                        height: 28,
                        margin: 0,
                        padding: 0,
                        lineHeight: 1,
                        transition: 'background 0.2s',
                        boxShadow: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                      inputWrap: {
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 7,
                        display: 'flex',
                        alignItems: 'center',
                        minWidth: 78,
                        height: 28,
                        padding: 0,
                        boxShadow: 'none',
                        overflow: 'hidden',
                      },
                      input: {
                        border: 'none',
                        background: 'transparent',
                        width: 28,
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: 15,
                        color: '#222',
                        outline: 'none',
                        boxShadow: 'none',
                        padding: 0,
                      },
                      divider: {
                        width: 1,
                        height: 18,
                        background: '#e5e7eb',
                        margin: 0,
                      },
                      delete: {
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: 5,
                        fontWeight: 600,
                        fontSize: 14,
                        marginLeft: 6,
                        padding: '4px 10px',
                        transition: 'background 0.2s',
                      }
                    }}
                  />
                </div>
                {/* Đơn giá */}
                <div style={{ flex: 1, minWidth: 120, textAlign: 'center', fontWeight: 700, color: '#111', fontSize: 18, padding: '8px 0' }}>
                  {item.product?.price ? Number(item.product.price).toLocaleString('vi-VN') + '₫' : '--'}
                </div>
                {/* Số lượng */}
                <div style={{ flex: 1, minWidth: 100, textAlign: 'center', fontWeight: 700, color: '#111', fontSize: 18, padding: '8px 0' }}>
                  {item.quantity}
                </div>
                {/* Số tiền */}
                <div style={{ flex: 1, minWidth: 120, textAlign: 'center', fontWeight: 700, color: '#16A34A', fontSize: 18, padding: '8px 0' }}>
                  {item.product?.price ? (Number(item.product.price) * Number(item.quantity)).toLocaleString('vi-VN') + '₫' : '--'}
                </div>
              </div>
            ))}
            {/* Nút chọn tất cả dưới cùng */}
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
              <Button
                size="sm"
                style={{
                  fontWeight: 600,
                  borderRadius: 6,
                  minWidth: 110,
                  padding: '4px 14px',
                  fontSize: 15,
                  background: selectedItems.length === cartItems.length && cartItems.length > 0 ? green : '#fff',
                  color: selectedItems.length === cartItems.length && cartItems.length > 0 ? '#fff' : green,
                  border: `2px solid ${green}`,
                  boxShadow: selectedItems.length === cartItems.length && cartItems.length > 0 ? '0 2px 8px #22C55E33' : 'none',
                  transition: 'all 0.2s',
                }}
                onClick={handleSelectAll}
              >
                {selectedItems.length === cartItems.length && cartItems.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </Button>
              <span style={{ marginLeft: 14, color: '#888', fontSize: 15 }}>
                ({selectedItems.length}/{cartItems.length} sản phẩm được chọn)
              </span>
            </div>
          </Card>
        </div>
        {/* RIGHT: Tóm tắt đơn hàng */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: 12 }}>
          <div style={{
            background: '#fff',
            border: '1.5px solid #e5e7eb',
            borderRadius: 12,
            width: 340,
            minWidth: 320,
            maxWidth: 370,
            minHeight: 320,
            boxShadow: '0 1.5px 8px #00000008',
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            marginBottom: 16,
          }}>
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
              style={{
                width: '100%',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 16.5,
                padding: '11px 0 7px 0',
                background: selectedItems.length === 0 ? '#fff' : green,
                color: selectedItems.length === 0 ? green : '#fff',
                border: selectedItems.length === 0 ? `1.5px solid ${green}` : 'none',
                marginBottom: 7,
                marginTop: 2,
                boxShadow: 'none',
                letterSpacing: 0.2,
                cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: selectedItems.length === 0 ? 0.7 : 1,
              }}
              onClick={() => setShowSuccess(true)}
            >
              Tiến hành thanh toán
            </Button>
            {showSuccess && (
              <div style={{
                background: '#d1fae5',
                color: '#065f46',
                border: '1.5px solid #10b981',
                borderRadius: 8,
                padding: '14px 0',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: 17,
                marginBottom: 10,
                marginTop: 8,
                boxShadow: '0 2px 8px #10b98122',
                letterSpacing: 0.2,
              }}>
                Thanh toán thành công!
              </div>
            )}
            <Button
              href="/"
              style={{
                width: '100%',
                borderRadius: 6,
                fontWeight: 500,
                fontSize: 15.5,
                padding: '9px 0',
                marginTop: 0,
                background: '#fff',
                color: '#111',
                border: '1.5px solid #111',
                boxShadow: 'none',
                transition: 'all 0.2s',
              }}
            >
              Tiếp tục mua sắm
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default CartPage;