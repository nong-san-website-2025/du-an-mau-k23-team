import React, { useState, useEffect } from "react";
import { Table, Input, Select, Tag } from "antd";

const { Search } = Input;
const { Option } = Select;

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [filterType, setFilterType] = useState("all"); // all | system | seller
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    // 🔹 Giả lập API (sau này bạn thay bằng Django API)
    const fakeData = [
      {
        id: 1,
        campaignName: "Chiến dịch Tết 2025",
        promotionName: "Giảm 20% đơn từ 200K",
        quantity: 1000,
        discountPercent: 20,
        description: "Áp dụng cho toàn bộ đơn hàng trên 200K",
        startDate: "2025-01-20",
        endDate: "2025-02-10",
        remaining: 350,
        status: "active",
        condition: "Đơn tối thiểu 200K",
        channel: "system", // system | seller
        creator: "Admin Hệ Thống",
      },
      {
        id: 2,
        campaignName: "Flash Sale Tháng 9",
        promotionName: "Mua 1 tặng 1 Trà sữa",
        quantity: 500,
        discountPercent: 50,
        description: "Áp dụng cho sản phẩm trà sữa",
        startDate: "2025-09-01",
        endDate: "2025-09-05",
        remaining: 120,
        status: "expired",
        condition: "Chỉ áp dụng 1 lần/khách",
        channel: "seller",
        creator: "Cửa hàng Trà Sữa A",
      },
    ];
    setPromotions(fakeData);
  }, []);

  const filteredData = promotions.filter((p) => {
    const matchType = filterType === "all" || p.channel === filterType;
    const matchSearch =
      p.campaignName.toLowerCase().includes(searchText.toLowerCase()) ||
      p.promotionName.toLowerCase().includes(searchText.toLowerCase());
    return matchType && matchSearch;
  });

  const columns = [
    { title: "Tên chương trình", dataIndex: "campaignName", key: "campaignName" },
    { title: "Tên khuyến mãi", dataIndex: "promotionName", key: "promotionName" },
    { title: "Số lượng", dataIndex: "quantity", key: "quantity" },
    { title: "% khuyến mãi", dataIndex: "discountPercent", key: "discountPercent" },
    { title: "Mô tả", dataIndex: "description", key: "description" },
    {
      title: "Thời gian áp dụng",
      key: "time",
      render: (record) => `${record.startDate} → ${record.endDate}`,
    },
    { title: "Còn lại", dataIndex: "remaining", key: "remaining" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) =>
        status === "active" ? <Tag color="green">Đang áp dụng</Tag> : <Tag color="red">Hết hạn</Tag>,
    },
    { title: "Điều kiện", dataIndex: "condition", key: "condition" },
    {
      title: "Kênh áp dụng",
      dataIndex: "channel",
      key: "channel",
      render: (channel) =>
        channel === "system" ? <Tag color="blue">Hệ thống</Tag> : <Tag color="purple">Seller</Tag>,
    },
    { title: "Người tạo", dataIndex: "creator", key: "creator" },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2>Quản lý khuyến mãi</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Search
          placeholder="Tìm kiếm chương trình hoặc khuyến mãi..."
          onSearch={(value) => setSearchText(value)}
          style={{ width: 300 }}
          allowClear
        />

        <Select
          defaultValue="all"
          style={{ width: 200 }}
          onChange={(value) => setFilterType(value)}
        >
          <Option value="all">Tất cả</Option>
          <Option value="system">Hệ thống</Option>
          <Option value="seller">Seller</Option>
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
