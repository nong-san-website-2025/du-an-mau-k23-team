"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Container, Row, Col, Card, Button, Form, InputGroup, Badge, Spinner } from "react-bootstrap"
import { Search, Heart, Trash2, ShoppingCart, Filter, Leaf, CheckCircle, XCircle, Star, Star as StarFill } from "lucide-react"
import TopBanner from "./components/TopBanner";
import { productApi } from "../../features/products/services/productApi";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api"

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

  // Recommended products by subcategory inferred from wishlist
  const [recommended, setRecommended] = useState({}) // { subcategoryName: Product[] }
  const [loadingRec, setLoadingRec] = useState(false)

  // Additional recommendation list reused from UserProductPage UI
  const [moreByUserPage, setMoreByUserPage] = useState([]) // flat list to render like UserProductPage cards
  const [suggestLimit, setSuggestLimit] = useState(12) // number of suggestions to show initially

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

  // Load recommended products based on wishlist categories/subcategories
  useEffect(() => {
    const loadRecommended = async () => {
      try {
        setLoadingRec(true)
        const wishlistArr = Array.isArray(wishlist) ? wishlist : []
        const wishlistIds = new Set(wishlistArr.map(p => p.id))

        // infer unique subcategory names or categories from wishlist items (if available)
        const subNames = Array.from(new Set((wishlistArr || [])
          .map(p => p.subcategory_name || p.subcategory?.name || null)
          .filter(Boolean)))

        // Build recommendations by product name + subcategory for each wishlist item
        try {
          const buildTerms = (raw) => {
            const n = (raw || "").toLowerCase().trim()
            const words = n.split(/\s+/).filter(w => w.length >= 3)
            const uniq = Array.from(new Set(words))
            const terms = []
            if (n) terms.push(n) // full name
            if (uniq[0]) terms.push(uniq[0])
            if (uniq[1]) terms.push(uniq[1])
            return terms.slice(0, 3)
          }

          const searchPromises = wishlistArr.flatMap((it) => {
            const name = it.name?.trim()
            const sub = it.subcategory_name || it.subcategory?.name || ""
            const terms = buildTerms(name)
            if (terms.length === 0) return [Promise.resolve([])]
            return terms.map((t) =>
              productApi
                .searchProducts(t, sub ? { subcategory: sub } : {})
                .then((res) => (Array.isArray(res) ? res : []))
                .catch(() => [])
            )
          })
          const byNameGroups = await Promise.all(searchPromises)
          const merged = []
          const seen = new Set()
          byNameGroups.flat().forEach((p) => {
            if (!p || wishlistIds.has(p.id) || seen.has(p.id)) return
            seen.add(p.id)
            merged.push(p)
          })

          if (merged.length > 0) {
            // Prefer name+subcategory based suggestions
            setMoreByUserPage(merged)
            setSuggestLimit(12)
          } else {
            // Fallback: categories with products (like UserProductPage)
            const categoriesData = await productApi.getCategoriesWithProducts()
            const allProducts = categoriesData.flatMap(c => c.subcategories?.flatMap(s => s.products || []) || [])
            const similar = allProducts
              .filter(p => !wishlistIds.has(p.id))
              .filter(p => subNames.length === 0 || subNames.includes(p.subcategory_name))
            setMoreByUserPage(similar)
            setSuggestLimit(12)
          }
        } catch (e) {
          setMoreByUserPage([])
          setSuggestLimit(12)
        }

        // Original subcategory-based fetch for grouped recommendations
        const requests = subNames.map((sub) =>
          axios.get(`${API_URL.replace(/\/$/, "")}/products/?subcategory=${encodeURIComponent(sub)}&ordering=-created_at`)
        )
        const resps = await Promise.all(requests)
        const dataBySub = {}
        resps.forEach((r, idx) => {
          const sub = subNames[idx]
          let items = (r.data || [])
          items = items.filter(p => !wishlistIds.has(p.id))
          dataBySub[sub] = items.slice(0, 8) // top 8 per sub
        })
        setRecommended(dataBySub)
      } catch (e) {
        console.error("Load recommended failed", e)
      } finally {
        setLoadingRec(false)
      }
    }

    if (wishlist && wishlist.length > 0) loadRecommended()
    else {
      setRecommended({})
      setMoreByUserPage([])
    }
  }, [wishlist])

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

            {/* Recommended Section */}
            <Row className="mt-5">
              <Col>
                <h3 className="fw-bold text-success mb-3">Sản Phẩm Nông Sản Đề Xuất</h3>
                <p className="text-muted" style={{ marginTop: -6 }}>
                  Khám phá những sản phẩm nông sản tươi ngon, chất lượng cao được tuyển chọn đặc biệt từ các vùng miền khắp Việt Nam.
                </p>
              </Col>
            </Row>

            {loadingRec && (
              <div className="d-flex align-items-center gap-2 text-success">
                <Spinner animation="border" size="sm" /> Đang tải gợi ý...
              </div>
            )}

            {Object.keys(recommended).map((sub) => (
              <div key={sub} className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h5 className="fw-semibold mb-0">{sub}</h5>
                  <Button variant="outline-success" size="sm" onClick={() => navigate(`/search?subcategory=${encodeURIComponent(sub)}`)}>
                    Xem thêm
                  </Button>
                </div>
                <Row className="g-3">
                  {(recommended[sub] || []).map((p) => (
                    <Col key={p.id} xl={3} lg={4} md={6} sm={6}>
                      <Card className="h-100" style={agriculturalStyles.productCard}>
                        <Card.Body className="p-3 text-center">
                          <img
                            src={p.image || "/placeholder.svg?height=300&width=300&query=agriculture"}
                            alt={p.name}
                            className="img-fluid mb-2"
                            style={{ height: 200, objectFit: 'cover', borderRadius: 12 }}
                            onClick={() => navigate(`/products/${p.id}`)}
                          />
                          <div className="fw-bold text-dark" style={{ minHeight: 40 }}>{p.name}</div>
                          <div className="text-danger fw-semibold mb-2">{Number(p.price).toLocaleString()} đ</div>
                          <Button variant="success" size="sm" onClick={() => navigate(`/products/${p.id}`)}>
                            Xem Chi Tiết
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            ))}

            {moreByUserPage.length > 0 && (
              <>
                <Row xs={2} sm={3} md={4} lg={5} xl={6} className="g-3">
                  {moreByUserPage.slice(0, suggestLimit).map((product) => {
                    const imgSrc = product.image && product.image.startsWith("/")
                      ? `${API_URL.replace(/\/api$/, "")}${product.image}`
                      : (product.image?.startsWith("http") ? product.image : "https://via.placeholder.com/400x300?text=No+Image")
                    return (
                      <Col key={product.id}>
                        <Card
                          className="h-100 shadow-sm border-0"
                          style={{ borderRadius: "12px", overflow: "hidden", transition: "transform 0.2s ease" }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-5px)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                        >
                          <div className="position-relative" style={{ height: 160, cursor: "pointer", backgroundColor: "#f8f9fa" }} onClick={() => navigate(`/products/${product.id}`)}>
                            <Card.Img variant="top" src={imgSrc} alt={product.name} style={{ height: "100%", objectFit: "cover" }} />
                          </div>
                          <Card.Body className="d-flex flex-column">
                            <Card.Title className="fs-6 fw-semibold text-truncate" title={product.name}>
                              {product.name}
                            </Card.Title>
                            <div className="d-flex align-items-center mb-2">
                              {[...Array(5)].map((_, i) => (
                                <span key={i}>
                                  {i < Math.floor(product.rating || 0) ? (
                                    <StarFill size={14} className="text-warning" />
                                  ) : (
                                    <Star size={14} className="text-muted" />
                                  )}
                                </span>
                              ))}
                              <small className="text-muted ms-1">({product.review_count || 0})</small>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-auto">
                              <span className="fw-bold text-danger">{Math.round(product.price)?.toLocaleString("vi-VN")} VNĐ</span>
                              <Button variant="outline-success" size="sm" onClick={() => navigate(`/products/${product.id}`)}>
                                Xem
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    )
                  })}
                </Row>
                {moreByUserPage.length > suggestLimit && (
                  <div className="text-center mt-3">
                    <Button variant="outline-success" onClick={() => setSuggestLimit(prev => prev + 12)}>
                      Xem thêm sản phẩm gợi ý
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Container>
    </div>
  )
}

export default Wishlist
