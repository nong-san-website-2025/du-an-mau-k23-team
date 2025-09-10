import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function PromotionsDropdownTable() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const dropdownRefs = useRef({});

  useEffect(() => {
    const fetchPromotions = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/promotions/promotions/");
        setPromotions(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
    const handleClickOutside = (event) => {
      if (dropdownOpen !== null && dropdownRefs.current[dropdownOpen] && !dropdownRefs.current[dropdownOpen].contains(event.target)) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleAction = async (promo, action) => {
    setDropdownOpen(null);
    switch(action) {
      case "edit":
        navigate(`/seller-center/promotions/edit/${promo.id}`);
        break;
      case "delete":
        if (!window.confirm(`Bạn có chắc muốn xóa "${promo.name}"?`)) return;
        try {
          await axios.delete(`http://127.0.0.1:8000/api/promotions/promotions/${promo.id}/`);
          setPromotions(prev => prev.filter(p => p.id !== promo.id));
          alert("Xóa thành công!");
        } catch(err) {
          console.error(err);
          alert("Xóa thất bại!");
        }
        break;
      case "view":
        navigate(`/seller-center/promotions/view/${promo.id}`);
        break;
      default:
        break;
    }
  };

  const getStatus = (promo) => {
    const now = new Date();
    const start = new Date(promo.start);
    const end = new Date(promo.end);
    if (!start || !end) return "Không xác định";
    if (now < start) return "Sắp diễn ra";
    if (now >= start && now <= end) return "Đang chạy";
    return "Hết hạn";
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: 40, fontSize: "1.2rem" }}>Đang tải dữ liệu...</p>;

  // Filter promotions
  const filteredPromotions = promotions.filter(promo => {
    const status = getStatus(promo);
    return (
      (!search || promo.name.toLowerCase().includes(search.toLowerCase())) &&
      (!typeFilter || promo.type === typeFilter) &&
      (!statusFilter || status === statusFilter)
    );
  });

  return (
    <div style={{ maxWidth: "1400px", margin: "32px auto", padding: "0 16px", background: "#fff", borderRadius: "16px", boxShadow: "0 2px 12px rgba(44,62,80,0.08)", border: "1px solid #f0f0f0" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#222", padding: "32px 0 18px 0", margin: 0, fontFamily: 'Roboto, Arial, sans-serif', letterSpacing: "-0.5px" }}>Quản lý duyệt khuyến mãi</h1>
      <div style={{ display: "flex", gap: "12px", margin: "0 0 18px 0", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc mã"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "0 6px",
            borderRadius: "8px",
            border: "1px solid #e5e9f2",
            height: 32,
            fontSize: "0.88rem",
            minWidth: 140,
            fontFamily: 'Roboto, Arial, sans-serif',
            color: '#222',
            background: '#fff',
            outline: 'none',
            boxShadow: 'none',
            margin: 0,
            fontWeight: 400,
            letterSpacing: '-0.2px',
            '::placeholder': { color: '#7f8c8d' },
          }}
        />
        <select
          onChange={(e) => setStatusFilter(e.target.value)}
          value={statusFilter}
          style={{
            padding: "0 6px",
            borderRadius: "8px",
            border: "1px solid #e5e9f2",
            height: 32,
            fontSize: "0.88rem",
            minWidth: 120,
            fontFamily: 'Roboto, Arial, sans-serif',
            color: '#222',
            background: '#fff',
            outline: 'none',
            boxShadow: 'none',
            margin: 0,
            fontWeight: 400,
            letterSpacing: '-0.2px',
          }}
        >
          <option value="">Lọc theo trạng thái</option>
          <option value="Sắp diễn ra">Sắp diễn ra</option>
          <option value="Đang chạy">Đang chạy</option>
          <option value="Hết hạn">Hết hạn</option>
        </select>
        <select
          onChange={(e) => setTypeFilter(e.target.value)}
          value={typeFilter}
          style={{
            padding: "0 6px",
            borderRadius: "8px",
            border: "1px solid #e5e9f2",
            height: 32,
            fontSize: "0.88rem",
            minWidth: 120,
            fontFamily: 'Roboto, Arial, sans-serif',
            color: '#222',
            background: '#fff',
            outline: 'none',
            boxShadow: 'none',
            margin: 0,
            fontWeight: 400,
            letterSpacing: '-0.2px',
          }}
        >
          <option value="">Chọn loại khuyến mãi</option>
          <option value="Promotion">Giảm tiền</option>
          <option value="Flash Sale">Giảm %</option>
          <option value="Voucher">Freeship</option>
        </select>
        <button
          onClick={() => navigate("/seller-center/promotions/add")}
          style={{
            padding: "0 16px",
            background: "#222",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "0.88rem",
            cursor: "pointer",
            fontWeight: 500,
            fontFamily: 'Roboto, Arial, sans-serif',
            height: 32,
            boxShadow: '0 2px 8px rgba(44,62,80,0.10)',
            border: 'none',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
            letterSpacing: '-0.2px',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#333'}
          onMouseOut={e => e.currentTarget.style.background = '#222'}
        >
          Thêm mới
        </button>
      </div>

  <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0', marginBottom: '24px' }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontFamily: 'Roboto, Arial, sans-serif', background: '#fff', borderRadius: '12px' }}>
          <thead style={{ background: "#f7f7f7" }}>
            <tr>
              <th style={thTitleStyle}>ID</th>
              <th style={thTitleStyle}>Code</th>
              <th style={thTitleStyle}>Tên khuyến mãi</th>
              <th style={thTitleStyle}>Loại</th>
              <th style={thTitleStyle}>Điều kiện</th>
              <th style={thTitleStyle}>Ngày bắt đầu</th>
              <th style={thTitleStyle}>Ngày kết thúc</th>
              <th style={thTitleStyle}>Trạng thái</th>
              <th style={thTitleStyle}>Sử dụng/ còn lại</th>
              <th style={thTitleStyle}>Sản phẩm</th>
              <th style={thTitleStyle}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredPromotions.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: "center", padding: "16px", color: "#7f8c8d" }}>Không có khuyến mãi nào</td>
              </tr>
            ) : (
              filteredPromotions.map((promo) => (
                <tr key={promo.id} style={{ borderBottom: "1px solid #f0f0f0", background: "#fff", fontFamily: 'Roboto, Arial, sans-serif' }}>
                  <td style={{ ...tdContentStyle, textAlign: 'center', color: '#222' }}>{promo.id}</td>
                  <td style={{ ...tdContentStyle, textAlign: 'center', color: '#222' }}>{promo.code}</td>
                  <td style={{ ...tdContentStyle, textAlign: 'left' }}>{promo.name}</td>
                  <td style={{ ...tdContentStyle, textAlign: 'left', color: '#444' }}>
                    {promo.type === 'Promotion' ? 'Giảm tiền' : promo.type === 'Flash Sale' ? 'Giảm %' : promo.type === 'Voucher' ? 'Freeship' : promo.type}
                  </td>
                  <td style={{ ...tdContentStyle, textAlign: 'left', color: '#444' }}>{promo.condition || "-"}</td>
                  <td style={{ ...tdContentStyle, textAlign: 'center', color: '#666' }}>{promo.start ? new Date(promo.start).toLocaleDateString() : "-"}</td>
                  <td style={{ ...tdContentStyle, textAlign: 'center', color: '#666' }}>{promo.end ? new Date(promo.end).toLocaleDateString() : "-"}</td>
                  <td style={{ ...tdContentStyle, textAlign: 'center', padding: "6px 8px" }}>
                    <span style={{
                      padding: "2px 12px",
                      borderRadius: "6px",
                      fontWeight: 500,
                      color: getStatus(promo) === "Bị từ chối" ? "#e74c3c" : getStatus(promo) === "Đang chạy" ? "#27ae60" : getStatus(promo) === "Sắp diễn ra" ? "#f39c12" : "#7f8c8d",
                      background: getStatus(promo) === "Bị từ chối" ? "#fdecea" : getStatus(promo) === "Đang chạy" ? "#eafaf1" : getStatus(promo) === "Sắp diễn ra" ? "#fff6e0" : "#f9f9f9",
                      fontSize: "0.78rem",
                      whiteSpace: 'normal',
                      display: 'inline-block',
                    }}>{getStatus(promo)}</span>
                  </td>
                  <td style={{ ...tdContentStyle, textAlign: 'center', color: '#222' }}>{promo.used} / {promo.total}</td>
                  <td style={{ ...tdContentStyle, textAlign: 'center', color: '#222' }}>{promo.products || 0}</td>
                  <td style={{ ...tdContentStyle, textAlign: 'center', padding: '0' }}>
                    <div style={{ position: "relative", display: "inline-block" }} ref={el => dropdownRefs.current[promo.id] = el}>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setDropdownOpen(dropdownOpen === promo.id ? null : promo.id);
                        }}
                        style={{ background: "#f4f6fb", border: "1px solid #e5e9f2", borderRadius: "50%", fontSize: "1.15rem", cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: '#222', transition: 'background 0.2s', outline: 'none' }}
                        title="Hành động"
                        onMouseOver={e => e.currentTarget.style.background = '#e5e9f2'}
                        onMouseOut={e => e.currentTarget.style.background = '#f4f6fb'}
                        tabIndex={0}
                      >
                        <span style={{ fontSize: "1.25rem" }}>⋮</span>
                      </button>
                      {dropdownOpen === promo.id && (
                        <div style={{
                          position: "absolute",
                          top: "110%",
                          right: 0,
                          background: "#fff",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                          minWidth: "120px",
                          zIndex: 100,
                          borderRadius: "8px",
                          overflow: "hidden",
                          fontSize: "0.93rem",
                          border: "1px solid #e5e9f2"
                        }}
                        onMouseDown={e => e.stopPropagation()}>
                          <div onMouseDown={e => { e.stopPropagation(); handleAction(promo, "edit"); }} style={dropdownItemStyle}>Sửa</div>
                          <div onMouseDown={e => { e.stopPropagation(); handleAction(promo, "delete"); }} style={dropdownItemStyle}>Xóa</div>
                          <div onMouseDown={e => { e.stopPropagation(); handleAction(promo, "view"); }} style={dropdownItemStyle}>Xem chi tiết</div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Styles
const thTitleStyle = {
  padding: "6px 6px",
  fontWeight: 700,
  textAlign: "center",
  fontSize: "0.80rem",
  color: "#222",
  background: "#f7f7f7",
  borderBottom: "1px solid #f0f0f0",
  fontFamily: 'Roboto, Arial, sans-serif',
  whiteSpace: 'normal',
  fontStyle: 'normal',
  letterSpacing: '-0.5px',
};
const tdContentStyle = {
  padding: "6px 6px",
  textAlign: "left",
  fontSize: "0.80rem",
  color: "#444",
  background: "#fff",
  fontFamily: 'Roboto, Arial, sans-serif',
  whiteSpace: 'normal',
  fontWeight: 400,
  fontStyle: 'normal',
  wordBreak: 'break-word',
};
const dropdownItemStyle = {
  padding: "7px 12px", cursor: "pointer", borderBottom: "1px solid #eee", background: "#fff",
  transition: "background 0.2s",
  fontWeight: 400,
  color: '#222',
  fontSize: '0.85rem',
  fontFamily: 'Roboto, Arial, sans-serif',
};
export default PromotionsDropdownTable;
