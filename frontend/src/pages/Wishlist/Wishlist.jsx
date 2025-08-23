import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import a1 from "../../assets/image/a1.jpg";
import a2 from "../../assets/image/a2.jpg";
import a3 from "../../assets/image/a3.jpg";
import TopBanner from "./components/TopBanner";


// Lấy danh sách sản phẩm từ HomePage (giả lập, nên đồng bộ id, name, image, ...)
const suggestedProducts = [
  {
    id: 1,
    name: "Rau Củ Hữu Cơ Premium",
    image: a1,
    price: 35000,
    badge: "Hữu cơ",
    category: "rau-cu"
  },
  {
    id: 2,
    name: "Trái Cây Nhiệt Đới",
    image: a2,
    price: 45000,
    badge: "Tươi ngon",
    category: "trai-cay"
  },
  {
    id: 3,
    name: "Gạo Hữu Cơ Cao Cấp",
    image: a3,
    price: 80000,
    badge: "Gạo ngon",
    category: "gao"
  },
];


const Wishlist = () => {
  // Lấy danh sách wishlist từ localStorage
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wishlist')) || [];
    } catch {
      return [];
    }
  });
  const [filter, setFilter] = useState({ status: "", category: "" });
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Xóa sản phẩm khỏi wishlist
  const handleRemove = (id) => {
    const newList = wishlist.filter(item => item.id !== id);
    setWishlist(newList);
    localStorage.setItem('wishlist', JSON.stringify(newList));
  };

  return (
    <div className="wishlist-page" style={{ background: "#f7f7f7", minHeight: "100vh" }}>
      {/* TopBanner ưu đãi sale */}
      <TopBanner />
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 16px 0 16px", background: "#fff", borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 20, textAlign: "center" }}>Lượt Thích</div>
      </div>

      {/* Filter bar + Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#fff", borderBottom: "1px solid #eee", flexWrap: "wrap" }}>
        <button style={{ background: filter.status === "" && filter.category === "" ? "#1976d2" : "#f1f1f1", color: filter.status === "" && filter.category === "" ? "#fff" : "#333", border: "none", borderRadius: 5, padding: "6px 16px", fontWeight: 500, cursor: "pointer" }} onClick={() => setFilter({ status: "", category: "" })}>Tất Cả</button>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={{ padding: "6px 10px", borderRadius: 5, border: "1px solid #ccc" }}>
          <option value="">Trạng thái</option>
          <option value="conhang">Còn hàng</option>
          <option value="hethang">Hết hàng</option>
        </select>
        <button style={{ background: "#f1f1f1", color: "#333", border: "none", borderRadius: 5, padding: "6px 16px", fontWeight: 500, cursor: "pointer" }}>Giảm giá</button>
        <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))} style={{ padding: "6px 10px", borderRadius: 5, border: "1px solid #ccc" }}>
          <option value="">Ngành hàng</option>
          <option value="thoitrang">Thời trang</option>
          <option value="giaydep">Giày dép</option>
          <option value="phukien">Phụ kiện</option>
        </select>
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm yêu thích..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, padding: "6px 12px", borderRadius: 5, border: "1px solid #ccc", fontSize: 15 }}
        />
      </div>


      {/* Nếu wishlist rỗng */}
      {filteredWishlist().length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 16px 16px 16px" }}>
          <img src="/empty-cart.png" alt="empty" style={{ width: 120, opacity: 0.7, marginBottom: 16 }} />
          <div style={{ color: "#888", fontSize: 18, marginBottom: 12 }}>Không tìm thấy sản phẩm yêu thích phù hợp</div>
          <button style={{ background: "#1976d2", color: "#fff", border: "none", borderRadius: 6, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }} onClick={() => window.location.href = "/"}>Mua sắm ngay!</button>
        </div>
      ) : (
        <div style={{ padding: "16px" }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>Sản phẩm bạn yêu thích</div>
          <div className="wishlist-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {filteredWishlist().map(item => (
              <div
                key={item.id}
                style={{ background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px #eee", padding: 12, position: "relative", display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                onClick={e => {
                  // Không chuyển trang khi bấm nút Xóa
                  if (e.target.tagName === 'BUTTON') return;
                  navigate(`/products/${item.id}`);
                }}
              >
                <img src={item.image || '/logo192.png'} alt={item.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ color: "#e53935", fontWeight: 700, fontSize: 16 }}>{item.price?.toLocaleString()} đ</div>
                  <div style={{ color: item.inStock ? '#388e3c' : '#bdbdbd', fontSize: 13 }}>{item.inStock ? 'Còn hàng' : 'Hết hàng'}</div>
                </div>
                <button onClick={() => handleRemove(item.id)} style={{ background: '#fff', color: '#e53935', border: '1px solid #e53935', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>Xóa</button>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Gợi ý sản phẩm */}
      <div style={{ padding: "16px" }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>Gợi ý cho bạn</div>
        <div className="suggested-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {suggestedProducts.map(product => (
            <div
              key={product.id}
              style={{ background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px #eee", padding: 12, position: "relative", cursor: 'pointer' }}
              onClick={() => navigate(`/category/${product.category}`)}
            >
              <img src={product.image} alt={product.name} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />
              {product.badge && <span style={{ position: "absolute", top: 10, left: 10, background: "#ff5252", color: "#fff", borderRadius: 4, fontSize: 12, padding: "2px 8px", fontWeight: 600 }}>{product.badge}</span>}
              <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>{product.name}</div>
              <div style={{ color: "#e53935", fontWeight: 700, fontSize: 16 }}>{product.price?.toLocaleString()} đ</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .suggested-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
  // Lọc wishlist theo search và filter
  function filteredWishlist() {
    return wishlist.filter(item => {
      const matchName = item.name?.toLowerCase().includes(search.toLowerCase());
      // Có thể mở rộng thêm filter trạng thái, category nếu cần
      return matchName;
    });
  }
};

export default Wishlist;
