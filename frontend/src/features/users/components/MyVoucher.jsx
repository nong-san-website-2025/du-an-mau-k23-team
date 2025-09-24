import React, { useState, useEffect } from "react";
import { Card, Badge, Container, Spinner, Row, Col } from "react-bootstrap";
import { getMyVouchers } from "../../admin/services/promotionServices";

const MyVoucher = () => {
  const [userVouchers, setUserVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <h5 className="mb-3" style={{ color: "#388E3C" }}>
        🎁 Mã giảm giá của tôi
      </h5>

      <Row>
        {userVouchers.length === 0 && (
          <p className="text-muted">Bạn chưa có voucher nào.</p>
        )}

        {userVouchers.map((uv) => {
          const v = uv?.voucher;
          if (!v) {
            return null; // nếu không có voucher thì bỏ qua
          }

          let discountText = "";
          if (v.discount_type === "freeship" && v.freeship_amount) {
            discountText = `Freeship ${Number(v.freeship_amount).toLocaleString("vi-VN")}₫`;
          } else if (v.discount_type === "percent" && v.discount_percent) {
            discountText = `${v.discount_percent}%`;
          } else if (v.discount_type === "amount" && v.discount_amount) {
            discountText = `${Number(v.discount_amount).toLocaleString("vi-VN")}₫`;
          }

          return (
            <Col xs={12} key={uv.id} className="mb-3">
              <Card className="shadow-sm border-0">
                <Card.Body className="d-flex justify-content-between align-items-center">
                  <div>
                    <Card.Title>
                      <span className="fw-bold">{v.code}</span>
                      {uv.is_used && (
                        <Badge bg="secondary" className="ms-2">
                          Đã dùng
                        </Badge>
                      )}
                    </Card.Title>
                    <Card.Text className="mb-0">
                      <div>💰 Giá trị: {discountText || "—"}</div>
                      <div>
                        🧾 Đơn tối thiểu:{" "}
                        {v.min_order_value
                          ? Number(v.min_order_value).toLocaleString("vi-VN") +
                            "₫"
                          : "Không yêu cầu"}
                      </div>
                      <div>
                        📅 Hạn sử dụng:{" "}
                        {new Date(v.start_at).toLocaleDateString("vi-VN")} →{" "}
                        {new Date(v.end_at).toLocaleDateString("vi-VN")}
                      </div>
                      <div>
                        🎟️ Số lượng: {uv.quantity - uv.used_count}/{uv.quantity}
                      </div>
                    </Card.Text>
                  </div>
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
