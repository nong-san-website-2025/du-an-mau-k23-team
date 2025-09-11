import React, { useEffect, useState } from "react";
import { Card, Table, message, DatePicker, Select, Space } from "antd";
import { PieChart, Pie, Cell } from "recharts";
import { ShoppingBag, Award, Users } from "lucide-react";
import api from "../../login_register/services/api";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

const ReportTopProductsPage = () => {
  const [loading, setLoading] = useState(false);
  const [topProducts, setTopProducts] = useState([]);
  const [topSuppliers, setTopSuppliers] = useState([]);
  const [customerData, setCustomerData] = useState([]);

  // Filters
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, "day"), dayjs()]);
  const [statusFilter, setStatusFilter] = useState("success"); // pending | shipping | success | cancelled | all

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const isAdmin = localStorage.getItem("is_admin") === "true";
        const endpoint = isAdmin ? "/orders/admin-list/" : "/orders/";
        const res = await api.get(endpoint);
        let orders = Array.isArray(res.data) ? res.data : [];

        // Apply client-side filters: date range + status
        orders = orders.filter((o) => {
          const created = dayjs(o.created_at);
          const inRange = created.isBetween(dateRange[0], dateRange[1], null, "[]");
          const statusOk = statusFilter === "all" ? true : o.status === statusFilter;
          return inRange && statusOk;
        });

        // Count user orders to estimate new vs returning
        const userOrderCount = new Map();

        // Aggregate product sales and revenue by productId
        const productSalesMap = new Map(); // productName -> qty
        const productIdRevenueMap = new Map(); // productId -> revenue

        for (const o of orders) {
          const userKey = o.user ?? o.user_email ?? `user-${o.id}`;
          userOrderCount.set(userKey, (userOrderCount.get(userKey) || 0) + 1);

          // Only count completed orders for top sales/revenue
          if (o.status !== "success") continue;
          const items = Array.isArray(o.items) ? o.items : [];
          for (const it of items) {
            const qty = Number(it.quantity || 0);
            const price = Number(it.price || 0);
            const pid = it.product; // product id from serializer
            const pname = it.product_name || `SP #${pid}`;

            productSalesMap.set(pname, (productSalesMap.get(pname) || 0) + qty);
            if (pid != null)
              productIdRevenueMap.set(
                pid,
                (productIdRevenueMap.get(pid) || 0) + qty * price
              );
          }
        }

        // Build Top Products list
        const topProductsArr = Array.from(productSalesMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, sales], idx) => ({ key: idx + 1, name, sales }));

        // Fetch product details to map productId -> seller_name
        const uniqueIds = Array.from(productIdRevenueMap.keys());
        const detailResults = await Promise.all(
          uniqueIds.map((id) =>
            api
              .get(`/products/${id}/`)
              .then((r) => ({ id, data: r.data }))
              .catch(() => ({ id, data: null }))
          )
        );
        const sellerByProductId = new Map(
          detailResults.map(({ id, data }) => [id, data?.seller_name || data?.store?.store_name || "—"]) 
        );

        // Aggregate revenue by seller
        const supplierRevenueMap = new Map(); // seller -> revenue
        for (const [pid, revenue] of productIdRevenueMap.entries()) {
          const seller = sellerByProductId.get(pid) || "—";
          supplierRevenueMap.set(
            seller,
            (supplierRevenueMap.get(seller) || 0) + revenue
          );
        }
        const topSuppliersArr = Array.from(supplierRevenueMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, revenue], idx) => ({ key: idx + 1, name, revenue: Math.round(revenue) }));

        // Customer pie: new vs returning within fetched dataset
        let newCount = 0,
          returningCount = 0;
        userOrderCount.forEach((cnt) => {
          if (cnt > 1) returningCount += 1;
          else newCount += 1;
        });
        const custData = [
          { name: "Khách mới", value: newCount },
          { name: "Khách quay lại", value: returningCount },
        ];

        setTopProducts(topProductsArr);
        setTopSuppliers(topSuppliersArr);
        setCustomerData(custData);
      } catch (e) {
        console.error(e);
        message.error("Không thể tải dữ liệu báo cáo");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [dateRange, statusFilter]);

  const COLORS = ["#00C49F", "#0088FE"];

  return (
    <div className="px-4 space-y-6">
      {/* Bộ lọc */}
      <Card>
        <Space wrap>
          <RangePicker value={dateRange} onChange={setDateRange} />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "Tất cả trạng thái" },
              { value: "pending", label: "Chờ xử lý" },
              { value: "shipping", label: "Đang giao" },
              { value: "success", label: "Thành công" },
              { value: "cancelled", label: "Hủy" },
            ]}
          />
        </Space>
      </Card>

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
          loading={loading}
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
          loading={loading}
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
