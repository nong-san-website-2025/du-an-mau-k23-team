// src/components/Dashboard/TopSellingProducts.jsx
import React, { useEffect, useState } from "react";
import { Table, Card, Select, Avatar } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Option } = Select;

export default function TopSellingProducts() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("today");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL =
    process.env.REACT_APP_API_URL || "http://172.16.144.88:8000/api";
  // Lấy Domain gốc (ví dụ: http://172.16.144.88:8000)
  const BASE_DOMAIN = new URL(API_URL).origin;

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/products/top-products/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const normalized = res.data.map((item) => {
          // --- BƯỚC SỬA LỖI URL ẢNH QUAN TRỌNG ---
          let finalImg = "";
          const rawThumbnail = item.thumbnail || "";

          if (rawThumbnail.includes("/api/products/top-products/")) {
            // Nếu bị dính link API, ta cắt bỏ đoạn rác và thay bằng /media/
            const parts = rawThumbnail.split("/api/products/top-products/");
            finalImg = `${BASE_DOMAIN}/media/${parts[1]}`;
          } else if (rawThumbnail.startsWith("http")) {
            finalImg = rawThumbnail;
          } else {
            // Trường hợp link tương đối
            const cleanPath = rawThumbnail.startsWith("/")
              ? rawThumbnail
              : `/${rawThumbnail}`;
            finalImg = `${BASE_DOMAIN}/media${cleanPath}`;
          }

          return {
            product_id: item.product_id,
            product_name: item.product_name,
            shop_name: item.shop_name || "N/A",
            quantity_sold: item.quantity_sold || 0,
            revenue: item.revenue || 0,
            thumbnail: finalImg,
          };
        });

        setData(normalized);
      } catch (err) {
        console.error("Lỗi fetch:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, [filter, API_URL, BASE_DOMAIN]);

  // Cấu hình cột với tính năng SORT đầy đủ
  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      // ✅ Thêm sort theo tên sản phẩm
      sorter: (a, b) =>
        (a.product_name || "").localeCompare(b.product_name || ""),
      render: (text, record) => (
        <div
          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          onClick={() => navigate(`/products/${record.product_id}`)}
        >
          <Avatar
            src={record.thumbnail}
            shape="square"
            size="large"
            style={{ marginRight: 8, border: "1px solid #f0f0f0" }}
          />
          {text}
        </div>
      ),
    },
    {
      title: "Shop",
      dataIndex: "shop_name",
      key: "shop_name",
      // ✅ Thêm sort theo tên shop
      sorter: (a, b) => (a.shop_name || "").localeCompare(b.shop_name || ""),
    },
    {
      title: "Số lượng bán",
      dataIndex: "quantity_sold",
      key: "quantity_sold",
      // ✅ Thêm sort theo số lượng (Số)
      sorter: (a, b) => a.quantity_sold - b.quantity_sold,
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      // ✅ Thêm sort theo doanh thu (Số)
      sorter: (a, b) => a.revenue - b.revenue,
      render: (val) => (val ? val.toLocaleString() + " ₫" : "0 ₫"),
    },
  ];

  return (
    <Card
      title="Top sản phẩm bán chạy"
      extra={
        <Select
          value={filter}
          onChange={(val) => setFilter(val)}
          style={{ width: 120 }}
        >
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
        loading={loading}
        pagination={false}
      />
    </Card>
  );
}
