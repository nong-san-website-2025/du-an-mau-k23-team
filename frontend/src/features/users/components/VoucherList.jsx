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
  Modal,
  Table,
  Pagination
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
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const vouchersPerPage = 10;

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

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClaimVoucher = async (voucherCode) => {
    try {
      await claimVoucher(voucherCode);
      await fetchVouchers();
      toast.success("🎉 Nhận voucher thành công!");
    } catch (err) {
      toast.error("❌ Nhận voucher thất bại!");
    }
  };

  const getVoucherStyle = (voucher) => {
    if (voucher.discount_type === "freeship" && voucher.freeship_amount) {
      return {
        bgColor: "#e6f7ff",
        borderColor: "#91d5ff",
        icon: "🚚",
        color: "#1890ff"
      };
    } else if (voucher.discount_type === "percent" && voucher.discount_percent) {
      return {
        bgColor: "#fffbe6",
        borderColor: "#ffe58f",
        icon: "🔥",
        color: "#fa8c16"
      };
    } else if (voucher.discount_type === "amount" && voucher.discount_amount) {
      return {
        bgColor: "#f6ffed",
        borderColor: "#b7eb8f",
        icon: "💸",
        color: "#52c41a"
      };
    }
    return {
      bgColor: "#f5f5f5",
      borderColor: "#d9d9d9",
      icon: "🏷️",
      color: "#595959"
    };
  };

  const openDetailModal = (voucher) => {
    setSelectedVoucher(voucher);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" style={{ color: "#1890ff" }} />
        <div className="mt-2 text-muted">Đang tải voucher...</div>
      </div>
    );
  }

  return (
    <Container className="py-3">
      <div className="mb-4">
        <h5
          className="mb-3"
          style={{
            color: "#1890ff",
            fontWeight: 600,
            fontSize: "1.3rem",
            letterSpacing: "0.5px",
          }}
        >
          🎁 Danh sách mã giảm giá
        </h5>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <Form.Select
            className="w-auto"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{ 
              border: "1px solid #d9d9d9", 
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "0.9rem"
            }}
          >
            <option value="all">Tất cả loại</option>
            <option value="normal">Voucher thường</option>
            <option value="freeship">Freeship</option>
          </Form.Select>
          
          <span className="text-muted small">
            Tổng: {filtered.length} voucher
          </span>
        </div>
      </div>

      <div className="voucher-list">
        {currentVouchers.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-3" style={{ fontSize: "2rem" }}>📭</div>
            <p className="text-muted mb-0">Không có voucher nào phù hợp</p>
          </div>
        ) : (
          currentVouchers.map((voucher) => {
            const style = getVoucherStyle(voucher);
            const isExpired = new Date(voucher.end_at) < new Date();
            const isUsed = voucher.used;
            const endDate = new Date(voucher.end_at);

            return (
              <Card
                key={voucher.id}
                className="mb-1 border-0 shadow-sm"
                style={{
                  background: style.bgColor,
                  border: `1px solid ${style.borderColor}`,
                  borderRadius: "8px",
                  minHeight: "80px",
                }}
              >
                <Card.Body className="d-flex align-items-center justify-content-between px-3">
                  <div className="d-flex align-items-center flex-grow-1">
                    <div 
                      className="d-flex align-items-center justify-content-center me-2"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        backgroundColor: style.borderColor,
                        color: "#fff",
                        fontSize: "1rem"
                      }}
                    >
                      {style.icon}
                    </div>
                    
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center mb-1">
                        <strong 
                          className="me-2"
                          style={{ 
                            color: style.color,
                            fontSize: "1rem",
                            fontWeight: 600
                          }}
                        >
                          {voucher.code}
                        </strong>
                        {(isUsed || isExpired) && (
                          <Badge 
                            bg={isUsed ? "secondary" : "danger"} 
                            style={{ fontSize: "0.7rem" }}
                          >
                            {isUsed ? "Đã dùng" : "Hết hạn"}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        <span 
                          className="small"
                          style={{ color: style.color, fontWeight: 500 }}
                        >
                          {voucher.discount_type === "freeship" && voucher.freeship_amount 
                            ? `Freeship ${voucher.freeship_amount.toLocaleString("vi-VN")}₫`
                            : voucher.discount_type === "percent" && voucher.discount_percent
                            ? `${voucher.discount_percent}%`
                            : voucher.discount_type === "amount" && voucher.discount_amount
                            ? `${voucher.discount_amount.toLocaleString("vi-VN")}₫`
                            : "—"}
                        </span>
                        
                        <small className="text-muted">
                          Đơn tối thiểu: {voucher.min_order_value
                            ? voucher.min_order_value.toLocaleString("vi-VN") + "₫"
                            : "Không yêu cầu"}
                        </small>
                        
                        <small className="text-muted">
                          Hết hạn: {endDate.toLocaleDateString("vi-VN")}
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center">
                    {!isUsed && !isExpired ? (
                      <>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => openDetailModal(voucher)}
                          className="me-2"
                          style={{
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            padding: "4px 12px"
                          }}
                        >
                          Chi tiết
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleClaimVoucher(voucher.code)}
                          style={{
                            backgroundColor: "#1890ff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            padding: "4px 12px"
                          }}
                        >
                          Nhận
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => openDetailModal(voucher)}
                          className="me-2"
                          style={{
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            padding: "4px 12px"
                          }}
                        >
                          Chi tiết
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          disabled
                          style={{
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            padding: "4px 12px"
                          }}
                        >
                          {isUsed ? "Đã dùng" : "Hết hạn"}
                        </Button>
                      </>
                    )}
                  </div>
                </Card.Body>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination className="mb-0">
            <Pagination.Prev 
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{ 
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                margin: "0 2px"
              }}
            />
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              
              return (
                <Pagination.Item
                  key={page}
                  active={page === currentPage}
                  onClick={() => handlePageChange(page)}
                  style={{ 
                    border: "1px solid #d9d9d9",
                    borderRadius: "6px",
                    margin: "0 2px"
                  }}
                >
                  {page}
                </Pagination.Item>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <Pagination.Ellipsis style={{ margin: "0 2px" }} />
                <Pagination.Item
                  onClick={() => handlePageChange(totalPages)}
                  style={{ 
                    border: "1px solid #d9d9d9",
                    borderRadius: "6px",
                    margin: "0 2px"
                  }}
                >
                  {totalPages}
                </Pagination.Item>
              </>
            )}
            <Pagination.Next 
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{ 
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                margin: "0 2px"
              }}
            />
          </Pagination>
        </div>
      )}

      {/* Modal chi tiết voucher */}
      <Modal 
        show={showDetailModal} 
        onHide={() => setShowDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ color: "#1890ff", fontWeight: 600 }}>
            Chi tiết Voucher
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVoucher && (
            <Table bordered responsive>
              <tbody>
                <tr>
                  <td><strong>Mã voucher:</strong></td>
                  <td>{selectedVoucher.code}</td>
                </tr>
                <tr>
                  <td><strong>Tên:</strong></td>
                  <td>{selectedVoucher.name || selectedVoucher.title}</td>
                </tr>
                <tr>
                  <td><strong>Loại:</strong></td>
                  <td>
                    {selectedVoucher.discount_type === "freeship" ? "Freeship" :
                     selectedVoucher.discount_type === "percent" ? "Phần trăm" :
                     selectedVoucher.discount_type === "amount" ? "Số tiền" : "Không xác định"}
                  </td>
                </tr>
                <tr>
                  <td><strong>Giá trị:</strong></td>
                  <td>
                    {selectedVoucher.discount_type === "freeship" && selectedVoucher.freeship_amount 
                      ? `Freeship ${selectedVoucher.freeship_amount.toLocaleString("vi-VN")}₫`
                      : selectedVoucher.discount_type === "percent" && selectedVoucher.discount_percent
                      ? `${selectedVoucher.discount_percent}%`
                      : selectedVoucher.discount_type === "amount" && selectedVoucher.discount_amount
                      ? `${selectedVoucher.discount_amount.toLocaleString("vi-VN")}₫`
                      : "—"}
                  </td>
                </tr>
                <tr>
                  <td><strong>Đơn tối thiểu:</strong></td>
                  <td>
                    {selectedVoucher.min_order_value
                      ? selectedVoucher.min_order_value.toLocaleString("vi-VN") + "₫"
                      : "Không yêu cầu"}
                  </td>
                </tr>
                <tr>
                  <td><strong>Hạn sử dụng:</strong></td>
                  <td>
                    {new Date(selectedVoucher.start_at).toLocaleDateString("vi-VN")} →{" "}
                    {new Date(selectedVoucher.end_at).toLocaleDateString("vi-VN")}
                  </td>
                </tr>
                <tr>
                  <td><strong>Loại phân phối:</strong></td>
                  <td>{selectedVoucher.distribution_type}</td>
                </tr>
                <tr>
                  <td><strong>Trạng thái:</strong></td>
                  <td>
                    <Badge bg={selectedVoucher.used ? "secondary" : "success"}>
                      {selectedVoucher.used ? "Đã sử dụng" : "Có thể sử dụng"}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowDetailModal(false)}
          >
            Đóng
          </Button>
          {!selectedVoucher?.used && new Date(selectedVoucher?.end_at) >= new Date() && (
            <Button 
              variant="primary" 
              onClick={() => {
                handleClaimVoucher(selectedVoucher.code);
                setShowDetailModal(false);
              }}
            >
              Nhận Voucher
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VoucherList;