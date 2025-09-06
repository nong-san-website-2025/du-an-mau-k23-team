import React, { useEffect, useState } from "react";
import axios from "axios";

const StoreVouchers = () => {
  const [vouchers, setVouchers] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/store-vouchers/") // sửa URL backend
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setVouchers(data);
      })
      .catch((err) => {
        console.error("API error:", err);
        setVouchers([]);
      });
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Voucher của cửa hàng</h2>

      {vouchers.length === 0 ? (
        <p className="text-gray-500">Hiện chưa có voucher nào.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchers.map((v) => (
            <div
              key={v.id}
              className="border rounded-lg p-4 shadow hover:shadow-lg transition duration-200"
            >
              <h3 className="font-semibold text-lg mb-2">{v.name || v.code}</h3>
              <p>Giảm giá: {v.discount || "N/A"}%</p>
              <p>Điều kiện: {v.condition || "Không có"}</p>
              <p>Thời gian: {v.start_date} → {v.end_date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoreVouchers;
