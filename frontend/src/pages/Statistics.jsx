import React from "react";

const Statistics = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Thống kê & Báo cáo</h1>

      <div className="bg-white shadow rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Doanh thu theo tháng</h2>
        {/* TODO: Vẽ biểu đồ với Recharts hoặc Chart.js */}
        <div className="h-40 flex items-center justify-center text-gray-500">
          Biểu đồ doanh thu (sẽ thêm sau)
        </div>
      </div>

      <div className="bg-white shadow rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Top sản phẩm bán chạy</h2>
        <ul>
          <li>🥕 Cà rốt</li>
          <li>🍅 Cà chua</li>
          <li>🥬 Rau cải</li>
        </ul>
      </div>

      <div className="bg-white shadow rounded p-4">
        <h2 className="font-semibold mb-2">Top cửa hàng doanh thu cao</h2>
        <ul>
          <li>🏪 Shop Rau Củ</li>
          <li>🏪 Knart Store</li>
        </ul>
      </div>
    </div>
  );
};

export default Statistics;
