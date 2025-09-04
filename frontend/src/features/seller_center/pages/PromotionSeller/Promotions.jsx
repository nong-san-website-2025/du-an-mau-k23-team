import React, { useState, useEffect } from "react";
import axios from "axios";

const PromotionsStatusTable = () => {
  const [allPromotions, setAllPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromo, setSelectedPromo] = useState(null); // Promotion được chọn
  const [status, setStatus] = useState(""); // "Đang chạy" / "Sắp chạy"

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [promoRes, flashRes, voucherRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/promotions/promotions/"),
          axios.get("http://127.0.0.1:8000/api/promotions/flash-sales/"),
          axios.get("http://127.0.0.1:8000/api/promotions/store-vouchers/"),
        ]);

        const vouchersData = Array.isArray(voucherRes.data)
          ? voucherRes.data
          : voucherRes.data.store_vouchers || [];

        const promos = promoRes.data.map((p) => ({ ...p, promotionType: "Promotion" }));
        const flashes = flashRes.data.map((f) => ({ ...f, promotionType: "Flash Sale" }));
        const vouchers = vouchersData.map((v) => ({ ...v, promotionType: "Store Voucher" }));

        const combined = [...promos, ...flashes, ...vouchers];

        // Sắp xếp theo ngày bắt đầu
        combined.sort((a, b) => {
          const startA = new Date(a.start_date || a.start_at);
          const startB = new Date(b.start_date || b.start_at);
          return startA - startB;
        });

        setAllPromotions(combined);
      } catch (error) {
        console.error("Error fetching promotions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) return <p>Đang tải dữ liệu...</p>;

  const handleStatusClick = (item) => {
    const now = new Date();
    const start = new Date(item.start_date || item.start_at);
    const end = new Date(item.end_date || item.end_at);

    if (now >= start && now <= end) {
      setSelectedPromo(item);
      setStatus("Đang chạy");
    } else if (now < start) {
      setSelectedPromo(item);
      setStatus("Sắp chạy");
    } else {
      alert("Khuyến mãi đã kết thúc");
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "16px" }}>
      <h1
        style={{
          textAlign: "center",
          fontSize: "2rem",
          marginBottom: "24px",
          color: "#2c3e50",
          fontWeight: 600,
          textTransform: "uppercase",
          fontFamily: 'Roboto, Arial, Helvetica, sans-serif',
        }}
      >
        QUẢN LÝ KHUYẾN MÃI
      </h1>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f1f1f1" }}>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Loại</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Mã/Store</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Giảm giá</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Thời gian</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Active</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {allPromotions.length > 0 ? (
            allPromotions.map((item) => (
              <tr key={`${item.promotionType}-${item.id}`}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{item.promotionType}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{item.code || item.store_name}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {item.discount || item.discount_amount ? (item.discount || item.discount_amount) + "%" : "N/A%"}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {item.start_date || item.start_at
                    ? `${new Date(item.start_date || item.start_at).toLocaleDateString()} → ${new Date(
                        item.end_date || item.end_at
                      ).toLocaleDateString()}`
                    : "Chưa xác định"}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {item.active !== undefined ? (item.active ? "Hoạt động" : "Không hoạt động") : "-"}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  <span
                    onClick={() => handleStatusClick(item)}
                    style={{
                      color: '#1890ff',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontWeight: 500,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      transition: 'background 0.2s',
                      display: 'inline-block',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#e6f7ff'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Xem trạng thái
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "10px" }}>
                Không có khuyến mãi nào
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal hiển thị chi tiết */}
      {selectedPromo && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedPromo(null)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{selectedPromo.code || selectedPromo.store_name}</h2>
            <p><strong>Trạng thái:</strong> {status}</p>
            <p><strong>Loại:</strong> {selectedPromo.promotionType}</p>
            <p>
              <strong>Giảm giá:</strong>{" "}
              {selectedPromo.discount || selectedPromo.discount_amount
                ? (selectedPromo.discount || selectedPromo.discount_amount) + "%"
                : "N/A%"}
            </p>
            <p>
              <strong>Thời gian:</strong>{" "}
              {selectedPromo.start_date || selectedPromo.start_at
                ? `${new Date(selectedPromo.start_date || selectedPromo.start_at).toLocaleString()} → ${new Date(
                    selectedPromo.end_date || selectedPromo.end_at
                  ).toLocaleString()}`
                : "Chưa xác định"}
            </p>
            {selectedPromo.active !== undefined && (
              <p><strong>Active:</strong> {selectedPromo.active ? "Hoạt động" : "Không hoạt động"}</p>
            )}
            <button onClick={() => setSelectedPromo(null)} style={{ marginTop: "10px", padding: "6px 12px" }}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionsStatusTable;
