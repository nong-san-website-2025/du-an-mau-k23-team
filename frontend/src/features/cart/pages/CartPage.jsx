import React from 'react';
import { useCart } from '../services/CartContext';
import CartItem from '../components/CartItem';
import { Container, Row, Col, Card, Button, Spinner, Image, Badge } from 'react-bootstrap';

const green = "#22C55E";
const darkGreen = "#16A34A";// Xanh lá nhạt, đồng bộ với tổng thể trang

const CartPage = () => {
  const { cartItems, loading } = useCart();
  // State for selected items
  const [selectedItems, setSelectedItems] = React.useState([]);

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

  // Calculate total for selected items
  const selectedTotal = React.useMemo(() => {
    return cartItems
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => {
        return sum + (Number(item.product?.price || 0) * Number(item.quantity || 0));
      }, 0);
  }, [cartItems, selectedItems]);

  return (
    <Container className="py-0 d-flex flex-column" style={{ margin: 0, minWidth: '100vw', minHeight: '100vh', position: 'relative' }}>
      <Card className="shadow border-0 rounded-5 p-4 mb-4 flex-grow-1" style={{ background: "#fff", display: 'flex', flexDirection: 'row', minHeight: '60vh' }}>
        <Row style={{ width: '100%' }}>
          <Col md={8} className="mb-4 mb-md-0" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header row Shopee-style */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'linear-gradient(90deg, #f8fafc 60%, #e0f7ef 100%)',
              borderRadius: 16,
              border: '1.5px solid #e0e7ef',
              padding: '18px 32px 18px 28px',
              marginBottom: 18,
              fontWeight: 800,
              fontSize: 18,
              color: '#1a2b3c',
              boxShadow: '0 2px 16px #22C55E11',
              letterSpacing: 0.3,
              position: 'relative',
              zIndex: 2,
            }}>
              <span style={{ minWidth: 220, flex: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="bi bi-box-seam" style={{ color: '#22C55E', fontSize: 22, marginRight: 6 }}></i>
                Sản Phẩm
              </span>
              <span style={{ minWidth: 120, textAlign: 'center', flex: 1, color: '#16A34A', fontWeight: 700 }}>Đơn Giá</span>
              <span style={{ minWidth: 110, textAlign: 'center', flex: 1, color: '#0d9488', fontWeight: 700 }}>Số Lượng</span>
              <span style={{ minWidth: 120, textAlign: 'center', flex: 1, color: '#22C55E', fontWeight: 700 }}>Số Tiền</span>
            </div>
            {/* Table-like layout for cart items */}
            <div style={{ width: '100%', flexGrow: 1, overflowY: 'auto' }}>
              {cartItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#fafffc',
                    border: '1.5px solid #e0e7ef',
                    borderRadius: 16,
                    minHeight: 90,
                    marginBottom: 18,
                    boxShadow: '0 2px 12px #22C55E11',
                    transition: 'box-shadow 0.2s',
                    padding: '0 0 0 18px',
                    position: 'relative',
                  }}
                >
                  {/* Sản phẩm */}
                  <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 18 }}>
                    {/* Checkbox bên trái sản phẩm */}
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      style={{ accentColor: '#FFD600', width: 22, height: 22, marginRight: 10, marginLeft: 2, boxShadow: '0 1px 4px #FFD60033', borderRadius: 6, border: '2px solid #FFD600' }}
                      title="Chọn sản phẩm"
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <CartItem item={item} />
                    </div>
                  </div>
                  {/* Đơn giá */}
                  <div style={{ flex: 1, minWidth: 120, textAlign: 'center', fontWeight: 700, color: '#16A34A', fontSize: 18, background: '#f0fdf4', borderRadius: 8, padding: '8px 0' }}>
                    {item.product?.price ? Number(item.product.price).toLocaleString('vi-VN') + '₫' : '--'}
                  </div>
                  {/* Số lượng */}
                  <div style={{ flex: 1, minWidth: 110, textAlign: 'center', fontWeight: 700, color: '#0d9488', fontSize: 18, background: '#ecfeff', borderRadius: 8, padding: '8px 0' }}>
                    {item.quantity}
                  </div>
                  {/* Số tiền */}
                  <div style={{ flex: 1, minWidth: 120, textAlign: 'center', fontWeight: 900, color: '#22C55E', fontSize: 19, background: '#f0fdf4', borderRadius: 8, padding: '8px 0' }}>
                    {item.product?.price ? (Number(item.product.price) * Number(item.quantity)).toLocaleString('vi-VN') + '₫' : '--'}
                  </div>
                </div>
              ))}
            </div>
            {/* Tổng số lượng và nút chọn tất cả ở dưới khung sản phẩm */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
              marginBottom: 18,
              padding: '0 24px 0 8px',
              fontWeight: 700,
              fontSize: 16,
              color: '#222',
              gap: 8,
            }}>
              {/* Nút chọn tất cả */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', marginLeft: 2 }}>
                <input
                  type="checkbox"
                  checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                  ref={el => {
                    if (el) el.indeterminate = selectedItems.length > 0 && selectedItems.length < cartItems.length;
                  }}
                  onChange={handleSelectAll}
                  style={{ accentColor: '#FFD600', width: 24, height: 24, boxShadow: '0 1px 4px #FFD60033', borderRadius: 7, border: '2px solid #FFD600', marginRight: 2 }}
                  title="Chọn tất cả sản phẩm"
                />
                <span style={{ fontWeight: 800, fontSize: 16, color: '#22C55E', letterSpacing: 0.2 }}>
                  {selectedItems.length === cartItems.length && cartItems.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#666', fontWeight: 500 }}>Tổng số lượng:</span>
                <span style={{
                  background: '#22C55E',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  borderRadius: 8,
                  padding: '3px 16px',
                  minWidth: 36,
                  display: 'inline-block',
                  textAlign: 'center',
                  letterSpacing: 0.5,
                  boxShadow: '0 1px 4px #22C55E22',
                  border: '1.5px solid #16A34A',
                }}>
                  {cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                </span>
              </div>
            </div>
          </Col>
          <Col md={4} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', height: '100%' }}>
            {/* Hiện tổng tiền chỉ của các sản phẩm đã chọn */}
            <Card className="shadow-sm border-0 rounded-4 p-4 flex-grow-0" style={{ background: '#fff', marginBottom: 18, boxShadow: '0 2px 16px #22C55E22' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 22, color: darkGreen }}>
                    Tổng&nbsp;
                    <span style={{ fontWeight: 700, fontSize: 17, color: green }}>({selectedItems.length} mặt hàng)</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: green, letterSpacing: 1 }}>
                    {selectedTotal.toLocaleString('vi-VN')}₫
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
      {/* Thanh toán button fixed bottom */}
      <div style={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        width: '100vw',
        background: '#fff',
        boxShadow: '0 -2px 16px #22C55E22',
        zIndex: 100,
        padding: '16px 0',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <Button
          size="lg"
          disabled={selectedItems.length === 0}
          style={{
            minWidth: 220,
            maxWidth: 320,
            borderRadius: 12,
            fontWeight: 900,
            fontSize: 22,
            padding: '16px 0 8px 0',
            background: selectedItems.length === 0
              ? '#f3f4f6'
              : 'linear-gradient(90deg, #22C55E 0%, #16A34A 100%)',
            color: selectedItems.length === 0 ? '#bdbdbd' : '#fff',
            border: 'none',
            boxShadow: selectedItems.length === 0 ? 'none' : '0 4px 18px #22C55E22',
            transition: 'all 0.2s',
            letterSpacing: 1,
            cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer',
            marginBottom: 2,
            marginTop: 8
          }}
          className={selectedItems.length === 0 ? '' : 'cjx-pay-btn'}
        >
          Thanh toán
        </Button>
        <style>{`
          .cjx-pay-btn:not(:disabled):hover {
            background: linear-gradient(90deg, #16A34A 0%, #22C55E 100%) !important;
            color: #fff !important;
            box-shadow: 0 6px 24px #22C55E44 !important;
            transform: translateY(-2px) scale(1.01);
          }
        `}</style>
      </div>
    </Container>
  );
};

export default CartPage;
