import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Badge,
  Container,
  Form,
  Spinner,
  Row,
  Col,
  Pagination,
} from "react-bootstrap";
import { toast } from "react-toastify";
import {
  getVouchers,
  getMyVouchers,
  claimVoucher,
} from "../../admin/services/promotionServices";

const VoucherList = () => {
  const [vouchers, setVouchers] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const vouchersPerPage = 5;

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const [allVouchers, myVouchersRes] = await Promise.all([
        getVouchers(),
        getMyVouchers(),
      ]);
      setVouchers(allVouchers);
      setMyVouchers(myVouchersRes);
    } catch (err) {
      console.error("Fetch vouchers failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  // Lọc voucher: chỉ hiển thị voucher dạng 'claim' mà user chưa nhận (không có trong túi)
  const claimedVoucherIds = new Set(myVouchers.map((uv) => uv.voucher?.id));
  const filtered = vouchers.filter((v) => {
    if (v.distribution_type !== "claim") return false;
    if (claimedVoucherIds.has(v.id)) return false;
    if (filter === "normal") return v.discount_type !== "freeship";
    if (filter === "freeship") return v.discount_type === "freeship";
    return true;
  });

  // Tính toán phân trang
  const indexOfLast = currentPage * vouchersPerPage;
  const indexOfFirst = indexOfLast - vouchersPerPage;
  const currentVouchers = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / vouchersPerPage);

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
      <h5
        className="mb-3"
        style={{
          color: "#F57C00",
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: 1,
        }}
      >
        🎁 Kho Voucher
      </h5>

      <Form.Select
        className="mb-4"
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value);
          setCurrentPage(1);
        }}
        style={{ maxWidth: "300px" }}
      >
        <option value="all">Tất cả</option>
        <option value="normal">Voucher Thường</option>
        <option value="freeship">Voucher FreeShip</option>
      </Form.Select>

      <Row xs={1} md={2} className="g-4">
        {currentVouchers.length === 0 && (
          <Col xs={12}>
            <p className="text-muted">Không có voucher nào phù hợp.</p>
          </Col>
        )}

        {currentVouchers.map((voucher) => {
          // Xử lý hiển thị giá trị voucher và style
          let discountText = "";
          let color = "#fff";
          let borderColor = "#388E3C";
          let icon = "";
          if (voucher.discount_type === "freeship" && voucher.freeship_amount) {
            discountText = `Freeship ${voucher.freeship_amount.toLocaleString("vi-VN")}₫`;
            color = "#E3F2FD";
            borderColor = "#1976D2";
            icon = "🚚";
          } else if (
            voucher.discount_type === "percent" &&
            voucher.discount_percent
          ) {
            discountText = `${voucher.discount_percent}%`;
            color = "#FFF3E0";
            borderColor = "#F57C00";
            icon = "🔥";
          } else if (
            voucher.discount_type === "amount" &&
            voucher.discount_amount
          ) {
            discountText =
              voucher.discount_amount.toLocaleString("vi-VN") + "₫";
            color = "#E8F5E9";
            borderColor = "#388E3C";
            icon = "💸";
          }

          return (
            <Col key={voucher.id}>
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
                        {voucher.code}
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
                      <div style={{ fontSize: 15, color: "#555" }}>
                        {voucher.name || voucher.title}
                      </div>
                    </div>
                  </div>
                  <Card.Text className="mb-0" style={{ fontSize: 15 }}>
                    <div>
                      💰 <b>Giá trị:</b> {discountText || "—"}
                    </div>
                    <div>
                      🧾 <b>Đơn tối thiểu:</b>{" "}
                      {voucher.min_order_value
                        ? voucher.min_order_value.toLocaleString("vi-VN") + "₫"
                        : "Không yêu cầu"}
                    </div>
                    <div>
                      📅 <b>Hạn sử dụng:</b>{" "}
                      {new Date(voucher.start_at).toLocaleDateString("vi-VN")} →{" "}
                      {new Date(voucher.end_at).toLocaleDateString("vi-VN")}
                    </div>

                    <div>
                      🎟️ <b>Số lượng:</b>{" "}
                      {voucher.quantity
                        ? voucher.quantity.toLocaleString("vi-VN")
                        : "Không giới hạn"}
                    </div>
                  </Card.Text>
                  <div className="mt-2">
                    {!voucher.used && !voucher.expired ? (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={async () => {
                          try {
                            await claimVoucher(voucher.code);
                            await fetchVouchers();
                            toast.success("🎉 Nhận voucher thành công!");
                          } catch (err) {
                            toast.error("❌ Nhận voucher thất bại!");
                          }
                        }}
                        style={{ minWidth: 120, fontWeight: 600 }}
                      >
                        Nhận voucher
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled
                        style={{ minWidth: 120 }}
                      >
                        Không khả dụng
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            {[...Array(totalPages)].map((_, index) => (
              <Pagination.Item
                key={index + 1}
                active={index + 1 === currentPage}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </Pagination.Item>
            ))}
          </Pagination>
        </div>
      )}
    </Container>
  );
};

export default VoucherList;
