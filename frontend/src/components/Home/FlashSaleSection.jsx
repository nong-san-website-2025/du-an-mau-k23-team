import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { getFlashSales } from "../../features/admin/services/marketingApi.js";

export default function FlashSaleSection() {
  const [flashSales, setFlashSales] = useState([]);

  useEffect(() => {
    getFlashSales()
      .then((res) => setFlashSales(res.data || []))
      .catch((err) => console.error("Lỗi khi tải flash sale:", err));
  }, []);

  if (flashSales.length === 0) return null;

  return (
    <div className="my-6">
      <h2 className="text-xl font-bold mb-4 text-red-600">⚡ Flash Sale</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {flashSales.map((item) => {
          const endTime = dayjs(item.end_time).format("HH:mm, DD/MM");
          return (
            <div
              key={item.id}
              className="border rounded-xl shadow hover:shadow-lg transition p-2 bg-white cursor-pointer"
              onClick={() => window.open(`/product/${item.product.id}`, "_blank")}
            >
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-full h-40 object-cover rounded-lg"
              />
              <div className="mt-2">
                <h3 className="font-semibold text-sm line-clamp-2">
                  {item.product.name}
                </h3>
                <p className="text-red-600 font-bold mt-1">
                  {item.product.price}₫
                </p>
                <p className="text-xs text-gray-500">
                  Kết thúc: {endTime}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
