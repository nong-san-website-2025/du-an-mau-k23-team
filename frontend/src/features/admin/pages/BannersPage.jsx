"use client"
import { useState } from "react"
import { Container, Row, Col, Card, Form, Button, Badge, Modal, Alert, Nav } from "react-bootstrap"
import { FaEdit, FaEye, FaEyeSlash, FaSave, FaTimes, FaImage, FaPalette, FaStar } from "react-icons/fa"
import { useBanner } from "../../contexts/BannerContext"

const BannerEditor = ({ banner, onSave, onCancel }) => {
  const [editedBanner, setEditedBanner] = useState({ ...banner })
  const [activeTab, setActiveTab] = useState("content")

  const handleInputChange = (field, value) => {
    setEditedBanner((prev) => ({
      ...prev,
      [field]: value,
      // If bgColor changes, also map to a simple gradient so HomePage reflects it
      ...(field === "bgColor"
        ? { bgGradient: `linear-gradient(135deg, ${value} 0%, ${value} 50%, ${value} 100%)` }
        : {}),
    }))
  }

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...editedBanner.features]
    newFeatures[index] = value
    setEditedBanner((prev) => ({
      ...prev,
      features: newFeatures,
    }))
  }

  const handleSave = () => {
    onSave(editedBanner)
  }

  return (
    <Modal show={true} onHide={onCancel} size="lg" centered>
      <Modal.Header closeButton className="bg-success text-white">
        <Modal.Title>
          <FaEdit className="me-2" />
          Chỉnh Sửa Banner: {banner.title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Nav variant="pills" className="mb-3">
          <Nav.Item>
            <Nav.Link
              active={activeTab === "content"}
              onClick={() => setActiveTab("content")}
              style={{ cursor: "pointer" }}
            >
              Nội Dung
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === "design"}
              onClick={() => setActiveTab("design")}
              style={{ cursor: "pointer" }}
            >
              Thiết Kế
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === "features"}
              onClick={() => setActiveTab("features")}
              style={{ cursor: "pointer" }}
            >
              Tính Năng
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {activeTab === "content" && (
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Tiêu Đề Chính</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedBanner.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Nhập tiêu đề chính"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Tiêu Đề Phụ</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedBanner.subtitle}
                    onChange={(e) => handleInputChange("subtitle", e.target.value)}
                    placeholder="Nhập tiêu đề phụ"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Mô Tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editedBanner.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Nhập mô tả chi tiết"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Text Button</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedBanner.buttonText || ""}
                    onChange={(e) => handleInputChange("buttonText", e.target.value)}
                    placeholder="Nhập text button"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Đánh Giá</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={editedBanner.rating}
                    onChange={(e) => handleInputChange("rating", Number.parseFloat(e.target.value))}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Số Lượng Đánh Giá</Form.Label>
              <Form.Control
                type="text"
                value={editedBanner.reviews}
                onChange={(e) => handleInputChange("reviews", e.target.value)}
                placeholder="VD: 31,428 đánh giá"
              />
            </Form.Group>
          </Form>
        )}

        {activeTab === "design" && (
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    <FaPalette className="me-2" />
                    Màu Nền
                  </Form.Label>
                  <Form.Control
                    type="color"
                    value={editedBanner.bgColor || "#10b981"}
                    onChange={(e) => handleInputChange("bgColor", e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Màu Chữ</Form.Label>
                  <Form.Control
                    type="color"
                    value={editedBanner.textColor || "#ffffff"}
                    onChange={(e) => handleInputChange("textColor", e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Màu Button</Form.Label>
              <Form.Control
                type="color"
                value={editedBanner.buttonColor || "#10b981"}
                onChange={(e) => handleInputChange("buttonColor", e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold d-flex align-items-center gap-2">
                <FaImage /> Hình Ảnh Banner
              </Form.Label>

              {/* Preview */}
              {editedBanner.image && (
                <div className="mb-2">
                  <img
                    src={editedBanner.image}
                    alt="Preview"
                    style={{ maxWidth: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8 }}
                  />
                </div>
              )}

              {/* File input */}
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    handleInputChange("image", reader.result);
                  };
                  reader.readAsDataURL(file); // store as base64 so HomePage hiển thị ngay
                }}
              />
            </Form.Group>
          </Form>
        )}

        {activeTab === "features" && (
          <Form>
            <Form.Label className="fw-bold mb-3">Danh Sách Tính Năng</Form.Label>
            {editedBanner.features.map((feature, index) => (
              <Form.Group key={index} className="mb-3">
                <Form.Label>Tính Năng {index + 1}</Form.Label>
                <Form.Control
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                  placeholder={`Nhập tính năng ${index + 1}`}
                />
              </Form.Group>
            ))}
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          <FaTimes className="me-2" />
          Hủy
        </Button>
        <Button variant="success" onClick={handleSave}>
          <FaSave className="me-2" />
          Lưu Thay Đổi
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

const BannersPageContent = () => {
  const { banners, updateBanner, toggleBannerStatus } = useBanner()
  const [editingBanner, setEditingBanner] = useState(null)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")

  const handleEdit = (banner) => {
    setEditingBanner(banner)
  }

  const handleSave = (updatedBanner) => {
    updateBanner(updatedBanner.id, updatedBanner)
    setEditingBanner(null)
    setAlertMessage(`Banner "${updatedBanner.title}" đã được cập nhật thành công!`)
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 3000)
  }

  const handleToggleStatus = (id) => {
    toggleBannerStatus(id)
    const banner = banners.find((b) => b.id === id)
    const status = banner.isActive ? "ẩn" : "hiển thị"
    setAlertMessage(`Banner đã được ${status}!`)
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 3000)
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-6 fw-bold text-success mb-2">Quản Lý Banner Nông Sản</h1>
              <p className="text-muted">Chỉnh sửa và quản lý các banner hiển thị trên trang chủ</p>
            </div>
            <Badge bg="info" className="fs-6 px-3 py-2">
              {banners.filter((b) => b.isActive).length}/{banners.length} Banner Đang Hoạt Động
            </Badge>
          </div>
        </Col>
      </Row>

      {showAlert && (
        <Alert variant="success" className="mb-4">
          {alertMessage}
        </Alert>
      )}

      <Row className="g-4">
        {banners.map((banner) => (
          <Col key={banner.id} lg={6} xl={4}>
            <Card className={`h-100 shadow-sm ${!banner.isActive ? "opacity-75" : ""}`}>
              <div
                className="card-img-top position-relative"
                style={{
                  height: "200px",
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${banner.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="position-absolute top-0 end-0 m-2">
                  <Badge bg={banner.isActive ? "success" : "secondary"}>
                    {banner.isActive ? "Đang Hiển Thị" : "Đã Ẩn"}
                  </Badge>
                </div>

                <div className="position-absolute bottom-0 start-0 m-2">
                  <Badge bg="dark" className="d-flex align-items-center">
                    <FaStar className="me-1 text-warning" />
                    {banner.rating}
                  </Badge>
                </div>
              </div>

              <Card.Body>
                <Card.Title className="fw-bold text-truncate">{banner.title}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">{banner.subtitle}</Card.Subtitle>
                <Card.Text className="text-muted small">
                  {banner.description.length > 100 ? `${banner.description.substring(0, 100)}...` : banner.description}
                </Card.Text>

                <div className="mb-3">
                  <small className="text-muted">Tính năng:</small>
                  <div className="d-flex flex-wrap gap-1 mt-1">
                    {banner.features.map((feature, index) => (
                      <Badge key={index} bg="light" text="dark" className="small">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <Button variant="outline-primary" size="sm" onClick={() => handleEdit(banner)} className="flex-fill">
                    <FaEdit className="me-1" />
                    Chỉnh Sửa
                  </Button>

                  <Button
                    variant={banner.isActive ? "outline-warning" : "outline-success"}
                    size="sm"
                    onClick={() => handleToggleStatus(banner.id)}
                  >
                    {banner.isActive ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {editingBanner && (
        <BannerEditor banner={editingBanner} onSave={handleSave} onCancel={() => setEditingBanner(null)} />
      )}
    </Container>
  )
}

const BannersPage = () => {
  return <BannersPageContent />
}

export default BannersPage
