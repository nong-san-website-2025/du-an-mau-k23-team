import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const ViewPromotion = () => {
  const { id } = useParams();
  const [promotion, setPromotion] = useState(null);
  const [showModal, setShowModal] = useState(true); // luôn hiển thị popup
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/promotions/promotions/${id}/`)
      .then(res => setPromotion(res.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!promotion) return <p style={{ textAlign: "center", marginTop: 40, fontSize: "1.1rem" }}>Đang tải dữ liệu...</p>;

  const handleClose = () => {
    setShowModal(false);
    navigate(-1); // quay về trang trước
  };

  if (!showModal) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button style={closeBtnStyle} onClick={handleClose}>×</button>
  <h2 style={{ fontWeight: 700, color: '#222', fontFamily: 'Roboto, Arial, sans-serif', fontSize: '1.45rem', margin: '0 0 18px 0', padding: 0, letterSpacing: '-0.5px' }}>Chi tiết Khuyến mãi</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
          <tbody>
            <tr><th style={cellLabelStyle}>Mã</th><td style={cellValueStyle}>{promotion.code}</td></tr>
            <tr><th style={cellLabelStyle}>Tên</th><td style={cellValueStyle}>{promotion.name}</td></tr>
            <tr><th style={cellLabelStyle}>Mô tả</th><td style={cellValueStyle}>{promotion.description}</td></tr>
            <tr><th style={cellLabelStyle}>Loại</th><td style={cellValueStyle}>{promotion.type}</td></tr>
            <tr><th style={cellLabelStyle}>Bắt đầu</th><td style={cellValueStyle}>{promotion.start}</td></tr>
            <tr><th style={cellLabelStyle}>Kết thúc</th><td style={cellValueStyle}>{promotion.end}</td></tr>
            <tr><th style={cellLabelStyle}>Số sản phẩm</th><td style={cellValueStyle}>{promotion.products}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Styles cho popup
const overlayStyle = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999
};

const modalStyle = {
  backgroundColor: "#fff",
  padding: 32,
  borderRadius: 16,
  width: "700px",
  maxHeight: "85%",
  overflowY: "auto",
  position: "relative",
  boxShadow: "0 2px 12px rgba(44,62,80,0.10)",
};

const closeBtnStyle = {
  position: "absolute",
  top: 10,
  right: 10,
  fontSize: 18,
  border: "none",
  background: "none",
  cursor: "pointer"
};

const cellLabelStyle = {
  background: '#fff', fontWeight: 400, color: '#7f8c8d', padding: '12px 18px', borderBottom: '1px solid #f0f0f0', width: '38%', fontSize: '0.97rem', textAlign: 'left', fontFamily: 'Roboto, Arial, sans-serif', letterSpacing: '-0.2px'
};
const cellValueStyle = {
  background: '#fff', fontWeight: 400, color: '#222', padding: '12px 18px', borderBottom: '1px solid #f0f0f0', fontSize: '0.97rem', textAlign: 'left', fontFamily: 'Roboto, Arial, sans-serif', letterSpacing: '-0.2px'
};

export default ViewPromotion;
