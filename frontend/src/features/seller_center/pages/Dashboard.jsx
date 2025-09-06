import { Container, Row, Col, Card, Badge, ListGroup, Alert } from "react-bootstrap"
import { TrendingUp, ShoppingCart, Bell, DollarSign, Calendar, Star } from "lucide-react"

const Dashboard = () => {
  // Sample data
  const salesData = {
    today: 2450000,
    week: 15680000,
    month: 68900000,
  }

  const orderStats = {
    newOrders: 24,
    processing: 12,
  }

  const topProducts = [
    { name: "Cà chua cherry", sold: 156, revenue: 3120000 },
    { name: "Rau xà lách hữu cơ", sold: 89, revenue: 2670000 },
    { name: "Cà rót tím", sold: 67, revenue: 2010000 },
    { name: "Ớt chuông đỏ", sold: 45, revenue: 1800000 },
  ]

  const notifications = [
    { type: "success", message: "Đơn hàng #DH001 đã được giao thành công", time: "5 phút trước" },
    { type: "warning", message: 'Sản phẩm "Cà chua cherry" sắp hết hàng', time: "15 phút trước" },
    { type: "info", message: "Có 3 đánh giá mới từ khách hàng", time: "1 giờ trước" },
  ]

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center gap-3 mb-2">
            <div
              className="p-2 rounded-circle"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
            >
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="mb-0 fw-bold text-balance">Tổng quan cửa hàng</h2>
              <p className="text-muted mb-0">Theo dõi hiệu suất kinh doanh của bạn</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Sales Overview */}
      <Row className="mb-4">
        <Col lg={4} md={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1 small">Doanh số hôm nay</p>
                  <h4 className="mb-0 fw-bold" style={{ color: "var(--color-primary)" }}>
                    {formatCurrency(salesData.today)}
                  </h4>
                </div>
                <div className="p-3 rounded-circle" style={{ backgroundColor: "var(--color-primary)", opacity: 0.1 }}>
                  <DollarSign size={24} style={{ color: "var(--color-primary)" }} />
                </div>
              </div>
              <div className="mt-2">
                <Badge bg="success" className="small">
                  +12.5%
                </Badge>
                <span className="text-muted small ms-2">so với hôm qua</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} md={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1 small">Doanh số tuần</p>
                  <h4 className="mb-0 fw-bold" style={{ color: "var(--color-accent)" }}>
                    {formatCurrency(salesData.week)}
                  </h4>
                </div>
                <div className="p-3 rounded-circle" style={{ backgroundColor: "var(--color-accent)", opacity: 0.1 }}>
                  <Calendar size={24} style={{ color: "var(--color-accent)" }} />
                </div>
              </div>
              <div className="mt-2">
                <Badge bg="success" className="small">
                  +8.2%
                </Badge>
                <span className="text-muted small ms-2">so với tuần trước</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} md={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1 small">Doanh số tháng</p>
                  <h4 className="mb-0 fw-bold" style={{ color: "var(--color-chart-4)" }}>
                    {formatCurrency(salesData.month)}
                  </h4>
                </div>
                <div className="p-3 rounded-circle" style={{ backgroundColor: "var(--color-chart-4)", opacity: 0.1 }}>
                  <TrendingUp size={24} style={{ color: "var(--color-chart-4)" }} />
                </div>
              </div>
              <div className="mt-2">
                <Badge bg="success" className="small">
                  +15.7%
                </Badge>
                <span className="text-muted small ms-2">so với tháng trước</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Orders and Products */}
      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pb-0">
              <div className="d-flex align-items-center gap-2">
                <ShoppingCart size={20} style={{ color: "var(--color-primary)" }} />
                <h5 className="mb-0 fw-semibold">Đơn hàng</h5>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col sm={6}>
                  <div className="text-center p-3 rounded" style={{ backgroundColor: "var(--color-muted)" }}>
                    <h3 className="mb-1 fw-bold" style={{ color: "var(--color-primary)" }}>
                      {orderStats.newOrders}
                    </h3>
                    <p className="text-muted mb-0 small">Đơn hàng mới</p>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="text-center p-3 rounded" style={{ backgroundColor: "var(--color-muted)" }}>
                    <h3 className="mb-1 fw-bold" style={{ color: "var(--color-accent)" }}>
                      {orderStats.processing}
                    </h3>
                    <p className="text-muted mb-0 small">Đang xử lý</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pb-0">
              <div className="d-flex align-items-center gap-2">
                <Star size={20} style={{ color: "var(--color-accent)" }} />
                <h5 className="mb-0 fw-semibold">Sản phẩm bán chạy</h5>
              </div>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {topProducts.map((product, index) => (
                  <ListGroup.Item key={index} className="px-0 py-2 border-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                          style={{
                            width: "32px",
                            height: "32px",
                            backgroundColor: index === 0 ? "var(--color-primary)" : "var(--color-muted-foreground)",
                            fontSize: "14px",
                          }}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="mb-0 fw-medium">{product.name}</p>
                          <small className="text-muted">Đã bán: {product.sold}</small>
                        </div>
                      </div>
                      <div className="text-end">
                        <p className="mb-0 fw-semibold" style={{ color: "var(--color-primary)" }}>
                          {formatCurrency(product.revenue)}
                        </p>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Notifications */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pb-0">
              <div className="d-flex align-items-center gap-2">
                <Bell size={20} style={{ color: "var(--color-primary)" }} />
                <h5 className="mb-0 fw-semibold">Thông báo hệ thống</h5>
              </div>
            </Card.Header>
            <Card.Body>
              {notifications.map((notification, index) => (
                <Alert
                  key={index}
                  variant={
                    notification.type === "success" ? "success" : notification.type === "warning" ? "warning" : "info"
                  }
                  className="mb-2 py-2"
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <p className="mb-0 small">{notification.message}</p>
                    <small className="text-muted">{notification.time}</small>
                  </div>
                </Alert>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Dashboard
