
import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { getUserPoints } from "../services/pointsService";
import { FaGift, FaHistory } from "react-icons/fa";

export default function Rewards() {
  const [points, setPoints] = useState(0);
  const [pointHistory, setPointHistory] = useState([]);
  const token = localStorage.getItem("access") || localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      getUserPoints(token).then((data) => {
        setPoints(data.points || 0);
        setPointHistory(data.history || []);
      });
    }
  }, [token]);

  return (
    <div className="container py-6">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow mb-4 border-0 rounded-4">
            <div className="card-body text-center">
              <FaGift size={40} className="mb-2 text-warning" />
              <h5 className="card-title mb-2">Điểm thưởng của bạn</h5>
              <h1 className="display-4 fw-bold text-success">{points} <span className="fs-4">điểm</span></h1>
            </div>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow border-0 rounded-4">
            <div className="card-header bg-white border-0 d-flex align-items-center">
              <FaHistory className="me-2 text-primary" />
              <h5 className="mb-0">Lịch sử tích điểm</h5>
            </div>
            <div className="card-body p-0">
              {pointHistory.length === 0 ? (
                <div className="text-center py-4 text-muted">Chưa có lịch sử tích điểm.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Ngày</th>
                        <th>Hành động</th>
                        <th>Điểm</th>
                        <th>Số tiền</th>
                        <th>Mã đơn hàng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pointHistory.map((item, idx) => (
                        <tr key={idx}>
                          <td>{new Date(item.date).toLocaleString("vi-VN")}</td>
                          <td>{item.action}</td>
                          <td className={item.points > 0 ? "text-success fw-bold" : "text-danger fw-bold"}>
                            {item.points > 0 ? "+" : ""}{item.points}
                          </td>
                          <td>{item.amount?.toLocaleString("vi-VN")} đ</td>
                          <td>{item.order_id || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
