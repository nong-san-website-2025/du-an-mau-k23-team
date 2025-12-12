"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { FaStar, FaReply, FaCheckCircle, FaClock, FaSearch, FaDownload, FaEye, FaEdit } from "react-icons/fa"
import {
  Container,
  Row,
  Col,
  Card,
  Nav,
  Table,
  Button,
  Badge,
  Modal,
  Form,
  InputGroup,
  ProgressBar,
  Alert,
} from "react-bootstrap"

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api"

const ReviewsSupport = () => {
  const [activeTab, setActiveTab] = useState("reviews")
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [replyText, setReplyText] = useState("")
  const [loading, setLoading] = useState(false)
  const [complaints, setComplaints] = useState([])

  // Dashboard stats (from API)
  const [dashboardStats, setDashboardStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    pendingReplies: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    starsDistribution: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
  })

  // Real reviews from API for seller's products
  const [reviews, setReviews] = useState([])
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [recentActivities, setRecentActivities] = useState([])

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar key={index} className={index < rating ? "text-warning" : "text-muted"} />
    ))
  }

  const getStatusBadge = (status) => {
    const variants = {
      pending: "warning",
      replied: "success",
      "in-progress": "info",
      resolved: "success",
    }
    const labels = {
      pending: "Chờ xử lý",
      replied: "Đã trả lời",
      "in-progress": "Đang xử lý",
      resolved: "Đã giải quyết",
    }
    return <Badge bg={variants[status]}>{labels[status]}</Badge>
  }

  // Priority badge for complaints tab
  const getPriorityBadge = (priority) => {
    const variants = { high: "danger", medium: "warning", low: "info" }
    const labels = { high: "Cao", medium: "Trung bình", low: "Thấp" }
    return <Badge bg={variants[priority]}>{labels[priority]}</Badge>
  }

  // Load reviews for this seller's store
  const loadSellerReviews = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const res = await axios.get(`${API_URL.replace(/\/$/, "")}/reviews/seller/reviews/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setReviews(res.data || [])
    } catch (err) {
      console.error("Load seller reviews failed", err)
    } finally {
      setLoading(false)
    }
  }

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  const loadDashboard = async ({ month, year } = {}) => {
    try {
      const token = localStorage.getItem("token")
      const params = new URLSearchParams()
      if (month) params.append("month", month)
      if (year) params.append("year", year)
      const res = await axios.get(
        `${API_URL.replace(/\/$/, "")}/reviews/seller/reviews/summary/${params.toString() ? `?${params.toString()}` : ""}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      setDashboardStats((prev) => ({ ...prev, ...res.data }))
    } catch (e) {
      console.error("Load dashboard failed", e)
    }
  }

  const loadRecentActivities = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get(`${API_URL.replace(/\/$/, "")}/reviews/seller/reviews/recent-activities/?limit=5`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setRecentActivities(res.data?.results || [])
    } catch (e) {
      console.error("Load recent activities failed", e)
    }
  }

  useEffect(() => {
    if (activeTab === "reviews") {
      loadSellerReviews()
      loadDashboard({ month: currentMonth, year: currentYear })
      loadRecentActivities()
    }
  }, [activeTab])

  const openReplyModal = (review) => {
    setSelectedReview(review)
    setReplyText("")
    setShowReplyModal(true)
  }

  const handleSendReply = async () => {
    if (!selectedReview || !replyText.trim()) return
    try {
      const token = localStorage.getItem("token")
      const res = await axios.post(
        `${API_URL.replace(/\/$/, "")}/reviews/review-replies/`,
        { review: selectedReview.id, reply_text: replyText.trim() },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      // Optimistically update UI
      const newReply = res.data
      setReviews((prev) =>
        prev.map((r) => (r.id === selectedReview.id ? { ...r, replies: [...(r.replies || []), newReply] } : r))
      )
      setShowReplyModal(false)
      setReplyText("")
    } catch (err) {
      console.error("Send reply failed", err)
    }
  }

  const filtered = reviews
    .filter((r) =>
      query
        ? (r.user_name || "").toLowerCase().includes(query.toLowerCase()) ||
          (r.product_name || "").toLowerCase().includes(query.toLowerCase())
        : true
    )
    .filter((r) => {
      const status = (r.replies && r.replies.length > 0) ? "replied" : "pending"
      if (statusFilter === "all") return true
      return status === statusFilter
    })

  return (
    <Container fluid className="py-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Container>
        <Card className="shadow-sm">
          <Card.Header className="bg-success text-white">
            <h1 className="h4 mb-0 d-flex align-items-center">
              <FaStar className="me-2" />
              Đánh giá của khách hàng
            </h1>
          </Card.Header>

          <Nav variant="tabs" className="px-3">
            {[
              { key: "dashboard", label: "Dashboard" },
              { key: "reviews", label: "Quản lý đánh giá" },
            ].map((tab) => (
              <Nav.Item key={tab.key}>
                <Nav.Link
                  active={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={activeTab === tab.key ? "text-success" : ""}
                >
                  {tab.label}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>

          <Card.Body>
            {activeTab === "dashboard" && (
              <div>
                <Row className="mb-4">
                  <Col md={3} className="mb-3">
                    <Card className="border-start border-success border-4">
                      <Card.Body className="text-center">
                        <h2 className="text-success mb-1">{dashboardStats.totalReviews}</h2>
                        <Card.Text className="text-muted small">Tổng đánh giá</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3} className="mb-3">
                    <Card className="border-start border-warning border-4">
                      <Card.Body className="text-center">
                        <h2 className="text-warning mb-1">{dashboardStats.averageRating}/5</h2>
                        <Card.Text className="text-muted small mb-2">Điểm trung bình</Card.Text>
                        <div className="d-flex justify-content-center">
                          {renderStars(Math.floor(dashboardStats.averageRating))}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3} className="mb-3">
                    <Card className="border-start border-danger border-4">
                      <Card.Body className="text-center">
                        <h2 className="text-danger mb-1">{dashboardStats.pendingReplies}</h2>
                        <Card.Text className="text-muted small">Chờ trả lời</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>

                </Row>

                {/* Placeholder trend */}
                <Row>
                  <Col lg={8} className="mb-4">
                    <Card>
                      <Card.Header className="bg-light d-flex align-items-center justify-content-between">
                        <Card.Title className="mb-0">Xu hướng đánh giá theo tháng</Card.Title>
                        <div className="d-flex gap-2">
                          <Form.Select size="sm" value={currentMonth} onChange={(e) => { const m = Number(e.target.value); setCurrentMonth(m); loadDashboard({ month: m, year: currentYear }) }}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                              <option key={m} value={m}>Tháng {m}</option>
                            ))}
                          </Form.Select>
                          <Form.Select size="sm" value={currentYear} onChange={(e) => { const y = Number(e.target.value); setCurrentYear(y); loadDashboard({ month: currentMonth, year: y }) }}>
                            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </Form.Select>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        {[
                          { stars: "5 sao", value: dashboardStats.starsDistribution?.["5"] || 0, variant: "success" },
                          { stars: "4 sao", value: dashboardStats.starsDistribution?.["4"] || 0, variant: "info" },
                          { stars: "3 sao", value: dashboardStats.starsDistribution?.["3"] || 0, variant: "warning" },
                          { stars: "2 sao", value: dashboardStats.starsDistribution?.["2"] || 0, variant: "warning" },
                          { stars: "1 sao", value: dashboardStats.starsDistribution?.["1"] || 0, variant: "danger" },
                        ].map((item) => (
                          <div key={item.stars} className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <span className="small">{item.stars}</span>
                              <span className="small">{item.value}</span>
                            </div>
                            <ProgressBar now={item.value} variant={item.variant} />
                          </div>
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col lg={4}>
                    <Card>
                      <Card.Header className="bg-light">
                        <Card.Title className="mb-0">Hoạt động gần đây</Card.Title>
                      </Card.Header>
                      <Card.Body>
                        {recentActivities.length === 0 && (
                          <div className="text-muted small">Chưa có hoạt động</div>
                        )}
                        {recentActivities.map((act) => (
                          <div key={`${act.type}-${act.id}`} className="d-flex align-items-center mb-3">
                            <div className="bg-success rounded-circle p-2 me-3">
                              <FaCheckCircle className="text-white" size={12} />
                            </div>
                            <div>
                              <div className="small text-muted">{new Date(act.created_at).toLocaleString()}</div>
                              <div className="small">{act.message}</div>
                            </div>
                          </div>
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <Row className="mb-4">
                  <Col md={6}>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Tìm kiếm theo tên khách hàng hoặc sản phẩm..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">Tất cả trạng thái</option>
                      <option value="pending">Chờ trả lời</option>
                      <option value="replied">Đã trả lời</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Button variant="success" className="w-100" onClick={loadSellerReviews} disabled={loading}>
                      <FaDownload className="me-2" />
                      Làm mới
                    </Button>
                  </Col>
                </Row>

                <Card>
                  <Table responsive striped hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Khách hàng</th>
                        <th>Sản phẩm</th>
                        <th>Đánh giá</th>
                        <th>Nội dung</th>
                        <th>Ngày</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((review) => {
                        const status = (review.replies && review.replies.length > 0) ? "replied" : "pending"
                        return (
                          <tr key={review.id}>
                            <td className="fw-medium">{review.user_name}</td>
                            <td>{review.product_name}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                {renderStars(review.rating)}
                                <span className="ms-2 small text-muted">({review.rating})</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ maxWidth: "260px" }} className="text-truncate">
                                {review.comment?.length > 80 ? `${review.comment.substring(0, 80)}...` : review.comment}
                              </div>
                            </td>
                            <td>{new Date(review.created_at).toLocaleString()}</td>
                            <td>{getStatusBadge(status)}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => openReplyModal(review)}
                                >
                                  <FaEye />
                                </Button>
                                {status === "pending" && (
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => openReplyModal(review)}
                                  >
                                    <FaReply />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </Card>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>

      <Modal show={showReplyModal} onHide={() => setShowReplyModal(false)} size="lg">
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>Chi tiết & Trả lời đánh giá</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReview && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Khách hàng:</strong> {selectedReview.user_name}
                </Col>
                <Col md={6}>
                  <strong>Sản phẩm:</strong> {selectedReview.product_name}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Đánh giá:</strong>
                  <div className="d-flex align-items-center mt-1">
                    {renderStars(selectedReview.rating)}
                    <span className="ms-2 text-muted">({selectedReview.rating}/5)</span>
                  </div>
                </Col>
                <Col md={6}>
                  <strong>Ngày:</strong> {new Date(selectedReview.created_at).toLocaleString()}
                </Col>
              </Row>
              <div className="mb-3">
                <strong>Nội dung đánh giá:</strong>
                <Alert variant="light" className="mt-2">
                  {selectedReview.comment}
                </Alert>
              </div>

              {/* Existing replies */}
              {Array.isArray(selectedReview.replies) && selectedReview.replies.length > 0 && (
                <div className="mb-3">
                  <strong>Phản hồi hiện tại:</strong>
                  <Alert variant="success" className="mt-2">
                    <ul className="mb-0" style={{ paddingLeft: 18 }}>
                      {selectedReview.replies.map((rp) => (
                        <li key={rp.id}>
                          {rp.reply_text}
                          <small className="text-muted ms-2">
                            {new Date(rp.created_at).toLocaleString()}
                          </small>
                        </li>
                      ))}
                    </ul>
                  </Alert>
                </div>
              )}

              <Form.Group>
                <Form.Label>
                  <strong>Phản hồi của bạn:</strong>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Nhập phản hồi cho khách hàng..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReplyModal(false)}>
            Hủy
          </Button>
          <Button variant="success" onClick={handleSendReply} disabled={!replyText.trim()}>
            <FaReply className="me-2" />
            Gửi phản hồi
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showComplaintModal} onHide={() => setShowComplaintModal(false)} size="lg">
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Chi tiết khiếu nại</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedComplaint && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Mã khiếu nại:</strong> KN{selectedComplaint.id.toString().padStart(3, "0")}
                </Col>
                <Col md={6}>
                  <strong>Khách hàng:</strong> {selectedComplaint.customer}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Sản phẩm:</strong> {selectedComplaint.product}
                </Col>
                <Col md={6}>
                  <strong>Mức độ:</strong> {getPriorityBadge(selectedComplaint.priority)}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Vấn đề:</strong> {selectedComplaint.issue}
                </Col>
                <Col md={6}>
                  <strong>Trạng thái:</strong> {getStatusBadge(selectedComplaint.status)}
                </Col>
              </Row>
              <div className="mb-3">
                <strong>Mô tả chi tiết:</strong>
                <Alert variant="light" className="mt-2">
                  {selectedComplaint.description}
                </Alert>
              </div>
              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>Cập nhật trạng thái:</strong>
                </Form.Label>
                <Form.Select defaultValue={selectedComplaint.status}>
                  <option value="pending">Chờ xử lý</option>
                  <option value="in-progress">Đang xử lý</option>
                  <option value="resolved">Đã giải quyết</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>
                  <strong>Phản hồi xử lý:</strong>
                </Form.Label>
                <Form.Control as="textarea" rows={4} placeholder="Nhập phản hồi xử lý khiếu nại..." />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowComplaintModal(false)}>
            Hủy
          </Button>
          <Button variant="danger">
            <FaCheckCircle className="me-2" />
            Cập nhật
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default ReviewsSupport
