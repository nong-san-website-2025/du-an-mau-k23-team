"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Container, Row, Col, Card, Button, Form, InputGroup, Badge } from "react-bootstrap"
import { Search, Heart, Trash2, ShoppingCart, Filter, Leaf, CheckCircle, XCircle } from "lucide-react"
import TopBanner from "./components/TopBanner";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wishlist")) || []
    } catch {
      return []
    }
  })
  const [filter, setFilter] = useState({ status: "", category: "" })
  const [search, setSearch] = useState(() => {
    try {
      return localStorage.getItem("wishlist_search") || ""
    } catch {
      return ""
    }
  })

  // Lưu search vào localStorage mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem("wishlist_search", search)
  }, [search])
  const navigate = useNavigate()

  const handleRemove = (id) => {
    const newList = wishlist.filter((item) => item.id !== id)
    setWishlist(newList)
    localStorage.setItem("wishlist", JSON.stringify(newList))
  }

  function filteredWishlist() {
    return wishlist.filter((item) => {
      const matchName = item.name?.toLowerCase().includes(search.toLowerCase())
      const matchStatus =
        filter.status === "" ||
        (filter.status === "conhang" && item.inStock) ||
        (filter.status === "hethang" && !item.inStock)
      return matchName && matchStatus
    })
  }

  const agriculturalStyles = {
    pageBackground: {
      background: "linear-gradient(135deg, #f8fdf8 0%, #e8f5e8 100%)",
      minHeight: "100vh",
    },
    headerSection: {
      background: "linear-gradient(135deg, #2d5016 0%, #4a7c59 100%)",
      color: "white",
      padding: "2rem 0",
      boxShadow: "0 4px 20px rgba(45, 80, 22, 0.3)",
    },
    filterSection: {
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      borderBottom: "3px solid #4a7c59",
      padding: "1.5rem 0",
    },
    productCard: {
      background: "white",
      borderRadius: "20px",
      border: "2px solid #e8f5e8",
      boxShadow: "0 8px 32px rgba(74, 124, 89, 0.1)",
      transition: "all 0.3s ease",
      overflow: "hidden",
    },
    productImage: {
      borderRadius: "15px",
      border: "3px solid #f0f8f0",
      transition: "transform 0.3s ease",
    },
    priceText: {
      color: "#d32f2f",
      fontWeight: "bold",
      fontSize: "1.4rem",
    },
    stockBadge: {
      fontSize: "0.9rem",
      padding: "0.5rem 1rem",
    },
  }

  return (
    <div style={agriculturalStyles.pageBackground}>

      {/* Filter and Search Section */}
      <div style={agriculturalStyles.filterSection}>
        <Container>
          <Row className="g-3 align-items-center">
            <Col lg={2} md={3} sm={6}>
              <Button
                variant={filter.status === "" && filter.category === "" ? "success" : "outline-success"}
                className="w-100 fw-semibold"
                onClick={() => setFilter({ status: "", category: "" })}
              >
                <Filter size={16} className="me-2" />
                Tất Cả
              </Button>
            </Col>

            <Col lg={2} md={3} sm={6}>
              <Form.Select
                value={filter.status}
                onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
                className="border-success"
              >
                <option value="">Trạng thái</option>
                <option value="conhang">Còn hàng</option>
                <option value="hethang">Hết hàng</option>
              </Form.Select>
            </Col>
            <Col lg={6} md={3} sm={6} className="d-flex align-items-center">
              <div style={{ position: 'relative', width: '100%', maxWidth: 380, marginLeft: 'auto', marginRight: 0 }}>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm nông sản yêu thích..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    borderRadius: 24,
                    fontSize: 18,
                    padding: '8px 44px 8px 18px',
                    height: 40,
                    border: '1.5px solid #22c55e',
                    boxShadow: 'none',
                    fontStyle: 'italic',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Search size={22} color="#22c55e" />
                </span>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Content Section */}
      <Container className="py-5">
        {filteredWishlist().length === 0 ? (
          <Row className="justify-content-center">
            <Col lg={6} className="text-center">
              <div className="py-5">
                <div className="mb-4">
                  <img
                    src="/empty-basket-with-vegetables.jpg"
                    alt="Giỏ trống"
                    className="img-fluid opacity-75"
                    style={{ maxWidth: "150px" }}
                  />
                </div>
                <h3 className="text-muted mb-3">Chưa có nông sản yêu thích</h3>
                <p className="text-muted mb-4">
                  Hãy khám phá và thêm những sản phẩm tươi ngon vào danh sách yêu thích của bạn!
                </p>
                <Button
                  variant="success"
                  size="lg"
                  className="px-4 py-2 fw-bold"
                  onClick={() => (window.location.href = "/")}
                >
                  <ShoppingCart className="me-2" size={20} />
                  Khám Phá Nông Sản
                </Button>
              </div>
            </Col>
          </Row>
        ) : (
          <>
            <Row>
              <Col>
                <h2
                  className="text-center fw-bold text-success"
                  style={{ marginTop: -40, marginBottom: 20 }}
                >
                  🌱 Nông Sản Tươi Ngon Yêu Thích
                </h2>
                <p
                  className="text-center text-muted"
                  style={{ marginTop: 0, marginBottom: 20 }}
                >
                  {filteredWishlist().length} sản phẩm trong danh sách của bạn
                </p>
              </Col>
            </Row>

            <Row className="g-4">
              {filteredWishlist().map((item) => (
                <Col key={item.id} xl={3} lg={4} md={6} sm={6}>
                  <Card
                    className="h-100 position-relative"
                    style={agriculturalStyles.productCard}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-8px)"
                      e.currentTarget.style.boxShadow = "0 16px 48px rgba(74, 124, 89, 0.2)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)"
                      e.currentTarget.style.boxShadow = "0 8px 32px rgba(74, 124, 89, 0.1)"
                    }}
                  >
                    {/* Remove Button */}
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="position-absolute top-0 end-0 m-3 rounded-circle"
                      style={{ zIndex: 10, width: "40px", height: "40px" }}
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 size={16} />
                    </Button>

                    <Card.Body className="p-4 text-center">
                      {/* Product Image */}
                      <div className="mb-3 position-relative" style={{margin: 0, padding: 0}}>
                        {/* Stock Badge Top-Left */}
                        <Badge
                          bg={item.inStock ? "success" : "secondary"}
                          style={{
                            ...agriculturalStyles.stockBadge,
                            position: 'absolute',
                            top: 0,
                            left: -12,
                            margin: -25,
                            zIndex: 10,
                          }}
                        >
                          {item.inStock ? (
                            <>
                              <CheckCircle size={14} className="me-1" />
                              Còn hàng
                            </>
                          ) : (
                            <>
                              <XCircle size={14} className="me-1" />
                              Hết hàng
                            </>
                          )}
                        </Badge>
                        <img
                          src={item.image || "/placeholder.svg?height=400&width=400&query=fresh vegetables and fruits"}
                          alt={item.name}
                          className="img-fluid"
                          style={{
                            display: 'block',
                            width: '100%',
                            height: '260px',
                            objectFit: 'cover',
                            borderRadius: '18px',
                            border: '0',
                            margin: 0,
                            padding: 0,
                            boxShadow: '0 2px 12px #e8f5e8',
                            transition: 'transform 0.3s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                          onClick={() => navigate(`/products/${item.id}`)}
                        />
                      </div>

                      {/* Product Info */}
                      <h5 className="fw-bold text-dark" style={{ minHeight: "5px", lineHeight: "1.2", marginBottom: 2 }}>
                        {item.name}
                      </h5>
                      <div style={{ ...agriculturalStyles.priceText, marginBottom: 10, marginTop: 2 }}>
                        {item.price?.toLocaleString()} đ
                      </div>


                      <div className="d-grid">
                        <Button
                          variant="success"
                          className="fw-semibold"
                          onClick={() => navigate(`/products/${item.id}`)}
                          disabled={!item.inStock}
                        >
                          <ShoppingCart size={16} className="me-2" />
                          {item.inStock ? "Xem Chi Tiết" : "Hết Hàng"}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Container>
    </div>
  )
}

export default Wishlist
