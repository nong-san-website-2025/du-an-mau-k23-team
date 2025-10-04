import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Spinner, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

export default function FollowedStores() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const load = async () => {
      try {
        if (!token) {
          navigate("/login", { state: { redirectTo: "/followed-stores" } });
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${API.replace(/\/$/, "")}/sellers/my/following/`, { headers });
        setStores(Array.isArray(res.data) ? res.data : res.data?.results || []);
      } catch (e) {
        setStores([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="success" />
        <p>Đang tải danh sách cửa hàng theo dõi...</p>
      </div>
    );
  }

  return (
    <Container className="my-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="fw-bold m-0">Cửa hàng đang theo dõi</h3>
        <Button variant="outline-success" onClick={() => navigate("/store")}>Khám phá thêm</Button>
      </div>

      {stores.length === 0 ? (
        <div className="text-center text-muted py-5">
          <p>Bạn chưa theo dõi cửa hàng nào.</p>
          <Button variant="success" onClick={() => navigate("/store")}>Tìm cửa hàng</Button>
        </div>
      ) : (
        <Row>
          {stores.map((s) => (
            <Col key={s.id} sm={6} md={4} lg={3} className="mb-4">
              <Link to={`/store/${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 15, overflow: "hidden" }}>
                  <div style={{ height: 140, background: "#f0fdf4" }}>
                    <img
                      src={s.image || "/assets/logo/imagelogo.png"}
                      alt={s.store_name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.currentTarget.src = "/assets/logo/imagelogo.png"; }}
                    />
                  </div>
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="fw-bold m-0" style={{ minHeight: 40 }}>{s.store_name}</h6>
                      <Badge bg={s.status === "active" ? "success" : "secondary"}>{s.status}</Badge>
                    </div>
                    {s.address && (
                      <div className="text-muted" style={{ fontSize: 13 }}>{s.address}</div>
                    )}
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}