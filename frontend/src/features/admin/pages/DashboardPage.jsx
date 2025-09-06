import React, { useEffect, useState } from "react";
import axios from "axios";
import RevenueChart from "../components/RevenueChart";
import OrderPieChart from "../components/OrderPieChart";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://127.0.0.1:8000/api/dashboard/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Dashboard API response:", response.data);
        setData(response.data);
        setLoading(false);
      } catch (err) {
        if (err.response) {
          console.error(
            "Server error:",
            err.response.status,
            err.response.data
          );
        } else {
          console.error("Network/Client error:", err.message);
        }
        setError(err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading data. Please try again.</div>;
  }

  return (
    <div className="bg-light" style={{ minHeight: "100vh" }}>
      <div style={{ marginLeft: 0 }}>
        <div className="container-fluid py-4">
          <h2 className="fw-bold mb-4">Dashboard</h2>
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="fs-3 fw-bold">{data.total_users}</div>
                  <div className="text-muted">Tổng số người dùng</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="fs-3 fw-bold">{data.total_products}</div>
                  <div className="text-muted">Tổng số sản phẩm</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="fs-3 fw-bold">{data.total_orders}</div>
                  <div className="text-muted">Tổng số đơn hàng</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="fs-3 fw-bold">${data.total_revenue}</div>
                  <div className="text-muted">Doanh thu</div>
                </div>
              </div>
            </div>
          </div>
          <h4 className="fw-bold mb-3">Sản phẩm bán chạy</h4>
          <div className="card shadow-sm">
            <div className="card-body p-0">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Tên sản phẩm</th>
                    <th>Số lượng bán</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_products && data.top_products.length > 0 ? (
                    data.top_products.map((product, index) => (
                      <tr key={index}>
                        <td>{product.name}</td>
                        <td>{product.sales}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="text-center text-muted">
                        Không có dữ liệu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
