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

  // Tính tổng tiền các sản phẩm đã chọn (fix lỗi NaN)
  const selectedTotal = cartItems
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => {
      const price = Number(item.product?.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + price * quantity;
    }, 0);

  return (
    <Container className="py-5">
      <Card className="shadow border-0 rounded-5 p-4 mb-4" style={{ background: "#fff" }}>
        <div style={{
          background: `linear-gradient(90deg, ${green} 60%, ${darkGreen} 100%)`,
          borderRadius: 18,
          padding: '32px 24px 24px 24px',
          marginBottom: 32,
          color: '#fff',
          boxShadow: '0 2px 16px rgba(34,197,94,0.10)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, opacity: 0.95, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bi bi-bag-check-fill" style={{ fontSize: 24, marginRight: 8 }}></i>
            Giỏ hàng nổi bật
          </div>
          <h1 style={{ fontWeight: 800, fontSize: '2.3rem', margin: 0, letterSpacing: 1 }}>🛒 Giỏ hàng của bạn</h1>
          <div style={{ fontSize: 16, marginTop: 10, opacity: 0.93 }}>
            Khám phá các sản phẩm bạn đã chọn, kiểm tra lại số lượng và tiến hành thanh toán nhanh chóng, an toàn.
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <Badge bg="light" text="success" style={{ fontWeight: 500, fontSize: 15, padding: '8px 16px', borderRadius: 8, background: '#fff', color: green, border: `1.5px solid ${green}` }}>Giao hàng nhanh</Badge>
            <Badge bg="light" text="success" style={{ fontWeight: 500, fontSize: 15, padding: '8px 16px', borderRadius: 8, background: '#fff', color: green, border: `1.5px solid ${green}` }}>Đảm bảo chất lượng</Badge>
            <Badge bg="light" text="success" style={{ fontWeight: 500, fontSize: 15, padding: '8px 16px', borderRadius: 8, background: '#fff', color: green, border: `1.5px solid ${green}` }}>Hỗ trợ 24/7</Badge>
          </div>
        </div>
        <Row>
          <Col md={8} className="mb-4 mb-md-0">
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
            <div style={{ width: '100%' }}>
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
          <Col md={4}>
            {/* Hiện tổng tiền chỉ của các sản phẩm đã chọn */}
            <Card className="shadow-sm border-0 rounded-4 p-4" style={{ background: '#fff', marginBottom: 18, boxShadow: '0 2px 16px #22C55E22' }}>
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
                <Button
                  size="lg"
                  disabled={selectedItems.length === 0}
                  style={{
                    minWidth: 180,
                    maxWidth: 260,
                    alignSelf: 'flex-end',
                    marginRight: 32,
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
              </div>
              {/* Green-style pay button hover effect */}
              <style>{`
                .cjx-pay-btn:not(:disabled):hover {
                  background: linear-gradient(90deg, #16A34A 0%, #22C55E 100%) !important;
                  color: #fff !important;
                  box-shadow: 0 6px 24px #22C55E44 !important;
                  transform: translateY(-2px) scale(1.01);
                }
              `}</style>
            </Card>
          </Col>
        </Row>
      </Card>
    </Container>
  );
};

export default CartPage;