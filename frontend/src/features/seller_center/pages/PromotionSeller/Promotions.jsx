import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function PromotionsDropdownTable() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

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
  }, []);

  const handleAction = async (promo, action) => {
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

  const filteredPromotions = promotions.filter(promo => {
    const status = getStatus(promo);
    return (
      (!search || promo.name.toLowerCase().includes(search.toLowerCase())) &&
      (!typeFilter || promo.type === typeFilter) &&
      (!statusFilter || status === statusFilter)
    );
  });

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div style={{ maxWidth: "1200px", margin: "32px auto", padding: "0 16px", background: "#fff", boxShadow: "0 4px 24px rgba(44,62,80,0.08)", borderRadius: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#2c3e50" }}>Quản lý Khuyến mãi / Voucher</h1>
        <button onClick={() => navigate("/seller-center/promotions/add")}
          style={{ padding: "10px 20px", background: "#2c3e50", color: "#fff", borderRadius: "8px", fontSize: "1rem", cursor: "pointer" }}>
          Thêm mới
        </button>
      </div>

      <div style={{ display: "flex", gap: "16px", margin: "0 24px 24px 24px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc mã"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e9f2", flex: 1, fontSize: "1rem" }}
        />
        <select onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter} style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e9f2", fontSize: "1rem" }}>
          <option value="">Lọc theo trạng thái</option>
          <option value="Sắp diễn ra">Sắp diễn ra</option>
          <option value="Đang chạy">Đang chạy</option>
          <option value="Hết hạn">Hết hạn</option>
        </select>
        <select onChange={(e) => setTypeFilter(e.target.value)} value={typeFilter} style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e9f2", fontSize: "1rem" }}>
          <option value="">Chọn loại</option>
          <option value="Promotion">Giảm tiền</option>
          <option value="Flash Sale">Giảm %</option>
          <option value="Voucher">Freeship</option>
        </select>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "32px" }}>
        <thead style={{ background: "#f9f9f9" }}>
          <tr>
            <th style={thStyle}>Code</th>
            <th style={thStyle}>Tên / Mô tả</th>
            <th style={thStyle}>Loại</th>
            <th style={thStyle}>Điều kiện</th>
            <th style={thStyle}>Ngày bắt đầu</th>
            <th style={thStyle}>Ngày kết thúc</th>
            <th style={thStyle}>Trạng thái</th>
            <th style={thStyle}>Sử dụng/ còn lại</th>
            <th style={thStyle}>Sản phẩm</th>
            <th style={thStyle}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredPromotions.length === 0 ? (
            <tr>
              <td colSpan="10" style={{ textAlign: "center", padding: "16px", color: "#7f8c8d" }}>Không có khuyến mãi nào</td>
            </tr>
          ) : (
            filteredPromotions.map((promo) => (
              <tr key={promo.id} style={{ borderBottom: "1px solid #e5e9f2" }}>
                <td style={tdStyle}>{promo.code}</td>
                <td style={tdStyle}>{promo.name}</td>
                <td style={tdStyle}>{promo.type}</td>
                <td style={tdStyle}>{promo.condition || "-"}</td>
                <td style={tdStyle}>{promo.start ? new Date(promo.start).toLocaleDateString() : "-"}</td>
                <td style={tdStyle}>{promo.end ? new Date(promo.end).toLocaleDateString() : "-"}</td>
                <td style={tdStyle}>{getStatus(promo)}</td>
                <td style={tdStyle}>{promo.used} / {promo.total}</td>
                <td style={tdStyle}>{promo.products || 0}</td>
                <td style={tdStyle}>
                  <div style={{ position: "relative" }}>
                    <button onClick={(e) => {
                      const menu = e.currentTarget.nextSibling;
                      menu.style.display = menu.style.display === "block" ? "none" : "block";
                    }} style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer" }}>⋮</button>
                    <div style={{
                      display: "none",
                      position: "absolute",
                      top: "120%",
                      right: 0,
                      background: "#fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      minWidth: "150px",
                      zIndex: 100,
                      borderRadius: "8px",
                      overflow: "hidden",
                      fontSize: "0.95rem"
                    }}>
                      <div onClick={() => { handleAction(promo, "edit"); }} style={dropdownItemStyle}>Sửa</div>
                      <div onClick={() => { handleAction(promo, "delete"); }} style={dropdownItemStyle}>Xóa</div>
                      <div onClick={() => { handleAction(promo, "view"); }} style={dropdownItemStyle}>Xem chi tiết</div>
                    </div>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Styles
const thStyle = {
  padding: "12px", fontWeight: 600, textAlign: "center", fontSize: "0.95rem", color: "#222"
};
const tdStyle = {
  padding: "10px", textAlign: "center", fontSize: "0.9rem", color: "#2c3e50"
};
const dropdownItemStyle = {
  padding: "10px 16px", cursor: "pointer", borderBottom: "1px solid #eee", background: "#fff",
  transition: "background 0.2s",
};
export default PromotionsDropdownTable;
