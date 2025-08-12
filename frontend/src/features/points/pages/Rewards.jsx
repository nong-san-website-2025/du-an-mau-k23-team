import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { getUserPoints } from "../services/pointsService";

export default function Rewards() {
  const [points, setPoints] = useState(0);
  const [pointHistory, setPointHistory] = useState([]); // Đổi tên biến tránh trùng với React Router
  // Ưu tiên lấy token từ 'access', nếu không có thì lấy từ 'token'
  const token = localStorage.getItem("access") || localStorage.getItem("token");

  // Lấy điểm và lịch sử từ API khi load
  useEffect(() => {
    if (token) {
      getUserPoints(token).then((data) => {
        setPoints(data.points || 0);
        setPointHistory(data.history || []); // history là mảng từ backend
      });
    }
  }, [token]);

  return (
    <div className="container mt-4">
      {/* Điểm hiện tại */}
      <div className="card text-center mb-4">
        <div className="card-body">
          <h5 className="card-title">Điểm hiện tại</h5>
          <h2 className="text-success">{points} điểm</h2>
        </div>
      </div>

      {/* Lịch sử tích điểm */}
      <h4>📜 Lịch sử tích điểm</h4>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Hoạt động</th>
            <th>Điểm</th>
          </tr>
        </thead>
        <tbody>
          {pointHistory.length === 0 ? (
            <tr><td colSpan="3">Chưa có lịch sử tích điểm.</td></tr>
          ) : (
            pointHistory.map((item, index) => (
              <tr key={index}>
                <td>{item.date}</td>
                <td>{item.action}</td>
                <td className={item.points > 0 ? "text-success" : "text-danger"}>
                  {item.points > 0 ? `+${item.points}` : item.points}
                </td>
              </tr>
            ))
            
          )}
        </tbody>
      </table>
    </div>
  );
}
