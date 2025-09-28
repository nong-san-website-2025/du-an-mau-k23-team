import React, { useState, useEffect } from "react";
import { Card, Badge, Container, Spinner, Tabs, Tab, Modal, Table, Button, Pagination } from "react-bootstrap";
import { getMyVouchers } from "../../admin/services/promotionServices";

const MyVoucher = () => {
  const [userVouchers, setUserVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("unused");
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const vouchersPerPage = 10;

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
  }, [tab]);

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

  // Tính toán phân trang
  const indexOfLast = currentPage * vouchersPerPage;
  const indexOfFirst = indexOfLast - vouchersPerPage;
  const currentVouchers = filteredVouchers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredVouchers.length / vouchersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const openDetailModal = (uv) => {
    setSelectedVoucher(uv);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" style={{ color: "#1890ff" }} />
        <div className="mt-2 text-muted">Đang tải voucher của bạn...</div>
      </div>
    );
  }

  return (
    <Container className="py-1">
      <div className="mb-1">
        <h5 
          className="mb-3"
          style={{ 
            color: "#1890ff", 
            fontWeight: 600, 
            fontSize: "1.3rem",
            letterSpacing: "0.5px"
          }}
        >
          🎁 Voucher của tôi
        </h5>
      </div>

      <Tabs
        activeKey={tab}
        onSelect={(k) => {
          setTab(k);
          setCurrentPage(1);
        }}
        className="mb-4"
        style={{ 
          background: "#fff", 
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}
      >
        <Tab 
          eventKey="unused" 
          title={
            <span style={{ 
              color: tab === "unused" ? "#1890ff" : "#8c8c8c",
              fontWeight: tab === "unused" ? 600 : 500
            }}>
              Chưa sử dụng ({userVouchers.filter(uv => uv?.voucher && !uv.is_used && new Date(uv?.voucher.end_at) >= now).length})
            </span>
          } 
        />
        <Tab 
          eventKey="used" 
          title={
            <span style={{ 
              color: tab === "used" ? "#1890ff" : "#8c8c8c",
              fontWeight: tab === "used" ? 600 : 500
            }}>
              Đã sử dụng ({userVouchers.filter(uv => uv.is_used).length})
            </span>
          } 
        />
        <Tab 
          eventKey="expired" 
          title={
            <span style={{ 
              color: tab === "expired" ? "#1890ff" : "#8c8c8c",
              fontWeight: tab === "expired" ? 600 : 500
            }}>
              Hết hạn ({userVouchers.filter(uv => uv?.voucher && new Date(uv?.voucher.end_at) < now).length})
            </span>
          } 
        />
      </Tabs>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="text-muted small">
          Hiển thị: {Math.min(indexOfLast, filteredVouchers.length)} / {filteredVouchers.length} voucher
        </span>
      </div>

      <div className="voucher-list">
        {currentVouchers.length === 0 ? (
          <div className="text-center py-3">
            <div className="mb-3" style={{ fontSize: "2rem" }}>📭</div>
            <p className="text-muted mb-0">Không có voucher nào phù hợp</p>
          </div>
        ) : (
          currentVouchers.map((uv) => {
            const v = uv?.voucher;
            if (!v) return null;

            const style = getVoucherStyle(v);
            const isExpired = new Date(v.end_at) < now;
            const endDate = new Date(v.end_at);

            return (
              <Card
                key={uv.id}
                className="mb-1 border-0 shadow-sm"
                style={{
                  background: style.bgColor,
                  border: `1px solid ${style.borderColor}`,
                  borderRadius: "8px",
                  minHeight: "60px",
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
                          {v.code}
                        </strong>
                        {uv.is_used && (
                          <Badge 
                            bg="secondary" 
                            style={{ fontSize: "0.7rem" }}
                          >
                            Đã dùng
                          </Badge>
                        )}
                        {isExpired && (
                          <Badge 
                            bg="danger" 
                            style={{ fontSize: "0.7rem" }}
                          >
                            Hết hạn
                          </Badge>
                        )}
                        </div>
                      
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        <span 
                          className="small"
                          style={{ color: style.color, fontWeight: 500 }}
                        >
                          {v.discount_type === "freeship" && v.freeship_amount 
                            ? `Freeship ${Number(v.freeship_amount).toLocaleString("vi-VN")}₫`
                            : v.discount_type === "percent" && v.discount_percent
                            ? `${v.discount_percent}%`
                            : v.discount_type === "amount" && v.discount_amount
                            ? `${Number(v.discount_amount).toLocaleString("vi-VN")}₫`
                            : "—"}
                        </span>
                        
                        <small className="text-muted">
                          Đơn tối thiểu: {v.min_order_value 
                            ? Number(v.min_order_value).toLocaleString("vi-VN") + "₫" 
                            : "Không yêu cầu"}
                        </small>
                        
                        <small className="text-muted">
                          Hết hạn: {endDate.toLocaleDateString("vi-VN")}
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => openDetailModal(uv)}
                      style={{
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        padding: "4px 12px"
                      }}
                    >
                      Chi tiết
                    </Button>
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
                  <td>{selectedVoucher.voucher.code}</td>
                </tr>
                <tr>
                  <td><strong>Tên:</strong></td>
                  <td>{selectedVoucher.voucher.name || selectedVoucher.voucher.title}</td>
                </tr>
                <tr>
                  <td><strong>Loại:</strong></td>
                  <td>
                    {selectedVoucher.voucher.discount_type === "freeship" ? "Freeship" :
                     selectedVoucher.voucher.discount_type === "percent" ? "Phần trăm" :
                     selectedVoucher.voucher.discount_type === "amount" ? "Số tiền" : "Không xác định"}
                  </td>
                </tr>
                <tr>
                  <td><strong>Giá trị:</strong></td>
                  <td>
                    {selectedVoucher.voucher.discount_type === "freeship" && selectedVoucher.voucher.freeship_amount 
                      ? `Freeship ${Number(selectedVoucher.voucher.freeship_amount).toLocaleString("vi-VN")}₫`
                      : selectedVoucher.voucher.discount_type === "percent" && selectedVoucher.voucher.discount_percent
                      ? `${selectedVoucher.voucher.discount_percent}%`
                      : selectedVoucher.voucher.discount_type === "amount" && selectedVoucher.voucher.discount_amount
                      ? `${Number(selectedVoucher.voucher.discount_amount).toLocaleString("vi-VN")}₫`
                      : "—"}
                  </td>
                </tr>
                <tr>
                  <td><strong>Đơn tối thiểu:</strong></td>
                  <td>
                    {selectedVoucher.voucher.min_order_value 
                      ? Number(selectedVoucher.voucher.min_order_value).toLocaleString("vi-VN") + "₫" 
                      : "Không yêu cầu"}
                  </td>
                </tr>
                <tr>
                  <td><strong>Hạn sử dụng:</strong></td>
                  <td>
                    {new Date(selectedVoucher.voucher.start_at).toLocaleDateString("vi-VN")} →{" "}
                    {new Date(selectedVoucher.voucher.end_at).toLocaleDateString("vi-VN")}
                  </td>
                </tr>
                <tr>
                  <td><strong>Số lượng:</strong></td>
                  <td>
                    {selectedVoucher.quantity && selectedVoucher.used_count !== undefined 
                      ? (selectedVoucher.quantity - selectedVoucher.used_count) + "/" + selectedVoucher.quantity
                      : "—" + "/" + (selectedVoucher.quantity || "—")}
                  </td>
                </tr>
                <tr>
                  <td><strong>Trạng thái sử dụng:</strong></td>
                  <td>
                    <Badge bg={selectedVoucher.is_used ? "secondary" : "success"}>
                      {selectedVoucher.is_used ? "Đã sử dụng" : "Chưa sử dụng"}
                    </Badge>
                  </td>
                </tr>
                <tr>
                  <td><strong>Ngày nhận:</strong></td>
                  <td>
                    {selectedVoucher.created_at 
                      ? new Date(selectedVoucher.created_at).toLocaleDateString("vi-VN")
                      : "Không có thông tin"}
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
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MyVoucher; 