import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const PromotionForm = () => {
  const [promo, setPromo] = useState({
    code: "",
    name: "",
    description: "",
    type: "",
    condition: "",
    start: "",
    end: "",
    total: 0,
    used: 0,
    products: 0,
  });
  const navigate = useNavigate();
  const { id } = useParams(); // nếu id tồn tại → sửa, ko → thêm mới
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    if (id) {
      axios
        .get(`http://127.0.0.1:8000/api/promotions/${id}/`)
        .then((res) => setPromo(res.data))
        .catch(() => alert("Lấy chi tiết thất bại"));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPromo({ ...promo, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await axios.put(`http://127.0.0.1:8000/api/promotions/${id}/`, promo);
        alert("Cập nhật thành công");
      } else {
        await axios.post("http://127.0.0.1:8000/api/promotions/", promo);
        alert("Thêm mới thành công");
      }
      handleClose();
    } catch (err) {
      console.error(err);
      alert("Lưu thất bại");
    }
  };

  const handleClose = () => {
    setShowModal(false);
    navigate("/seller-center/promotions"); // quay về danh sách
  };

  if (!showModal) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button style={closeBtnStyle} onClick={handleClose}>×</button>
        <h2 style={{
          fontSize: '1.45rem',
          fontWeight: 700,
          color: '#222',
          margin: '0 0 24px 0',
          fontFamily: 'Roboto, Arial, sans-serif',
          letterSpacing: '-0.5px',
          lineHeight: '1.18',
          textShadow: '0 2px 8px rgba(44,62,80,0.08)'
        }}>{id ? "Sửa Khuyến mãi" : "Thêm Khuyến mãi"}</h2>
        <form onSubmit={handleSubmit}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
            <tbody>
              <tr><th style={cellLabelStyle}>Mã</th><td style={cellValueStyle}><input name="code" value={promo.code} onChange={handleChange} required style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Tên</th><td style={cellValueStyle}><input name="name" value={promo.name} onChange={handleChange} required style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Mô tả</th><td style={cellValueStyle}><input name="description" value={promo.description} onChange={handleChange} style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Loại</th><td style={cellValueStyle}><input name="type" value={promo.type} onChange={handleChange} style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Điều kiện</th><td style={cellValueStyle}><input name="condition" value={promo.condition} onChange={handleChange} style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Bắt đầu</th><td style={cellValueStyle}><input type="datetime-local" name="start" value={promo.start?.slice(0, 16)} onChange={handleChange} style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Kết thúc</th><td style={cellValueStyle}><input type="datetime-local" name="end" value={promo.end?.slice(0, 16)} onChange={handleChange} style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Tổng số</th><td style={cellValueStyle}><input type="number" name="total" value={promo.total} onChange={handleChange} style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Đã dùng</th><td style={cellValueStyle}><input type="number" name="used" value={promo.used} onChange={handleChange} style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Sản phẩm</th><td style={cellValueStyle}><input type="number" name="products" value={promo.products} onChange={handleChange} style={inputStyle} /></td></tr>
            </tbody>
          </table>
          <div style={{ textAlign: 'right' }}>
            <button type="submit" style={submitBtnStyle}>{id ? "Lưu sửa" : "Thêm mới"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// styles giống ViewPromotion
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalStyle = {
  backgroundColor: "#fff",
  padding: "24px 32px 32px 32px",
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
  cursor: "pointer",
};

const cellLabelStyle = {
  background: '#fff', fontWeight: 400, color: '#7f8c8d', padding: '14px 22px', borderBottom: '1px solid #f0f0f0', width: '38%', fontSize: '1.08rem', textAlign: 'left', fontFamily: 'Roboto, Arial, sans-serif'
};
const cellValueStyle = {
  background: '#fff', fontWeight: 400, color: '#222', padding: '14px 22px', borderBottom: '1px solid #f0f0f0', fontSize: '1.08rem', textAlign: 'left', fontFamily: 'Roboto, Arial, sans-serif', letterSpacing: '-0.2px'
};
const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #e5e9f2', fontSize: '1.08rem', fontFamily: 'Roboto, Arial, sans-serif', background: '#fafbfc', color: '#222', outline: 'none', boxSizing: 'border-box', fontWeight: 400, letterSpacing: '-0.2px'
};
const submitBtnStyle = {
  padding: '10px 32px', background: '#222', color: '#fff', borderRadius: '10px', fontSize: '1.08rem', cursor: 'pointer', fontWeight: 500, fontFamily: 'Roboto, Arial, sans-serif', border: 'none', boxShadow: '0 2px 8px rgba(44,62,80,0.10)', transition: 'background 0.2s', marginTop: '12px'
};

export default PromotionForm;
