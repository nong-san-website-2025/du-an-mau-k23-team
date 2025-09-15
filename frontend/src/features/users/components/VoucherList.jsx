import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Badge,
  Container,
  Row,
  Col,
  Form,
  Spinner,
} from "react-bootstrap";
import { getVouchers } from "../../admin/services/promotionServices";

const VoucherList = () => {
  const [vouchers, setVouchers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await getVouchers();
      setVouchers(res);
    } catch (err) {
      console.error("Fetch vouchers failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  // Lọc voucher theo trạng thái
  const filtered = vouchers.filter((v) => {
    if (filter === "used") return v.used;
    if (filter === "expired") return v.expired;
    if (filter === "active") return !v.used && !v.expired;
    return true;
  });

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <div className="mt-2">Đang tải voucher...</div>
      </div>
    );
  }

  return (
    <Container>
      <h5 className="mb-3" style={{ color: "#F57C00" }}>
        🎁 Kho Voucher của bạn
      </h5>

      <Form.Select
        className="mb-4"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ maxWidth: "300px" }}
      >
        <option value="all">Tất cả</option>
        <option value="active">Chưa sử dụng</option>
        <option value="used">Đã sử dụng</option>
        <option value="expired">Đã hết hạn</option>
      </Form.Select>

      <Row>
        {filtered.length === 0 && (
          <p className="text-muted">Không có voucher nào phù hợp.</p>
        )}
        {filtered.map((voucher) => (
          <Col md={6} lg={4} key={voucher.id} className="mb-4">
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Card.Title>
                  <span className="fw-bold">{voucher.code}</span>{" "}
                  {voucher.used && (
                    <Badge bg="secondary" className="ms-2">
                      Đã dùng
                    </Badge>
                  )}
                  {voucher.expired && (
                    <Badge bg="danger" className="ms-2">
                      Hết hạn
                    </Badge>
                  )}
                </Card.Title>
                <Card.Text>
                  <div>💰 Giá trị: {voucher.discount_text}</div>
                  <div>
                    🧾 Đơn tối thiểu:{" "}
                    {voucher.min_order_value
                      ? voucher.min_order_value.toLocaleString("vi-VN") + "₫"
                      : "Không yêu cầu"}
                  </div>
                  <div>
                    📅 Hạn sử dụng: {voucher.start_date} → {voucher.end_date}
                  </div>
                </Card.Text>
                {!voucher.used && !voucher.expired ? (
                  <Button variant="success" size="sm">
                    Áp dụng
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" disabled>
                    Không khả dụng
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default VoucherList;
