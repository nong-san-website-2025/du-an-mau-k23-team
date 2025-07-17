import React from 'react';
import { useCart } from '../CartContext';
import CartItem from '../components/CartItem';
import CartSummary from '../components/CartSummary';
import { Container, Row, Col, Card, Button, Spinner, Image, Badge } from 'react-bootstrap';

const green = "#22C55E";
const darkGreen = "#16A34A";
const mintLight = "#f6fff8"; // Xanh lá nhạt, đồng bộ với tổng thể trang

const CartPage = () => {
  const { cartItems, loading } = useCart();

  if (loading) return (
    <Container className="py-5 text-center">
      <Spinner animation="border" style={{ color: green }} />
      <div className="mt-3" style={{ color: green, fontWeight: 600 }}>Đang tải giỏ hàng...</div>
    </Container>
  );

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
            {cartItems.map(item => (
              <Card
                className="mb-3 border-0 shadow-sm rounded-4"
                key={item.id}
                style={{
                  background: mintLight,
                  border: '1.5px solid #e2e8f0',
                  minHeight: 80,
                  maxHeight: 140,
                  overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(34,197,94,0.07)',
                  transition: 'box-shadow 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Card.Body style={{ padding: 24 }}>
                  <CartItem item={item} />
                </Card.Body>
              </Card>
            ))}
          </Col>
          <Col md={4}>
            <CartSummary />
          </Col>
        </Row>
      </Card>
    </Container>
  );
};

export default CartPage;