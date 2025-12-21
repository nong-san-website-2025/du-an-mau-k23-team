import React, { useState, useEffect, useMemo } from "react";
import {
  Card, Badge, Container, Spinner, Tabs, Tab, Modal, Button, Pagination, Row, Col, OverlayTrigger, Tooltip
} from "react-bootstrap";
import { 
  FaShippingFast, FaPercent, FaCoins, FaRegCopy, FaTicketAlt, FaStore, FaCalendarAlt, FaInfoCircle, FaCheckCircle, FaTimesCircle
} from "react-icons/fa";
import { toast } from "react-toastify";
import { getMyVouchers } from "../../admin/services/promotionServices";

const MyVoucher = () => {
  const [userVouchers, setUserVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("unused");
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const vouchersPerPage = 12;

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return setLoading(false);
    try {
      setLoading(true);
      const res = await getMyVouchers();
      // Đảo ngược danh sách gốc để voucher mới nhất (thường là cuối mảng) lên đầu
      // Hoặc nếu API trả về giảm dần theo ID/created_at thì không cần reverse
      // Ở đây tôi dùng sort giảm dần theo ID để chắc chắn mới nhất lên đầu
      const sortedRes = (res || []).sort((a, b) => b.id - a.id); 
      setUserVouchers(sortedRes);
    } catch (err) {
      console.error("Lỗi tải túi voucher:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [tab]);

  // --- 1. GỘP VOUCHER ---
  const groupedVouchers = useMemo(() => {
    if (!userVouchers.length) return [];
    
    // Dùng Map để giữ thứ tự chèn (insertion order) - quan trọng để giữ voucher mới nhất ở đầu
    const groups = new Map();
    
    userVouchers.forEach(uv => {
        const v = uv.voucher;
        if (!v) return;
        const code = v.code; 

        if (!groups.has(code)) {
            groups.set(code, { 
                ...uv, // Lấy thông tin của bản ghi mới nhất (vì list đã sort)
                quantity: 0, 
                used_count: 0, 
                voucher: v 
            });
        }
        
        const item = groups.get(code);
        item.quantity += (uv.quantity || 1);
        item.used_count += (uv.used_count || 0);
    });
    
    return Array.from(groups.values());
  }, [userVouchers]);

  // --- 2. LỌC ---
  const now = new Date();
  const filteredVouchers = groupedVouchers.filter((item) => {
    const v = item.voucher;
    if (!v) return false;
    
    const isExpired = v.end_at && new Date(v.end_at) < now;
    const isFullyUsed = item.quantity > 0 && item.used_count >= item.quantity;

    // Tab Chưa dùng: Phải chưa dùng hết VÀ chưa hết hạn
    if (tab === "unused") return !isFullyUsed && !isExpired;
    
    // Tab Đã dùng: Đã dùng hết
    if (tab === "used") return isFullyUsed;
    
    // Tab Hết hạn: Hết hạn nhưng chưa dùng hết (để user biết mình bỏ lỡ)
    if (tab === "expired") return isExpired && !isFullyUsed;
    
    return true;
  });

  const indexOfLast = currentPage * vouchersPerPage;
  const indexOfFirst = indexOfLast - vouchersPerPage;
  const currentVouchers = filteredVouchers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredVouchers.length / vouchersPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.info("📋 Đã sao chép mã voucher");
  };

  const getStyle = (v) => {
    if (v.discount_type === "freeship" || (v.freeship_amount > 0)) {
      return { bg: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)", border: "#91d5ff", text: "#0050b3", icon: <FaShippingFast className="fs-4"/>, label: "Freeship" };
    } else if (v.discount_type === "percent") {
      return { bg: "linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)", border: "#ffc069", text: "#d46b08", icon: <FaPercent className="fs-4"/>, label: "Giảm %" };
    }
    return { bg: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)", border: "#b7eb8f", text: "#389e0d", icon: <FaCoins className="fs-4"/>, label: "Giảm tiền" };
  };

  // Helper hiển thị giá trị giảm rõ ràng
  const renderDiscountValue = (v) => {
      if (v.discount_type === 'freeship' || (v.freeship_amount > 0)) {
          return `Freeship tối đa ${parseInt(v.freeship_amount).toLocaleString()}đ`;
      }
      if (v.discount_type === 'percent') {
          return `Giảm ${v.discount_percent}% (Tối đa ${parseInt(v.max_discount_amount || 0).toLocaleString()}đ)`;
      }
      return `Giảm trực tiếp ${parseInt(v.discount_amount || 0).toLocaleString()}đ`;
  };

  const VoucherCard = ({ item }) => {
    const v = item.voucher;
    const info = getStyle(v);
    const isExpired = v.end_at && new Date(v.end_at) < now;
    const isUsed = item.quantity > 0 && item.used_count >= item.quantity;
    const remainingQty = item.quantity - item.used_count;

    return (
      <Col xs={12} md={6} lg={4} xl={4} className="mb-4">
        <Card className="h-100 border-0 shadow-sm hover-shadow" style={{ borderRadius: "12px", overflow: "hidden", opacity: (isUsed||isExpired)?0.6:1 }}>
          <div className="p-3 d-flex justify-content-between align-items-center" style={{ background: info.bg, borderBottom: `1px solid ${info.border}`, filter: (isUsed||isExpired)?'grayscale(100%)':'none' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 bg-white rounded-circle shadow-sm" style={{ color: info.text }}>{info.icon}</div>
              <div>
                <div className="fw-bold" style={{ color: info.text, fontSize: "0.9rem" }}>{info.label}</div>
                <div className="small text-muted" style={{ fontSize: "0.75rem" }}>{v.source_name || 'GreenFarm'}</div>
              </div>
            </div>
            {isUsed ? <Badge bg="secondary" pill>Đã dùng</Badge> : isExpired ? <Badge bg="danger" pill>Hết hạn</Badge> : <Badge bg="success" pill>Sẵn sàng</Badge>}
            {item.quantity > 1 && <div className="mt-1 text-end fw-bold text-dark" style={{fontSize: '0.8rem'}}>x{item.quantity}</div>}
          </div>
          <Card.Body className="d-flex flex-column p-3">
            <div className="flex-grow-1">
              <h6 className="fw-bold text-dark mb-2 text-truncate" title={v.title}>{v.title || "Voucher"}</h6>
              <div className="my-2 p-2 bg-light rounded border border-dashed d-flex justify-content-between align-items-center">
                <code className="fs-6 fw-bold text-primary">{v.code}</code>
                <OverlayTrigger overlay={<Tooltip>Sao chép</Tooltip>}>
                  <Button variant="link" size="sm" className="p-0 text-secondary" onClick={() => copyToClipboard(v.code)}><FaRegCopy /></Button>
                </OverlayTrigger>
              </div>
              <div className="small text-secondary mb-1"><FaInfoCircle className="me-1 text-info"/>{renderDiscountValue(v)}</div>
              
              <div className="d-flex justify-content-between align-items-center mt-2 small bg-light px-2 py-1 rounded border">
                 <span className={remainingQty > 0 ? "text-success fw-bold" : "text-muted"}>
                    {remainingQty > 0 ? `Còn lại: ${remainingQty} lượt` : "Đã dùng hết"}
                 </span>
                 <span className="text-muted">Tổng: {item.quantity}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-top">
              <Button variant="outline-primary" size="sm" className="w-100 rounded-pill" onClick={() => {setSelectedVoucher(item); setShowDetailModal(true);}}>Xem chi tiết</Button>
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  if (loading) return <div className="text-center my-5 py-5"><Spinner animation="border" variant="primary"/><div className="mt-3 text-muted">Đang tải ví voucher...</div></div>;

  return (
    <Container className="py-2">
      <div className="mb-4"><h4 className="fw-bold mb-1">🎁 Ví Voucher Của Tôi</h4><p className="text-muted small mb-0">Quản lý mã giảm giá của bạn</p></div>
      <Tabs activeKey={tab} onSelect={(k)=>{setTab(k); setCurrentPage(1);}} className="mb-4 custom-tabs border-bottom-0" fill>
        <Tab eventKey="unused" title={<span className="fw-bold">⚡ Chưa sử dụng</span>} />
        <Tab eventKey="used" title={<span className="text-secondary">Đã sử dụng</span>} />
        <Tab eventKey="expired" title={<span className="text-secondary">Hết hạn</span>} />
      </Tabs>
      
      <div className="mb-3 px-2 text-muted small fw-bold">Tìm thấy {filteredVouchers.length} loại voucher</div>
      <Row>
        {currentVouchers.length===0 ? <Col xs={12} className="text-center py-5 bg-light rounded"><div className="mb-3" style={{fontSize:"3rem"}}>📭</div><h6 className="text-muted">Trống trơn</h6></Col> : currentVouchers.map(item => <VoucherCard key={item.id || item.voucher.code} item={item} />)}
      </Row>

      {/* Pagination */}
      {totalPages > 1 && <div className="d-flex justify-content-center mt-4"><Pagination><Pagination.Prev onClick={()=>handlePageChange(Math.max(1,currentPage-1))} disabled={currentPage===1}/><Pagination.Item active>{currentPage}</Pagination.Item><Pagination.Next onClick={()=>handlePageChange(Math.min(totalPages,currentPage+1))} disabled={currentPage===totalPages}/></Pagination></div>}

      {/* MODAL CHI TIẾT */}
      <Modal show={showDetailModal} onHide={()=>setShowDetailModal(false)} centered className="voucher-detail-modal">
        {selectedVoucher && selectedVoucher.voucher && (() => {
           const v = selectedVoucher.voucher;
           const info = getStyle(v);
           return (
             <>
              <Modal.Header closeButton style={{borderBottom:"none", background:"#f8f9fa"}}><Modal.Title className="fs-5 fw-bold"><FaTicketAlt className="text-primary me-2"/>Thông tin voucher</Modal.Title></Modal.Header>
              <Modal.Body className="p-0">
                <div className="p-4 text-center" style={{background:info.bg}}>
                  <div className="d-inline-flex p-3 rounded-circle bg-white shadow-sm mb-2 fs-1" style={{color:info.text}}>{info.icon}</div>
                  <h5 className="fw-bold mb-1">{v.title}</h5>
                  <Badge bg="light" text="dark" className="border mt-1">{v.source_name || 'GreenFarm'}</Badge>
                </div>
                <div className="p-4">
                  <div className="bg-light p-3 rounded border border-dashed text-center mb-4"><div className="text-muted small mb-1 fw-bold text-uppercase">Mã Voucher</div><div className="d-flex justify-content-center gap-2"><span className="fs-3 fw-bold text-primary">{v.code}</span><Button variant="white" size="sm" onClick={()=>copyToClipboard(v.code)}><FaRegCopy/></Button></div></div>
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between border-bottom pb-2"><span className="text-muted small"><FaTicketAlt className="me-2"/>Loại</span><span className="fw-medium">{info.label}</span></div>
                    
                    {/* [FIX] HIỂN THỊ RÕ RÀNG */}
                    <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-muted small"><FaCoins className="me-2"/>Giá trị giảm</span>
                        <span className="fw-bold text-success text-end" style={{maxWidth:'60%'}}>{renderDiscountValue(v)}</span>
                    </div>

                    <div className="d-flex justify-content-between border-bottom pb-2"><span className="text-muted small"><FaStore className="me-2"/>Đơn từ</span><span className="fw-medium">{parseInt(v.min_order_value||0).toLocaleString()}đ</span></div>
                    <div className="d-flex justify-content-between border-bottom pb-2"><span className="text-muted small"><FaCalendarAlt className="me-2"/>Hạn dùng</span><span className="text-danger fw-medium">{v.end_at ? new Date(v.end_at).toLocaleDateString("vi-VN") : "Vĩnh viễn"}</span></div>
                    <div className="d-flex justify-content-between align-items-center"><span className="text-muted small"><FaInfoCircle className="me-2"/>Số lượng sở hữu</span><span className="fw-bold text-primary fs-5">{selectedVoucher.quantity}</span></div>
                    <div className="d-flex justify-content-between align-items-center"><span className="text-muted small"><FaCheckCircle className="me-2"/>Đã sử dụng</span><span className="fw-bold text-secondary fs-5">{selectedVoucher.used_count}</span></div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer className="border-top-0 bg-light justify-content-center"><Button variant="outline-secondary" className="rounded-pill px-5" onClick={()=>setShowDetailModal(false)}>Đóng</Button></Modal.Footer>
             </>
           )
        })()}
      </Modal>
    </Container>
  );
};
export default MyVoucher;