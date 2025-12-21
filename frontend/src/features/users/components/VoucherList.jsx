import React, { useState, useEffect, useMemo } from "react";
import {
  Card, Button, Badge, Container, Form, Spinner, Row, Col, Modal, Pagination, ProgressBar
} from "react-bootstrap";
import { toast } from "react-toastify";
import { 
  FaTag, FaShippingFast, FaPercent, FaCoins, FaRegCopy, FaStore, FaInfoCircle, FaCalendarAlt, FaTicketAlt, FaCheckCircle, FaFireAlt
} from "react-icons/fa";
import { getVouchers, getMyVouchers, claimVoucher } from "../../admin/services/promotionServices";

const VoucherList = () => {
  const [vouchers, setVouchers] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const vouchersPerPage = 12;

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const [allRes, myRes] = await Promise.all([getVouchers(), getMyVouchers()]);
      setVouchers(allRes || []);
      setMyVouchers(myRes || []);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVouchers(); }, []);

  // --- 1. GỘP VOUCHER TRÙNG MÃ ---
  const groupedVouchers = useMemo(() => {
    if (!vouchers.length) return [];
    const groups = {};
    vouchers.forEach(v => {
        if (!groups[v.code]) {
            groups[v.code] = { ...v }; 
        }
    });
    return Object.values(groups);
  }, [vouchers]);

  // --- 2. TẠO DANH SÁCH MÃ ĐÃ SỞ HỮU ---
  // Dùng Set để tra cứu nhanh các mã voucher mà user đã có trong ví
  const ownedVoucherCodes = useMemo(() => {
    const codes = new Set();
    if (myVouchers && myVouchers.length > 0) {
        myVouchers.forEach(uv => {
            if (uv.voucher && uv.voucher.code) {
                codes.add(uv.voucher.code);
            }
        });
    }
    return codes;
  }, [myVouchers]);

  // --- 3. LỌC HIỂN THỊ ---
  const filtered = groupedVouchers.filter((v) => {
    // Chỉ hiện voucher loại 'claim' (loại cần phải lưu)
    if (v.distribution_type !== "claim") return false;
    
    // [QUAN TRỌNG] Ẩn Voucher đã có trong ví (Đã nhận rồi thì thôi)
    if (ownedVoucherCodes.has(v.code)) return false;

    // Logic ẩn Voucher Hết hạn / Hết lượt
    const now = new Date();
    const isExpired = v.end_at && new Date(v.end_at) < now;
    
    const totalQty = v.total_quantity || 0;
    const usedQty = v.issued_count || v.used_quantity || 0;
    const isOutOfStock = totalQty > 0 && usedQty >= totalQty; 

    if (isExpired || isOutOfStock) return false; 

    // Logic lọc theo loại (Filter Dropdown)
    if (filter === "normal") return v.discount_type !== "freeship" && (!v.freeship_amount || v.freeship_amount <= 0);
    if (filter === "freeship") return v.discount_type === "freeship" || (v.freeship_amount && v.freeship_amount > 0);
    
    return true;
  });

  const indexOfLast = currentPage * vouchersPerPage;
  const indexOfFirst = indexOfLast - vouchersPerPage;
  const currentVouchers = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / vouchersPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClaim = async (code) => {
    try {
      await claimVoucher(code);
      await fetchVouchers(); // Load lại để ẩn voucher vừa nhận đi ngay lập tức
      toast.success("🎉 Đã lưu voucher vào ví!");
      setShowDetailModal(false);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Lỗi nhận voucher";
      toast.error(msg);
    }
  };

  const getStyle = (v) => {
    if (v.discount_type === "freeship" || (v.freeship_amount > 0)) {
      return { bg: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)", border: "#91d5ff", text: "#0050b3", icon: <FaShippingFast className="fs-4"/>, label: "Freeship" };
    } else if (v.discount_type === "percent") {
      return { bg: "linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)", border: "#ffc069", text: "#d46b08", icon: <FaPercent className="fs-4"/>, label: "Giảm %" };
    }
    return { bg: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)", border: "#b7eb8f", text: "#389e0d", icon: <FaCoins className="fs-4"/>, label: "Giảm tiền" };
  };

  const renderDiscountValue = (v) => {
      if (v.discount_type === 'freeship' || (v.freeship_amount > 0)) {
          return `Giảm ${parseInt(v.freeship_amount).toLocaleString()}đ phí ship`;
      }
      if (v.discount_type === 'percent') {
          return `Giảm ${v.discount_percent}% (Tối đa ${parseInt(v.max_discount_amount || 0).toLocaleString()}đ)`;
      }
      return `Giảm trực tiếp ${parseInt(v.discount_amount || 0).toLocaleString()}đ`;
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary"/></div>;

  return (
    <Container className="py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <div><h4 className="fw-bold mb-1">🎁 Kho Mã Giảm Giá</h4><p className="text-muted small mb-0">Săn voucher ưu đãi ngay</p></div>
        <div className="d-flex gap-3 bg-white p-2 rounded border shadow-sm">
          <Form.Select value={filter} onChange={(e) => {setFilter(e.target.value); setCurrentPage(1);}} className="border-0 fw-bold text-primary" style={{width:'auto', boxShadow:'none'}}>
            <option value="all">Tất cả</option><option value="normal">Giảm giá</option><option value="freeship">Freeship</option>
          </Form.Select>
          <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill">{filtered.length} mã</Badge>
        </div>
      </div>

      <Row>
        {currentVouchers.length > 0 ? currentVouchers.map(v => {
          const info = getStyle(v);
          const totalQty = v.total_quantity || 100; 
          const usedQty = v.issued_count || v.used_quantity || 0;
          const percentUsed = Math.min(100, Math.round((usedQty / totalQty) * 100));
          
          return (
            <Col xs={12} md={6} lg={4} key={v.id} className="mb-4">
              <Card className="h-100 border-0 shadow-sm hover-shadow" style={{borderRadius:12, overflow:'hidden'}}>
                <div className="p-3 d-flex justify-content-between align-items-center" style={{background:info.bg, borderBottom:`1px solid ${info.border}`}}>
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 bg-white rounded-circle shadow-sm" style={{color:info.text}}>{info.icon}</div>
                    <div><div className="fw-bold" style={{color:info.text, fontSize:'0.9rem'}}>{info.label}</div><div className="small text-muted" style={{fontSize:'0.75rem'}}>{v.source_name || 'GreenFarm'}</div></div>
                  </div>
                  <Badge bg="success">Sẵn sàng</Badge>
                </div>
                
                <Card.Body className="p-3 d-flex flex-column">
                  <div className="flex-grow-1">
                    <h6 className="fw-bold text-truncate mb-2" title={v.title}>{v.title}</h6>
                    <div className="p-2 bg-light rounded border border-dashed d-flex justify-content-between align-items-center mb-2">
                      <code className="fs-6 fw-bold text-primary">{v.code}</code>
                      <Button variant="link" size="sm" className="p-0" onClick={()=>{navigator.clipboard.writeText(v.code); toast.info("Đã sao chép");}}><FaRegCopy/></Button>
                    </div>
                    <div className="small text-secondary mb-2"><FaInfoCircle className="me-1 text-info"/>Đơn từ {parseInt(v.min_order_value||0).toLocaleString()}đ</div>
                    
                    <div className="mb-2">
                        <div className="d-flex justify-content-between small mb-1">
                            <span className="text-muted" style={{fontSize:'0.75rem'}}>Đã dùng {percentUsed}%</span>
                            <span className="text-muted" style={{fontSize:'0.75rem'}}>{usedQty}/{totalQty}</span>
                        </div>
                        <ProgressBar now={percentUsed} variant={percentUsed > 90 ? "danger" : "warning"} style={{height: "6px", borderRadius: "10px"}} />
                    </div>
                  </div>

                  <div className="mt-2 pt-3 border-top d-flex gap-2">
                    <Button variant="outline-primary" size="sm" className="flex-grow-1 rounded-pill" onClick={()=>{setSelectedVoucher(v); setShowDetailModal(true);}}>Chi tiết</Button>
                    <Button variant="primary" size="sm" className="flex-grow-1 rounded-pill" onClick={()=>handleClaim(v.code)}>
                        {percentUsed > 90 ? <><FaFireAlt className="me-1"/>Sắp hết</> : "Lưu mã"}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        }) : <Col xs={12} className="text-center py-5"><div className="fs-1 mb-3">🎫</div><h5 className="text-muted">Không có voucher mới nào</h5><p className="text-secondary small">Bạn đã lưu hết các mã giảm giá hiện có rồi!</p></Col>}
      </Row>

      {/* MODAL CHI TIẾT */}
      <Modal show={showDetailModal} onHide={()=>setShowDetailModal(false)} centered className="voucher-detail-modal">
        {selectedVoucher && (() => {
           const info = getStyle(selectedVoucher);
           return (
             <>
              <Modal.Header closeButton style={{borderBottom:"none", background:"#f8f9fa"}}><Modal.Title className="fs-5 fw-bold"><FaTicketAlt className="text-primary me-2"/>Thông tin ưu đãi</Modal.Title></Modal.Header>
              <Modal.Body className="p-0">
                <div className="p-4 text-center" style={{background:info.bg}}>
                  <div className="d-inline-flex p-3 rounded-circle bg-white shadow-sm mb-2 fs-1" style={{color:info.text}}>{info.icon}</div>
                  <h5 className="fw-bold mb-1">{selectedVoucher.title}</h5>
                  <Badge bg="light" text="dark" className="border mt-1">{selectedVoucher.source_name || 'Hệ thống GreenFarm'}</Badge>
                </div>
                <div className="p-4">
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between border-bottom pb-2"><span className="text-muted small"><FaTag className="me-2"/>Loại</span><span className="fw-medium">{info.label}</span></div>
                    
                    <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-muted small"><FaCoins className="me-2"/>Giá trị giảm</span>
                        <span className="fw-bold text-success text-end" style={{maxWidth: '60%'}}>
                            {renderDiscountValue(selectedVoucher)}
                        </span>
                    </div>

                    <div className="d-flex justify-content-between border-bottom pb-2"><span className="text-muted small"><FaStore className="me-2"/>Đơn tối thiểu</span><span className="fw-medium">{parseInt(selectedVoucher.min_order_value||0).toLocaleString()}đ</span></div>
                    <div className="d-flex justify-content-between border-bottom pb-2"><span className="text-muted small"><FaCalendarAlt className="me-2"/>Hạn dùng</span><span className="text-danger fw-medium">{new Date(selectedVoucher.end_at).toLocaleDateString("vi-VN")}</span></div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small"><FaInfoCircle className="me-2"/>Giới hạn nhận</span>
                        <span className="fw-bold text-primary">{selectedVoucher.per_user_quantity || 1} mã / người</span>
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer className="border-top-0 bg-light justify-content-center">
                <Button variant="primary" className="rounded-pill px-5" onClick={()=>handleClaim(selectedVoucher.code)}>Lưu vào ví ngay</Button>
              </Modal.Footer>
             </>
           )
        })()}
      </Modal>
    </Container>
  );
};
export default VoucherList;