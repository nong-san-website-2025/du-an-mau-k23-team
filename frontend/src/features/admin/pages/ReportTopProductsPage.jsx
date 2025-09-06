import React from "react";
import { Card, Table } from "antd";
import { PieChart, Pie, Cell } from "recharts";
import { ShoppingBag, Award, Users } from "lucide-react";

const ReportTopProductsPage = () => {
  // Giả lập dữ liệu sản phẩm bán chạy
  const topProducts = [
    { key: 1, name: "Gạo hữu cơ", sales: 320 },
    { key: 2, name: "Rau sạch Đà Lạt", sales: 280 },
    { key: 3, name: "Trái cây sấy khô", sales: 190 },
  ];

  // Giả lập dữ liệu top nhà cung cấp
  const topSuppliers = [
    { key: 1, name: "Nông trại A", revenue: 8500 },
    { key: 2, name: "HTX B", revenue: 7200 },
    { key: 3, name: "Trang trại C", revenue: 6100 },
  ];

  // Giả lập dữ liệu phân tích khách hàng
  const customerData = [
    { name: "Khách mới", value: 45 },
    { name: "Khách quay lại", value: 55 },
  ];

  const COLORS = ["#00C49F", "#0088FE"];

  return (
    <div className="px-4 space-y-6">
      {/* Sản phẩm bán chạy */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <ShoppingBag className="text-green-600" /> Sản phẩm bán chạy
          </span>
        }
      >
        <Table
          columns={[
            { title: "Sản phẩm", dataIndex: "name", key: "name" },
            { title: "Số lượng bán", dataIndex: "sales", key: "sales" },
          ]}
          dataSource={topProducts}
          pagination={false}
        />
      </Card>

      {/* Top nhà cung cấp */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <Award className="text-yellow-600" /> Top nhà cung cấp
          </span>
        }
      >
        <Table
          columns={[
            { title: "Nhà cung cấp", dataIndex: "name", key: "name" },
            { title: "Doanh thu (VND)", dataIndex: "revenue", key: "revenue" },
          ]}
          dataSource={topSuppliers}
          pagination={false}
        />
      </Card>

      {/* Phân tích khách hàng */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <Users className="text-purple-600" /> Phân tích khách hàng
          </span>
        }
      >
        <PieChart width={400} height={300}>
          <Pie
            data={customerData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {customerData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </Card>
    </div>
  );
};

export default ReportTopProductsPage;
