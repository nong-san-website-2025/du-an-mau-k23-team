import React, { useEffect, useState } from "react";
import axios from "axios";

const FlashSale = () => {
  const [flashSales, setFlashSales] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/flashsales/") // sửa URL backend
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setFlashSales(data);
      })
      .catch((err) => {
        console.error("API error:", err);
        setFlashSales([]);
      });
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Flash Sale đang chạy</h2>

      {flashSales.length === 0 ? (
        <p className="text-gray-500">Hiện chưa có Flash Sale nào.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flashSales.map((sale) => (
            <div
              key={sale.id}
              className="border rounded-lg p-4 shadow hover:shadow-lg transition duration-200"
            >
              <h3 className="font-semibold text-lg mb-2">{sale.name}</h3>
              <p>Sản phẩm: {sale.product_name || "Chưa xác định"}</p>
              <p>Giảm giá: {sale.discount || "N/A"}%</p>
              <p>Thời gian: {sale.start_date} → {sale.end_date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashSale;
