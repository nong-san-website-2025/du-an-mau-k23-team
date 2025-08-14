import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Card,
  Nav,
  Tab,
} from "react-bootstrap";
import { productApi } from "../../../products/services/productApi";

const labelStyle = {
  fontSize: "14px",
  fontWeight: 500,
  color: "#222",
  marginBottom: 4,
};
const inputStyle = {
  fontSize: "14px",
  padding: "7px 12px",
  borderRadius: 8,
  border: "1px solid #e0e3e7",
  background: "#f8fafc",
  boxShadow: "none",
  transition: "border-color 0.2s",
  minHeight: 36,
};
const cardStyle = {
  border: "none",
  background: "white",
  borderRadius: 12,
  boxShadow: "0 2px 16px rgba(60,72,88,0.07)",
  marginBottom: 16,
};

const AddProductModal = ({ visible, onCancel, onSuccess, product }) => {
  const initialFormState = {
    name: "",
    description: "",
    price: "",
    unit: "kg",
    stock: 0,
    discount: 0,
    location: "",
    brand: "",
    is_organic: false,
    is_new: false,
    is_best_seller: false,
    seller: "",
    category: "",
    subcategory: "",
    image: null,
    direct_sale: true,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const fileInputRef = useRef(null);

  // Reset success & error when open modal or change product
  useEffect(() => {
    if (visible) {
      setSuccess("");
      setError("");
    }
  }, [visible, product]);

  // Load categories & sellers + prefill form when editing
  useEffect(() => {
    if (!visible) return;

    if (!product) {
      setFormData(initialFormState);
    }

    Promise.all([productApi.getCategories(), productApi.getSellers()])
      .then(([cats, sels]) => {
        setCategories(cats);
        setSellers(sels);

        if (product) {
          setFormData((prev) => ({
            ...prev,
            name: product.name || "",
            description: product.description || "",
            price: product.price || "",
            unit: product.unit || "kg",
            stock: product.stock || 0,
            discount: product.discount || 0,
            location: product.location || "",
            brand: product.brand || "",
            is_organic: !!product.is_organic,
            is_new: !!product.is_new,
            is_best_seller: !!product.is_best_seller,
            // Luôn ép kiểu id về string để Form.Select nhận đúng value
            seller: (product.seller_id || (product.seller && product.seller.id) || "") + "",
            category: (product.category_id || (product.category && product.category.id) || "") + "",
            subcategory: (product.subcategory_id || (product.subcategory && product.subcategory.id) || "") + "",
            image: null,
            direct_sale:
              product.direct_sale !== undefined ? product.direct_sale : true,
          }));
        }
      })
      .catch(() => {
        setError("Không thể tải dữ liệu danh mục hoặc người bán");
      });
  }, [visible, product]);

  // Load subcategories when category changes
  useEffect(() => {
    if (formData.category) {
      productApi
        .getSubcategories(formData.category)
        .then((subs) => {
          setSubcategories(subs);
          // Nếu subcategory hiện tại không thuộc category mới => reset
          if (
            product &&
            (product.subcategory_id ||
              (product.subcategory && product.subcategory.id)) &&
            !subs.some(
              (s) =>
                s.id ===
                (product.subcategory_id ||
                  (product.subcategory && product.subcategory.id))
            )
          ) {
            setFormData((prev) => ({ ...prev, subcategory: "" }));
          }
        })
        .catch(() => setError("Không thể tải danh mục con"));
    } else {
      setSubcategories([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.category]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleChooseImage = (e) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "image") {
          if (value instanceof File) data.append("image", value);
        } else if (value !== null && value !== undefined && value !== "") {
          data.append(key, typeof value === "boolean" ? String(value) : value);
        }
      });

      if (product && product.id) {
        await productApi.updateProduct(product.id, data);
        setSuccess("Cập nhật sản phẩm thành công!");
      } else {
        await productApi.createProduct(data);
        setSuccess("Thêm sản phẩm thành công!");
      }

      onSuccess && onSuccess();
    } catch (err) {
      setError(
        product && product.id
          ? "Không thể cập nhật sản phẩm. Vui lòng thử lại."
          : "Không thể thêm sản phẩm. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={visible}
      onHide={onCancel}
      size="xl"
      backdrop="static"
      centered
      contentClassName="border-0"
      dialogClassName="rounded-4"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="d-flex justify-content-between align-items-center border-bottom p-3">
        <Modal.Title
          style={{ fontSize: "17px", fontWeight: 700, color: "#1a202c" }}
        >
          {product ? "Chỉnh sửa hàng hóa" : "Tạo hàng hóa"}
        </Modal.Title>
        <button
          onClick={onCancel}
          style={{
            width: 20,
            background: "#fff",
            color: "#000",
            border: "none",
          }}
          aria-label="Close"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Nav
          variant="tabs"
          style={{
            borderBottom: "1px solid #e5e7eb",
            background: "#fff",
            padding: "0 20px",
          }}
        >
          <Nav.Item>
            <Nav.Link eventKey="info" style={{ fontWeight: 600, fontSize: 14 }}>
              Thông tin
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="desc" style={{ fontWeight: 600, fontSize: 14 }}>
              Mô tả
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Form onSubmit={handleSubmit}>
          <Modal.Body
            style={{
              background: "#f8fafc",
              maxHeight: "70vh",
              padding: 0,
              borderRadius: "0 0 12px 12px",
              minWidth: 900,
              overflowY: "auto",
            }}
          >
            {error && (
              <Alert
                variant="danger"
                style={{ fontSize: 13, borderRadius: 8, margin: 12 }}
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                variant="success"
                style={{ fontSize: 13, borderRadius: 8, margin: 12 }}
              >
                {success}
              </Alert>
            )}

            <Tab.Content>
              {/* ===== Tab: Thông tin ===== */}
              <Tab.Pane eventKey="info">
                <Row className="g-4 m-0 p-3">
                  <Col md={8}>
                    <Card style={cardStyle}>
                      <Card.Body style={{ padding: 24 }}>
                        <Row className="g-3 align-items-end">
                          <Col md={6}>
                            <Form.Group className="mb-2" controlId="name">
                              <Form.Label style={labelStyle}>
                                Tên hàng <span style={{ color: "red" }}>*</span>
                              </Form.Label>
                              <Form.Control
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Bắt buộc"
                                style={inputStyle}
                                autoFocus
                              />
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group className="mb-2" controlId="brand">
                              <Form.Label style={labelStyle}>
                                Thương hiệu
                              </Form.Label>
                              <Form.Control
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange}
                                placeholder="Chọn thương hiệu"
                                style={inputStyle}
                              />
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group className="mb-2" controlId="category">
                              <Form.Label style={labelStyle}>
                                Nhóm hàng{" "}
                                <span style={{ color: "red" }}>*</span>
                              </Form.Label>
                              <Form.Select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                              >
                                <option value="">
                                  Chọn nhóm hàng (Bắt buộc)
                                </option>
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group className="mb-2" controlId="seller">
                              <Form.Label style={labelStyle}>
                                Người bán{" "}
                                <span style={{ color: "red" }}>*</span>
                                <span
                                  style={{
                                    color: "#888",
                                    fontSize: 12,
                                    marginLeft: 8,
                                  }}
                                >
                                  ({sellers.length} người bán)
                                </span>
                              </Form.Label>
                              <Form.Select
                                name="seller"
                                value={formData.seller}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                              >
                                <option value="">Chọn người bán</option>
                                {sellers.map((seller) => (
                                  <option key={seller.id} value={seller.id}>
                                    {seller.store_name}
                                  </option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>

                          <Col md={4}>
                            <Form.Group className="mb-2" controlId="price">
                              <Form.Label style={labelStyle}>
                                Giá bán
                              </Form.Label>
                              <Form.Control
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                min={0}
                                required
                                placeholder="0"
                                style={inputStyle}
                              />
                            </Form.Group>
                          </Col>

                          <Col md={4}>
                            <Form.Group className="mb-2" controlId="discount">
                              <Form.Label style={labelStyle}>
                                Giảm giá (%)
                              </Form.Label>
                              <Form.Control
                                type="number"
                                name="discount"
                                value={formData.discount}
                                onChange={handleChange}
                                min={0}
                                max={100}
                                placeholder="0"
                                style={inputStyle}
                              />
                            </Form.Group>
                          </Col>

                          <Col md={4}>
                            <Form.Group className="mb-2" controlId="stock">
                              <Form.Label style={labelStyle}>
                                Tồn kho
                              </Form.Label>
                              <Form.Control
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                min={0}
                                placeholder="0"
                                style={inputStyle}
                              />
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group className="mb-2" controlId="unit">
                              <Form.Label style={labelStyle}>Đơn vị</Form.Label>
                              <Form.Control
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                placeholder="kg, g, cái..."
                                style={inputStyle}
                              />
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group
                              className="mb-2"
                              controlId="subcategory"
                            >
                              <Form.Label style={labelStyle}>
                                Danh mục con
                              </Form.Label>
                              <Form.Select
                                name="subcategory"
                                value={formData.subcategory}
                                onChange={handleChange}
                                disabled={!formData.category}
                                style={inputStyle}
                              >
                                <option value="">Chọn danh mục con</option>
                                {subcategories.map((sub) => (
                                  <option key={sub.id} value={sub.id}>
                                    {sub.name}
                                  </option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={4}>
                    <Card
                      style={{
                        ...cardStyle,
                        minHeight: 320,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Card.Body
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                        }}
                      >
                        <Form.Group
                          controlId="image"
                          className="mb-2"
                          style={{ width: "100%", textAlign: "center" }}
                        >
                          <div
                            style={{
                              border: "1px dashed #cbd5e1",
                              borderRadius: 8,
                              padding: 16,
                              background: "#f8fafc",
                              minHeight: 120,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span
                              style={{
                                display: "block",
                                marginBottom: 8,
                                fontSize: 14,
                                color: "#555",
                                fontWeight: 500,
                              }}
                            >
                              Thêm ảnh
                            </span>

                            <input
                              ref={fileInputRef}
                              type="file"
                              name="image"
                              accept="image/*"
                              onChange={handleChange}
                              style={{ display: "none" }}
                            />

                            <Button
                              variant="outline-primary"
                              size="sm"
                              style={{
                                fontSize: 13,
                                borderRadius: 6,
                                fontWeight: 500,
                              }}
                              onClick={handleChooseImage}
                              type="button"
                            >
                              Chọn ảnh
                            </Button>

                            <div
                              style={{
                                fontSize: 12,
                                color: "#888",
                                marginTop: 8,
                              }}
                            >
                              Mỗi ảnh không quá 2 MB
                            </div>

                            {formData.image && (
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "#1a202c",
                                  marginTop: 8,
                                }}
                              >
                                {formData.image.name}
                              </div>
                            )}
                          </div>
                        </Form.Group>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* ===== Tab: Mô tả ===== */}
              <Tab.Pane eventKey="desc">
                <Card style={{ ...cardStyle, margin: 12 }}>
                  <Card.Body style={{ padding: 24 }}>
                    <Form.Group controlId="description">
                      <Form.Label style={labelStyle}>Mô tả chi tiết</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={8}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Nhập mô tả chi tiết về sản phẩm..."
                        style={{ ...inputStyle, minHeight: 120 }}
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Modal.Body>

          <Modal.Footer
            style={{
              padding: "12px 0px",
              background: "#f5f7fa",
              borderRadius: "0 0 12px 12px",
            }}
          >
            <div className="d-flex align-items-center gap-2 w-100 justify-content-end px-3">
              <Button
                variant="outline-secondary"
                className="text-dark"
                onClick={onCancel}
                disabled={loading}
                style={{
                  ...inputStyle,
                  fontWeight: 600,
                  borderRadius: 8,
                  minWidth: 90,
                }}
                type="button"
              >
                Bỏ qua
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                style={{
                  ...inputStyle,
                  fontWeight: 600,
                  borderRadius: 8,
                  minWidth: 140,
                  marginLeft: 8,
                  background: "#22C55E",
                  border: "none",
                }}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  "Lưu"
                )}
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Tab.Container>
    </Modal>
  );
};

export default AddProductModal;
