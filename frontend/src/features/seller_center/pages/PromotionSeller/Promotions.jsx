import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PromotionsDropdownTable = () => {
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
    case "edit":   // đổi từ "approve" -> "edit"
      navigate(`/seller-center/promotions/edit/${promo.id}`);
      break;
    case "delete": // đổi từ "reject" -> "delete"
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
    case "lock":
      if (!window.confirm(`Bạn có chắc muốn khóa "${promo.name}"?`)) return;
      try {
        await axios.post(`http://127.0.0.1:8000/api/promotions/promotions/${promo.id}/lock/`);
        setPromotions(prev => prev.map(p => p.id === promo.id ? {...p, is_locked: true} : p));
        alert("Khóa thành công!");
      } catch(err) {
        console.error(err);
        alert("Khóa thất bại!");
      }
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
    if (now >= start && now <= end) return "Đang diễn ra";
    return "Đã kết thúc";
  };

  // Lọc promotions theo filter
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
  <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px", background: "#fff", boxShadow: "0 4px 24px rgba(44,62,80,0.08)" }}>
      <h1 style={{ fontSize: "2.2rem", fontWeight: 700, marginBottom: "28px", color: "#2c3e50", textAlign: "left" }}>Quản lý khuyến mãi</h1>
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên khuyến mãi"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e9f2", flex: 1, fontSize: "1rem" }}
        />
        <select onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter} style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e9f2", fontSize: "1rem" }}>
          <option value="">Lọc theo trạng thái</option>
          <option value="Sắp diễn ra">Sắp diễn ra</option>
          <option value="Đang diễn ra">Đang diễn ra</option>
          <option value="Đã kết thúc">Đã kết thúc</option>
        </select>
        <select onChange={(e) => setTypeFilter(e.target.value)} value={typeFilter} style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e9f2", fontSize: "1rem" }}>
          <option value="">Chọn loại khuyến mãi</option>
          <option value="Promotion">Promotion</option>
          <option value="Flash Sale">Flash Sale</option>
          <option value="Voucher">Voucher</option>
        </select>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(44,62,80,0.07)", overflow: "hidden" }}>
        <thead style={{ background: "#f9f9f9" }}>
          <tr>
            <th style={{ padding: "12px 12px", fontWeight: 700, color: "#222", borderBottom: "2px solid #e5e9f2", textAlign: "left", fontSize: "1rem", fontFamily: 'Segoe UI', textTransform: "none", letterSpacing: "0.01em", whiteSpace: "nowrap", width: "18%" }}>Tên chương trình</th>
            <th style={{ padding: "12px 12px", fontWeight: 700, color: "#222", borderBottom: "2px solid #e5e9f2", textAlign: "center", fontSize: "1rem", fontFamily: 'Segoe UI', textTransform: "none", letterSpacing: "0.01em", whiteSpace: "nowrap", width: "13%" }}>Loại</th>
            <th style={{ padding: "12px 12px", fontWeight: 700, color: "#222", borderBottom: "2px solid #e5e9f2", textAlign: "center", fontSize: "1rem", fontFamily: 'Segoe UI', textTransform: "none", letterSpacing: "0.01em", whiteSpace: "nowrap", width: "20%" }}>Thời gian hiệu lực</th>
            <th style={{ padding: "12px 12px", fontWeight: 700, color: "#222", borderBottom: "2px solid #e5e9f2", textAlign: "center", fontSize: "1rem", fontFamily: 'Segoe UI', textTransform: "none", letterSpacing: "0.01em", whiteSpace: "nowrap", width: "12%" }}>Trạng thái</th>
            <th style={{ padding: "12px 12px", fontWeight: 700, color: "#222", borderBottom: "2px solid #e5e9f2", textAlign: "center", fontSize: "1rem", fontFamily: 'Segoe UI', textTransform: "none", letterSpacing: "0.01em", whiteSpace: "nowrap", width: "13%" }}>Sản phẩm áp dụng</th>
            <th style={{ padding: "12px 12px", fontWeight: 700, color: "#222", borderBottom: "2px solid #e5e9f2", textAlign: "center", fontSize: "1rem", fontFamily: 'Segoe UI', textTransform: "none", letterSpacing: "0.01em", whiteSpace: "nowrap", width: "12%" }}>Đã dùng/Tổng</th>
            <th style={{ padding: "12px 12px", fontWeight: 700, color: "#222", borderBottom: "2px solid #e5e9f2", textAlign: "center", fontSize: "1rem", fontFamily: 'Segoe UI', textTransform: "none", letterSpacing: "0.01em", whiteSpace: "nowrap", width: "12%" }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredPromotions.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "18px", color: "#7f8c8d", fontSize: "1.1rem" }}>Không có khuyến mãi nào</td>
            </tr>
          ) : (
            filteredPromotions.map((promo) => (
              <tr key={promo.id} style={{ borderBottom: "1px solid #e5e9f2", background: "#fff" }}>
                <td style={{ padding: "8px 12px", fontSize: "0.97rem", color: "#2c3e50", fontFamily: 'Segoe UI', whiteSpace: "nowrap", textAlign: "left", width: "18%" }}>{promo.name}</td>
                <td style={{ padding: "8px 12px", fontSize: "0.97rem", color: "#2c3e50", fontFamily: 'Segoe UI', whiteSpace: "nowrap", textAlign: "center", width: "13%" }}>{promo.type} {promo.discount_display}</td>
                <td style={{ padding: "8px 12px", fontSize: "0.97rem", color: "#2c3e50", fontFamily: 'Segoe UI', whiteSpace: "nowrap", textAlign: "center", width: "20%" }}>{promo.start && promo.end ? `${new Date(promo.start).toLocaleString()} - ${new Date(promo.end).toLocaleString()}` : "N/A"}</td>
                <td style={{ padding: "8px 12px", fontSize: "0.97rem", fontFamily: 'Segoe UI', whiteSpace: "nowrap", textAlign: "center", width: "12%" }}>{getStatus(promo)}</td>
                <td style={{ padding: "8px 12px", fontSize: "0.97rem", fontFamily: 'Segoe UI', whiteSpace: "nowrap", textAlign: "center", width: "13%" }}>{promo.products} sản phẩm</td>
                <td style={{ padding: "8px 12px", fontSize: "0.97rem", fontFamily: 'Segoe UI', whiteSpace: "nowrap", textAlign: "center", width: "12%" }}>{promo.used} / {promo.total}</td>
                <td style={{ position: "relative", padding: "8px 12px", fontFamily: 'Segoe UI', whiteSpace: "nowrap", textAlign: "center", width: "12%" }}>
                  <div className="dropdown-container">
                    <button onClick={(e) => {
                      const dropdown = e.currentTarget.nextSibling;
                      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
                    }} style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer" }}>⋮</button>
                    <div className="dropdown-menu" style={{ display: "none", position: "absolute", top: "110%", right: 0, background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", minWidth: "210px", zIndex: 100, borderRadius: "12px", overflow: "visible", fontSize: "1.05rem", padding: "8px 0" }}>
                      <div onClick={() => handleAction(promo, "edit")} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 18px", cursor: "pointer", borderBottom: "1px solid #eee", whiteSpace: "nowrap", color: "#222", fontWeight: 400, textAlign: "left" }}>
                        <span style={{ fontSize: "1.1rem" }}></span> Chỉnh sửa
                      </div>
                      <div onClick={() => handleAction(promo, "delete")} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 18px", cursor: "pointer", borderBottom: "1px solid #eee", whiteSpace: "nowrap", color: "#222", fontWeight: 400, textAlign: "left" }}>
                        <span style={{ fontSize: "1.1rem" }}></span> Xóa
                      </div>
                      <div onClick={() => handleAction(promo, "view")} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 18px", cursor: "pointer", borderBottom: "1px solid #eee", whiteSpace: "nowrap", color: "#222", fontWeight: 400, textAlign: "left" }}>
                        <span style={{ fontSize: "1.1rem" }}></span> Xem chi tiết
                      </div>
                      <div onClick={() => handleAction(promo, "lock")} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 18px", cursor: "pointer", whiteSpace: "nowrap", color: "#222", fontWeight: 400, textAlign: "left" }}>
                        <span style={{ fontSize: "1.1rem" }}></span> Khoá 
                      </div>
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
};

export default PromotionsDropdownTable;
