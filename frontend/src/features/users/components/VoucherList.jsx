import React, { useState } from "react";
import { Card, Button, Badge, Container, Row, Col, Form } from "react-bootstrap";

const sampleVouchers = [
  {
    id: 1,
    code: "GIAM20K",
    discount: "20.000₫",
    minOrder: "100.000₫",
    expiredAt: "2025-12-31",
    used: false,
    expired: false,
  },
  {
    id: 2,
    code: "GIAM50K",
    discount: "50.000₫",
    minOrder: "300.000₫",
    expiredAt: "2025-08-31",
    used: true,
    expired: false,
  },
  {
    id: 3,
    code: "FREESHIP",
    discount: "Miễn phí vận chuyển",
    minOrder: "200.000₫",
    expiredAt: "2025-06-30",
    used: false,
    expired: true,
  },
  {
    id: 4,
    code: "WELCOME10",
    discount: "Giảm 10%",
    minOrder: "Không yêu cầu",
    expiredAt: "2025-12-31",
    used: false,
    expired: false,
  },
];

const VoucherList = () => {
  const [vouchers, setVouchers] = useState(sampleVouchers);
  const [filter, setFilter] = useState("all");

  const filtered = vouchers.filter((v) => {
    if (filter === "used") return v.used;
    if (filter === "expired") return v.expired;
    if (filter === "active") return !v.used && !v.expired;
    return true;
  });

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
                  <div>💰 Giá trị: {voucher.discount}</div>
                  <div>🧾 Đơn tối thiểu: {voucher.minOrder}</div>
                  <div>📅 Hạn sử dụng: {voucher.expiredAt}</div>
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
