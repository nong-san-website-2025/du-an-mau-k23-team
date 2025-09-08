import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const EditPromotion = () => {
  const { id } = useParams(); // Lấy ID từ URL
  const navigate = useNavigate();

  const [promotion, setPromotion] = useState({
    name: "",
    code: "",
    description: "",
    type: "",
    condition: "",
    start: "",
    end: "",
    total: 0,
    used: 0,
    products: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(true); // popup luôn mở

  // Lấy dữ liệu promotion
  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/api/promotions/promotions/${id}/`)
      .then((res) => {
        setPromotion(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Không tải được dữ liệu promotion");
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPromotion({ ...promotion, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...promotion,
      start: promotion.start ? new Date(promotion.start).toISOString() : null,
      end: promotion.end ? new Date(promotion.end).toISOString() : null,
    };

    axios
      .put(`http://127.0.0.1:8000/api/promotions/promotions/${id}/`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(() => {
        alert("Cập nhật thành công!");
        setShowModal(false); // đóng popup
        navigate("/promotions"); // quay về danh sách
      })
      .catch((err) => {
        console.error(err.response || err);
        alert("Cập nhật thất bại. Kiểm tra console để biết lỗi.");
      });
  };

  const handleClose = () => {
    setShowModal(false);
    navigate(-1); // quay lại trang trước
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;
  if (error) return <div>{error}</div>;
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
        }}>Chỉnh sửa khuyến mãi</h2>
        <form onSubmit={handleSubmit}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
            <tbody>
              <tr><th style={cellLabelStyle}>Tên</th><td style={cellValueStyle}><input type="text" name="name" value={promotion.name} onChange={handleChange} required style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Code</th><td style={cellValueStyle}><input type="text" name="code" value={promotion.code} onChange={handleChange} required style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Mô tả</th><td style={cellValueStyle}><textarea name="description" value={promotion.description} onChange={handleChange} style={{ ...inputStyle, minHeight: 40 }} /></td></tr>
              <tr><th style={cellLabelStyle}>Loại</th><td style={cellValueStyle}><input type="text" name="type" value={promotion.type} onChange={handleChange} style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Điều kiện</th><td style={cellValueStyle}><input type="text" name="condition" value={promotion.condition} onChange={handleChange} style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Ngày bắt đầu</th><td style={cellValueStyle}><input type="datetime-local" name="start" value={promotion.start ? promotion.start.slice(0, 16) : ""} onChange={handleChange} style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Ngày kết thúc</th><td style={cellValueStyle}><input type="datetime-local" name="end" value={promotion.end ? promotion.end.slice(0, 16) : ""} onChange={handleChange} style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Tổng số</th><td style={cellValueStyle}><input type="number" name="total" value={promotion.total} onChange={handleChange} style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Số đã dùng</th><td style={cellValueStyle}><input type="number" name="used" value={promotion.used} onChange={handleChange} style={inputStyle} /></td></tr>
              <tr><th style={cellLabelStyle}>Sản phẩm áp dụng</th><td style={cellValueStyle}><input type="number" name="products" value={promotion.products} onChange={handleChange} style={inputStyle} /></td></tr>
            </tbody>
          </table>
          <div style={{ textAlign: 'right' }}>
            <button type="submit" style={submitBtnStyle}>Lưu</button>
          </div>
        </form>
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
  background: '#fff', fontWeight: 400, color: '#7f8c8d', padding: '14px 22px', borderBottom: '1px solid #f0f0f0', width: '38%', fontSize: '1.08rem', textAlign: 'left', fontFamily: 'Roboto, Arial, sans-serif'
};
const cellValueStyle = {
  background: '#fff', fontWeight: 500, color: '#222', padding: '14px 22px', borderBottom: '1px solid #f0f0f0', fontSize: '1.08rem', textAlign: 'left', fontFamily: 'Roboto, Arial, sans-serif', letterSpacing: '-0.2px'
};
const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #e5e9f2', fontSize: '1.08rem', fontFamily: 'Roboto, Arial, sans-serif', background: '#fafbfc', color: '#222', outline: 'none', boxSizing: 'border-box', fontWeight: 400, letterSpacing: '-0.2px'
};
const submitBtnStyle = {
  padding: '10px 32px', background: '#222', color: '#fff', borderRadius: '10px', fontSize: '1.08rem', cursor: 'pointer', fontWeight: 500, fontFamily: 'Roboto, Arial, sans-serif', border: 'none', boxShadow: '0 2px 8px rgba(44,62,80,0.10)', transition: 'background 0.2s', marginTop: '12px'
};

export default EditPromotion;
