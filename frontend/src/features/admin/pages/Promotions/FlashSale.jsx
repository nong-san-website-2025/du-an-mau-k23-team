import React, { useState, useEffect } from "react";
import { Table, Input, Tag, Select } from "antd";

const { Search } = Input;
const { Option } = Select;

export default function FlashSalePage() {
  const [flashSales, setFlashSales] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    // 🔹 Giả lập dữ liệu (sau này thay API Django)
    const fakeFlashSales = [
      {
        id: 1,
        campaignName: "Flash Sale 9.9",
        productName: "Táo Mỹ 1kg",
        originalPrice: 120000,
        salePrice: 75000,
        discountPercent: 37,
        totalStock: 500,
        remainingStock: 120,
        startTime: "2025-09-09 00:00",
        endTime: "2025-09-09 23:59",
        status: "upcoming", // upcoming | active | ended
        seller: "Trái Cây Sạch ABC",
      },
      {
        id: 2,
        campaignName: "Flash Sale Trung Thu",
        productName: "Bánh Trung Thu Thập Cẩm",
        originalPrice: 80000,
        salePrice: 40000,
        discountPercent: 50,
        totalStock: 1000,
        remainingStock: 0,
        startTime: "2025-09-15 08:00",
        endTime: "2025-09-15 20:00",
        status: "ended",
        seller: "Tiệm Bánh Ngon",
      },
    ];
    setFlashSales(fakeFlashSales);
  }, []);

  const filteredData = flashSales.filter((f) => {
    const matchStatus = statusFilter === "all" || f.status === statusFilter;
    const matchSearch =
      f.campaignName.toLowerCase().includes(searchText.toLowerCase()) ||
      f.productName.toLowerCase().includes(searchText.toLowerCase());
    return matchStatus && matchSearch;
  });

  const columns = [
    { title: "Chiến dịch", dataIndex: "campaignName", key: "campaignName" },
    { title: "Sản phẩm", dataIndex: "productName", key: "productName" },
    {
      title: "Giá gốc",
      dataIndex: "originalPrice",
      key: "originalPrice",
      render: (price) => `${price.toLocaleString()}₫`,
    },
    {
      title: "Giá Flash Sale",
      dataIndex: "salePrice",
      key: "salePrice",
      render: (price) => <b style={{ color: "red" }}>{price.toLocaleString()}₫</b>,
    },
    { title: "Giảm (%)", dataIndex: "discountPercent", key: "discountPercent" },
    { title: "Tổng SL", dataIndex: "totalStock", key: "totalStock" },
    {
      title: "Còn lại",
      dataIndex: "remainingStock",
      key: "remainingStock",
      render: (remain) =>
        remain > 0 ? (
          <Tag color="green">{remain}</Tag>
        ) : (
          <Tag color="red">Hết hàng</Tag>
        ),
    },
    {
      title: "Thời gian",
      key: "time",
      render: (record) => `${record.startTime} → ${record.endTime}`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        switch (status) {
          case "upcoming":
            return <Tag color="blue">Sắp diễn ra</Tag>;
          case "active":
            return <Tag color="green">Đang diễn ra</Tag>;
          case "ended":
            return <Tag color="red">Kết thúc</Tag>;
          default:
            return <Tag>Không rõ</Tag>;
        }
      },
    },
    { title: "Người bán", dataIndex: "seller", key: "seller" },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2>Quản lý Flash Sale</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Search
          placeholder="Tìm kiếm theo chiến dịch hoặc sản phẩm..."
          onSearch={(value) => setSearchText(value)}
          style={{ width: 300 }}
          allowClear
        />

        <Select
          defaultValue="all"
          style={{ width: 200 }}
          onChange={(value) => setStatusFilter(value)}
        >
          <Option value="all">Tất cả</Option>
          <Option value="upcoming">Sắp diễn ra</Option>
          <Option value="active">Đang diễn ra</Option>
          <Option value="ended">Đã kết thúc</Option>
        </Select>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        pagination={{ pageSize: 5 }}
        bordered
      />
    </div>
  );
}
