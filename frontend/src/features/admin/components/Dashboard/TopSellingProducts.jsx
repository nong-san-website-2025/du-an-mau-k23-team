// src/components/Dashboard/TopSellingProducts.jsx
import React, { useEffect, useState } from "react";
import { Table, Card, Select, Avatar } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Option } = Select;

export default function TopSellingProducts() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("today"); // giữ filter, sau này backend support
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://127.0.0.1:8000/api/products/top-products/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Chuẩn hóa dữ liệu từ backend
        const normalized = res.data.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          shop_name: item.shop_name,
          quantity_sold: item.quantity_sold,
          revenue: item.revenue,
          thumbnail: item.thumbnail,
        }));

        setData(normalized);
      } catch (err) {
        setData([]);
      }
    };

    fetchTopProducts();
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
      render: (val) => (val ? val.toLocaleString() + " ₫" : "0 ₫"),
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
