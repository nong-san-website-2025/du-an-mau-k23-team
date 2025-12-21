import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { getUserPoints } from "../services/pointsService";
import { FaLeaf, FaHistory, FaCrown, FaArrowUp, FaArrowDown, FaShoppingBag } from "react-icons/fa";

// --- Components nhỏ để code sạch hơn ---

// 1. Thẻ thành viên (Loyalty Card)
const LoyaltyCard = ({ points, rank }) => {
  // Logic màu sắc theo hạng
  const getCardStyle = (rank) => {  
    switch (rank) {
      case "Gold": return { background: "linear-gradient(135deg, #FFD700 0%, #FDB931 100%)", color: "#fff" };
      case "Silver": return { background: "linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%)", color: "#333" };
      default: return { background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)", color: "#fff" }; // Green (Default)
    }
  };

  const style = getCardStyle(rank);

  return (
    <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ minHeight: "220px", ...style }}>
      <div className="card-body p-4 d-flex flex-column justify-content-between position-relative">
        {/* Background Pattern Overlay (Optional) */}
        <div style={{ position: "absolute", top: "-20px", right: "-20px", opacity: 0.2 }}>
          <FaLeaf size={150} />
        </div>

        <div className="d-flex justify-content-between align-items-start z-1">
          <div>
            <h5 className="mb-1 text-uppercase fw-bold opacity-75">GreenPoint</h5>
            <small className="opacity-75">Chương trình khách hàng thân thiết</small>
          </div>
          <div className="d-flex align-items-center gap-2 bg-white bg-opacity-25 px-3 py-1 rounded-pill backdrop-blur">
            <FaCrown size={14} />
            <span className="fw-bold small">{rank} Member</span>
          </div>
        </div>

        <div className="z-1 mt-4">
          <small className="opacity-75 text-uppercase">Số dư hiện tại</small>
          <div className="d-flex align-items-baseline">
            <h1 className="display-4 fw-bold mb-0 me-2">{points.toLocaleString()}</h1>
            <span className="fs-5">điểm</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Item lịch sử giao dịch (Transaction Item)
const HistoryItem = ({ item }) => {
  const isPositive = item.points > 0;
  const date = new Date(item.date);

  return (
    <div className="d-flex align-items-center p-3 border-bottom hover-bg-light transition-all">
      {/* Icon */}
      <div 
        className={`d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 me-3 ${isPositive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
        style={{ width: "48px", height: "48px" }}
      >
        {isPositive ? <FaArrowUp size={18} /> : <FaArrowDown size={18} />}
      </div>

      {/* Content */}
      <div className="flex-grow-1">
        <h6 className="mb-0 fw-semibold text-dark">
          {item.action || "Giao dịch hệ thống"}
        </h6>
        <div className="d-flex align-items-center gap-2 mt-1">
          <small className="text-muted">
            {date.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })} • {date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
          </small>
          {item.order_id && (
            <span className="badge bg-light text-secondary border">
              #{item.order_id}
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-end">
        <div className={`fw-bold fs-5 ${isPositive ? 'text-success' : 'text-danger'}`}>
          {isPositive ? "+" : ""}{item.points}
        </div>
        {item.amount && (
            <small className="text-muted d-block">
                {item.amount.toLocaleString("vi-VN")} đ
            </small>
        )}
      </div>
    </div>
  );
};

// 3. Skeleton Loading (Hiệu ứng chờ)
const SkeletonLoader = () => (
    <div className="animate-pulse">
        <div className="bg-secondary bg-opacity-10 rounded-4 mb-4" style={{ height: "220px" }}></div>
        <div className="card border-0 shadow-sm rounded-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 border-bottom d-flex align-items-center">
                    <div className="rounded-circle bg-secondary bg-opacity-10" style={{width: 48, height: 48}}></div>
                    <div className="ms-3 flex-grow-1">
                        <div className="bg-secondary bg-opacity-10 rounded w-50 h-50 mb-2" style={{height: 16}}></div>
                        <div className="bg-secondary bg-opacity-10 rounded w-25" style={{height: 12}}></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- Component Chính ---

export default function GreenPointPage() {
  const [points, setPoints] = useState(0);
  const [pointHistory, setPointHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("access") || localStorage.getItem("token");

  // Logic giả lập hạng thành viên
  const getRank = (pts) => {
      if (pts > 5000) return "Gold";
      if (pts > 1000) return "Silver";
      return "Member";
  };

  useEffect(() => {
    if (token) {
      setLoading(true);
      getUserPoints(token)
        .then((data) => {
          setPoints(data.points || 0);
          setPointHistory(data.history || []);
        })
        .catch(err => console.error("Lỗi lấy điểm:", err))
        .finally(() => {
            // Giả lập delay một chút để thấy hiệu ứng skeleton mượt mà
            setTimeout(() => setLoading(false), 500); 
        });
    } else {
        setLoading(false);
    }
  }, [token]);

  return (
    <div className="container py-5" style={{ maxWidth: "800px" }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
          <h3 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <FaLeaf className="text-success" /> GreenPoint
          </h3>
          <button className="btn btn-outline-success rounded-pill btn-sm fw-semibold">
             Quy chế đổi thưởng
          </button>
      </div>

      {loading ? <SkeletonLoader /> : (
        <>
          {/* Section 1: Loyalty Card */}
          <div className="mb-5">
            <LoyaltyCard points={points} rank={getRank(points)} />
            
            {/* Mini Stats (Optional) */}
            <div className="row g-3 mt-1">
                <div className="col-6">
                    <div className="p-3 bg-white shadow-sm rounded-4 border-0 d-flex align-items-center gap-3">
                         <div className="bg-success bg-opacity-10 p-2 rounded-circle text-success">
                            <FaArrowUp />
                         </div>
                         <div>
                             <small className="text-muted d-block">Tổng tích lũy</small>
                             <span className="fw-bold">{pointHistory.filter(x=>x.points>0).reduce((a,b)=>a+b.points, 0).toLocaleString()}</span>
                         </div>
                    </div>
                </div>
                <div className="col-6">
                    <div className="p-3 bg-white shadow-sm rounded-4 border-0 d-flex align-items-center gap-3">
                         <div className="bg-warning bg-opacity-10 p-2 rounded-circle text-warning">
                            <FaShoppingBag />
                         </div>
                         <div>
                             <small className="text-muted d-block">Đã sử dụng</small>
                             <span className="fw-bold">{Math.abs(pointHistory.filter(x=>x.points<0).reduce((a,b)=>a+b.points, 0)).toLocaleString()}</span>
                         </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Section 2: History Timeline */}
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-white p-3 border-bottom d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <FaHistory className="text-primary" />
                <h5 className="mb-0 fw-bold">Lịch sử hoạt động</h5>
              </div>
              <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3">
                  {pointHistory.length} giao dịch
              </span>
            </div>

            <div className="card-body p-0">
              {pointHistory.length === 0 ? (
                <div className="text-center py-5">
                   <div className="mb-3 text-muted opacity-50">
                       <FaHistory size={40} />
                   </div>
                   <h6 className="text-muted">Chưa có lịch sử tích điểm</h6>
                   <p className="small text-muted mb-0">Hãy mua sắm để nhận điểm thưởng ngay!</p>
                </div>
              ) : (
                <div className="history-list">
                  {pointHistory.map((item, idx) => (
                    <HistoryItem key={idx} item={item} />
                  ))}
                </div>
              )}
            </div>
            
            {pointHistory.length > 5 && (
                <div className="card-footer bg-white text-center p-3 border-0">
                    <button className="btn btn-link text-decoration-none fw-semibold text-success">
                        Xem tất cả
                    </button>
                </div>
            )}
          </div>
        </>
      )}

      {/* CSS Inline nhỏ để handle hiệu ứng hover/backdrop */}
      <style>{`
        .backdrop-blur {
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
        }
        .hover-bg-light:hover {
            background-color: #f8f9fa;
        }
        .transition-all {
            transition: all 0.2s ease;
        }
        .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}