import React, { useState, useEffect } from "react";
import {
  Card,
  Badge,
  Container,
  Spinner,
  Row,
  Col,
  Tabs,
  Tab,
} from "react-bootstrap";
import { getMyVouchers } from "../../admin/services/promotionServices";

const MyVoucher = () => {
  const [userVouchers, setUserVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("unused");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getMyVouchers();
      setUserVouchers(res);
    } catch (err) {
      console.error("Lỗi khi tải túi voucher:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Lọc theo tab
  const now = new Date();
  const filteredVouchers = userVouchers.filter((uv) => {
    const v = uv?.voucher;
    if (!v) return false;
    const isExpired = new Date(v.end_at) < now;
    if (tab === "unused") return !uv.is_used && !isExpired;
    if (tab === "used") return uv.is_used;
    if (tab === "expired") return isExpired;
    return true;
  });

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <div className="mt-2">Đang tải túi voucher...</div>
      </div>
    );
  }

  return (
    <Container>
      <h5
        className="mb-3"
        style={{
          color: "#388E3C",
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: 1,
        }}
      >
        🎁 Mã giảm giá của tôi
      </h5>

      <Tabs
        activeKey={tab}
        onSelect={(k) => setTab(k)}
        className="mb-4"
        justify
        style={{ background: "#fff", borderRadius: 8 }}
      >
        <Tab eventKey="unused" title={<span>Chưa sử dụng</span>} />
        <Tab eventKey="used" title={<span>Đã sử dụng</span>} />
        <Tab eventKey="expired" title={<span>Đã hết hạn</span>} />
      </Tabs>

      <Row xs={1} md={2} className="g-4">
        {filteredVouchers.length === 0 && (
          <Col xs={12}>
            <p className="text-muted">Không có voucher nào phù hợp.</p>
          </Col>
        )}

        {filteredVouchers.map((uv) => {
          const v = uv?.voucher;
          if (!v) return null;

          let discountText = "";
          let color = "#fff";
          let borderColor = "#388E3C";
          let icon = "";
          if (v.discount_type === "freeship" && v.freeship_amount) {
            discountText = `Freeship ${Number(v.freeship_amount).toLocaleString("vi-VN")}₫`;
            color = "#E3F2FD";
            borderColor = "#1976D2";
            icon = "🚚";
          } else if (v.discount_type === "percent" && v.discount_percent) {
            discountText = `${v.discount_percent}%`;
            color = "#FFF3E0";
            borderColor = "#F57C00";
            icon = "🔥";
          } else if (v.discount_type === "amount" && v.discount_amount) {
            discountText = `${Number(v.discount_amount).toLocaleString("vi-VN")}₫`;
            color = "#E8F5E9";
            borderColor = "#388E3C";
            icon = "💸";
          }

          const isExpired = new Date(v.end_at) < now;

          return (
            <Col key={uv.id}>
              <Card
                className="shadow-sm border-0 h-100"
                style={{
                  background: color,
                  borderLeft: `8px solid ${borderColor}`,
                  borderRadius: 16,
                  minHeight: 170,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Card.Body className="d-flex flex-column justify-content-between h-100">
                  <div className="d-flex align-items-center mb-2">
                    <span style={{ fontSize: 32, marginRight: 12 }}>
                      {icon}
                    </span>
                    <div>
                      <Card.Title
                        style={{
                          fontWeight: 700,
                          fontSize: 22,
                          color: borderColor,
                        }}
                      >
                        {v.code}
                        {uv.is_used && (
                          <Badge bg="secondary" className="ms-2">
                            Đã dùng
                          </Badge>
                        )}
                        {isExpired && (
                          <Badge bg="danger" className="ms-2">
                            Hết hạn
                          </Badge>
                        )}
                      </Card.Title>
                      <div style={{ fontSize: 15, color: "#555" }}>
                        {v.name || v.title}
                      </div>
                    </div>
                  </div>
                  <Card.Text className="mb-0" style={{ fontSize: 15 }}>
                    <div>
                      💰 <b>Giá trị:</b> {discountText || "—"}
                    </div>
                    <div>
                      🧾 <b>Đơn tối thiểu:</b>{" "}
                      {v.min_order_value
                        ? Number(v.min_order_value).toLocaleString("vi-VN") +
                          "₫"
                        : "Không yêu cầu"}
                    </div>
                    <div>
                      📅 <b>Hạn sử dụng:</b>{" "}
                      {new Date(v.start_at).toLocaleDateString("vi-VN")} →{" "}
                      {new Date(v.end_at).toLocaleDateString("vi-VN")}
                    </div>

                    <div>
                      🎟️ <b>Số lượng:</b>{" "}
                      {uv.quantity
                        ? `${uv.quantity - (uv.used_count || 0)}/${uv.quantity}`
                        : "Không giới hạn"}
                    </div>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default MyVoucher;
