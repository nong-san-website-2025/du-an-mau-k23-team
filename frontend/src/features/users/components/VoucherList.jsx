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
import { getVouchers, getMyVouchers, claimVoucher } from "../../admin/services/promotionServices";

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
    if (filter === "expired") return v.expired;
    if (filter === "active") return !v.expired;
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
      <h5 className="mb-3" style={{ color: "#F57C00" }}>
        🎁 Kho Voucher
      </h5>

      <Form.Select
        className="mb-4"
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value);
          setCurrentPage(1); // reset về trang 1 khi đổi filter
        }}
        style={{ maxWidth: "300px" }}
      >
        <option value="all">Tất cả</option>
        <option value="active">Voucher Thường</option>
        <option value="used">Voucher FreeShip</option>
      </Form.Select>

      <Row>
        {currentVouchers.length === 0 && (
          <p className="text-muted">Không có voucher nào phù hợp.</p>
        )}

        {currentVouchers.map((voucher) => {
          // Xử lý hiển thị giá trị voucher
          let discountText = "";
          if (voucher.freeship_amount) {
            discountText = `Freeship ${voucher.freeship_amount.toLocaleString("vi-VN")}₫`;
          } else if (voucher.discount_percent) {
            discountText = `${voucher.discount_percent}%`;
          } else if (voucher.discount_amount) {
            discountText =
              voucher.discount_amount.toLocaleString("vi-VN") + "₫";
          }

          return (
            <Col xs={12} key={voucher.id} className="mb-3">
              <Card className="shadow-sm border-0 w-100 h-100">
                <Card.Body className="d-flex justify-content-between align-items-center">
                  <div>
                    <Card.Title>
                      <span className="fw-bold">{voucher.code}</span>
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
                    <Card.Text className="mb-0">
                      <div>
                        💳 Loại:{" "}
                        {voucher.discount_type === "freeship"
                          ? "FreeShip"
                          : "Thường"}
                      </div>
                      <div>💰 Giá trị: {discountText}</div>
                      <div>
                        🧾 Đơn tối thiểu:{" "}
                        {voucher.min_order_value
                          ? voucher.min_order_value.toLocaleString("vi-VN") +
                            "₫"
                          : "Không yêu cầu"}
                      </div>
                      <div>
                        📅 Hạn sử dụng: {voucher.start_at} → {voucher.end_at}
                      </div>
                    </Card.Text>
                  </div>

                  <div>
                    {!voucher.used && !voucher.expired ? (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={async () => {
                          try {
                            await claimVoucher(voucher.code);
                            await fetchVouchers();
                          } catch (err) {
                            alert("Nhận voucher thất bại!");
                          }
                        }}
                      >
                        Nhận voucher
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" disabled>
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
