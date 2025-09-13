// src/components/Dashboard/TopSellingProducts.jsx
import React, { useEffect, useState } from "react";
import { Table, Card, Select, Avatar } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Option } = Select;

export default function TopSellingProducts() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("today");
  const navigate = useNavigate();

  useEffect(() => {
    // Mock data theo filter
    const mockData = {
      today: [
        {
          product_id: 1,
          product_name: "Xoài Cát Chu",
          shop_name: "Shop A",
          quantity_sold: 120,
          revenue: 3600000,
          thumbnail: "https://via.placeholder.com/60?text=Xoai",
        },
        {
          product_id: 2,
          product_name: "Gạo ST25",
          shop_name: "Shop B",
          quantity_sold: 95,
          revenue: 2850000,
          thumbnail: "https://via.placeholder.com/60?text=Gao",
        },
      ],
      week: [
        {
          product_id: 3,
          product_name: "Cà phê rang xay",
          shop_name: "Shop C",
          quantity_sold: 800,
          revenue: 24000000,
          thumbnail: "https://via.placeholder.com/60?text=CaPhe",
        },
      ],
      month: [
        {
          product_id: 1,
          product_name: "Xoài Cát Chu",
          shop_name: "Shop A",
          quantity_sold: 1200,
          revenue: 36000000,
          thumbnail: "https://via.placeholder.com/60?text=Xoai",
        },
        {
          product_id: 2,
          product_name: "Gạo ST25",
          shop_name: "Shop B",
          quantity_sold: 950,
          revenue: 28500000,
          thumbnail: "https://via.placeholder.com/60?text=Gao",
        },
        {
          product_id: 3,
          product_name: "Cà phê rang xay",
          shop_name: "Shop C",
          quantity_sold: 800,
          revenue: 24000000,
          thumbnail: "https://via.placeholder.com/60?text=CaPhe",
        },
      ],
    };

    setData(mockData[filter] || []);
  }, [filter]);

  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      render: (text, record) => (
        <div
          style={{ cursor: "pointer" }}
          onClick={() => navigate(`/products/${record.product_id}`)}
        >
          <Avatar
            src={record.thumbnail}
            shape="square"
            size="large"
            style={{ marginRight: 8 }}
          />
          {text}
        </div>
      ),
    },
    {
      title: "Shop",
      dataIndex: "shop_name",
      key: "shop_name",
    },
    {
      title: "Số lượng bán",
      dataIndex: "quantity_sold",
      key: "quantity_sold",
      sorter: (a, b) => a.quantity_sold - b.quantity_sold,
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      render: (val) => val.toLocaleString() + " ₫",
      sorter: (a, b) => a.revenue - b.revenue,
    },
  ];

  return (
    <Card
      title="Top sản phẩm bán chạy"
      extra={
        <Select value={filter} onChange={(val) => setFilter(val)}>
          <Option value="today">Hôm nay</Option>
          <Option value="week">Tuần này</Option>
          <Option value="month">Tháng này</Option>
        </Select>
      }
    >
      <Table
        rowKey="product_id"
        columns={columns}
        dataSource={data}
        pagination={false}
      />
    </Card>
  );
}
