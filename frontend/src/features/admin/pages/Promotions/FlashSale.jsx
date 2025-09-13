import React, { useState, useEffect } from "react";
import { Table, Input, Tag, Select, Spin, Empty, message } from "antd";
// Nếu backend chưa có API, bạn có thể comment dòng dưới
import { getFlashSales } from "../../services/promotionServices";

const { Search } = Input;
const { Option } = Select;

export default function FlashSalePage() {
  const [flashSales, setFlashSales] = useState([]); // flattened items
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        let items = [];
        if (typeof getFlashSales === "function") {
          items = await getFlashSales(); // gọi API nếu có
        }

        // fallback mock data nếu API chưa trả gì
        if (!items || items.length === 0) {
          items = [
            {
              id: 1,
              flashsale_title: "Flash Sale 9/9",
              product_name: "Áo thun nam",
              original_price: 200000,
              sale_price: 99000,
              discount_percent: 50,
              total_stock: 100,
              remaining_stock: 20,
              start_at: "2025-09-10T10:00:00Z",
              end_at: "2025-09-12T23:59:59Z",
              status: "active",
              seller_name: "Shop ABC",
            },
            {
              id: 2,
              flashsale_title: "Flash Sale 10/10",
              product_name: "Giày sneaker",
              original_price: 800000,
              sale_price: 499000,
              discount_percent: 38,
              total_stock: 50,
              remaining_stock: 0,
              start_at: "2025-10-10T00:00:00Z",
              end_at: "2025-10-10T23:59:59Z",
              status: "upcoming",
              seller_name: "Shop XYZ",
            },
          ];
        }

        if (!mounted) return;
        setFlashSales(items);
      } catch (err) {
        console.error(err);
        message.error("Không tải được dữ liệu flash sale");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const q = (str) => (str || "").toString().toLowerCase();

  const filteredData = flashSales.filter((f) => {
    const matchStatus =
      statusFilter === "all" || (f.status || "unknown") === statusFilter;
    const search = q(searchText);
    const matchSearch =
      q(f.flashsale_title).includes(search) ||
      q(f.product_name).includes(search);
    return matchStatus && matchSearch;
  });

  const columns = [
    { title: "Chiến dịch", dataIndex: "flashsale_title", key: "flashsale_title" },
    { title: "Sản phẩm", dataIndex: "product_name", key: "product_name" },
    {
      title: "Giá gốc",
      dataIndex: "original_price",
      key: "original_price",
      render: (price) =>
        price !== null && price !== undefined && !Number.isNaN(Number(price))
          ? `${Number(price).toLocaleString()}₫`
          : "-",
    },
    {
      title: "Giá Flash Sale",
      dataIndex: "sale_price",
      key: "sale_price",
      render: (price) =>
        price !== null && price !== undefined && !Number.isNaN(Number(price)) ? (
          <b style={{ color: "red" }}>{Number(price).toLocaleString()}₫</b>
        ) : (
          "-"
        ),
    },
    {
      title: "Giảm (%)",
      dataIndex: "discount_percent",
      key: "discount_percent",
      render: (d) => (d !== null && d !== undefined ? `${d}%` : "-"),
    },
    { title: "Tổng SL", dataIndex: "total_stock", key: "total_stock" },
    {
      title: "Còn lại",
      dataIndex: "remaining_stock",
      key: "remaining_stock",
      render: (r) =>
        r > 0 ? <Tag color="green">{r}</Tag> : <Tag color="red">Hết</Tag>,
    },
    {
      title: "Thời gian",
      key: "time",
      render: (record) =>
        record.start_at
          ? `${new Date(record.start_at).toLocaleString()} → ${new Date(
              record.end_at
            ).toLocaleString()}`
          : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        switch (status) {
          case "upcoming":
            return <Tag color="blue">Sắp</Tag>;
          case "active":
            return <Tag color="green">Đang</Tag>;
          case "ended":
            return <Tag color="red">Kết thúc</Tag>;
          default:
            return <Tag>Không rõ</Tag>;
        }
      },
    },
    { title: "Người bán", dataIndex: "seller_name", key: "seller_name" },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2>Quản lý Flash Sale</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Search
          placeholder="Tìm kiếm theo chiến dịch hoặc sản phẩm..."
          onSearch={(value) => setSearchText(value)}
          allowClear
          style={{ width: 300 }}
        />

        <Select
          defaultValue="all"
          style={{ width: 200 }}
          onChange={(v) => setStatusFilter(v)}
        >
          <Option value="all">Tất cả</Option>
          <Option value="upcoming">Sắp diễn ra</Option>
          <Option value="active">Đang diễn ra</Option>
          <Option value="ended">Đã kết thúc</Option>
        </Select>
      </div>

      {loading ? (
        <Spin />
      ) : filteredData.length === 0 ? (
        <Empty description="Không có sản phẩm flash sale" />
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 6 }}
          bordered
        />
      )}
    </div>
  );
}
