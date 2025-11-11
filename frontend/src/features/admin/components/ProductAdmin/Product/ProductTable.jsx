// src/features/admin/components/ProductTable.jsx
import React, { useState } from "react";
import { Table, Tooltip, Image } from "antd";
import ProductStatusTag from "./ProductStatusTag";
import ProductActions from "./ProductActions";
import dayjs from "dayjs";
import "../../../styles/AdminPageLayout.css";

const ProductTable = ({
  data,
  onApprove,
  onReject,
  onView,
  onToggleBan,
  selectedRowKeys,
  setSelectedRowKeys,
  onRow,
}) => {
  const [selectedColumns, setSelectedColumns] = useState([
    "image",
    "name",
    "category",
    "seller",
    "price",
    "unit",
    "status",
    "created_at",
    "action",
  ]);

  const columns = [
    {
      title: "Ảnh",
      key: "image",
      dataIndex: "image",
      width: 60,
      align: "center",
      render: (_, record) => {
        // Lấy URL ảnh từ main_image.image hoặc ảnh đầu tiên trong mảng images
        const productImage = record.main_image?.image || (record.images?.length > 0 ? record.images[0].image : null);
        
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 50,
              height: 30,
              borderRadius: 4,
              backgroundColor: productImage ? "transparent" : "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #e8e8e8",
            }}
          >
            {productImage ? (
              <Image
                src={productImage} // URL ảnh đã đầy đủ, không cần thêm API base
                alt={record.name}
                width={60}
                height={40}
                style={{
                  objectFit: "cover",
                  borderRadius: 4,
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/60x40/f5f5f5/999999?text=No+Image";
                }}
                fallback="https://placehold.co/60x40/f5f5f5/999999?text=Error"
                preview={true}
              />
            ) : (
              <span style={{ color: "#999", fontSize: 12 }}>Chưa có ảnh</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      width: 240,
      ellipsis: { showTitle: false },
      render: (text) => (
        <Tooltip title={text}>
          <span
            style={{
              display: "inline-block",
              maxWidth: 220,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              verticalAlign: "middle",
              fontWeight: 500,
            }}
          >
            {text}
          </span>
        </Tooltip>
      ),
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
    },
    {
      title: "Danh mục",
      key: "category",
      width: 160,
      align: "center",
      render: (_, record) => record.category_name || "—",
      sorter: (a, b) =>
        (a.category_name || "").localeCompare(b.category_name || ""),
    },
    {
      title: "Người bán",
      key: "seller",
      dataIndex: "seller",
      width: 80,
      align: "center",
      render: (_, record) => {
        const text = record.seller?.store_name || record.seller_name || "—";
        return (
          <Tooltip title={text}>
            <span
              style={{
                display: "inline-block",
                maxWidth: 160,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                verticalAlign: "middle",
              }}
            >
              {text}
            </span>
          </Tooltip>
        );
      },
    },

    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      width: 120,
      align: "right",
      render: (price) => (price ? `${Number(price).toLocaleString()} đ` : "—"),
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      key: "unit",
      width: 90,
      align: "center",
      render: (unit) => {
        const unitLabels = {
          kg: "kg",
          g: "g",
          l: "lít",
          ml: "ml",
          unit: "cái",
          bag: "bao",
        };
        return unitLabels[unit] || unit || "—";
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 140,
      align: "center",
      render: (_, record) => <ProductStatusTag status={record.status} />,
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 180, // ✅ Tăng từ 160 lên 180
      align: "center",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "—"),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: "Hành động",
      key: "action",
      width: 100, // ✅ Tăng từ 120 lên 200
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <ProductActions
          record={record} 
          onApprove={onApprove}
          onReject={onReject}
          onView={onView}
          onToggleBan={onToggleBan}
        />
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  return (
    <Table
      rowKey="id"
      bordered
      size="small"
      dataSource={data}
      columns={columns.filter((col) => selectedColumns.includes(col.key))}
      rowSelection={rowSelection}
      onRow={onRow}
      pagination={{ pageSize: 10 }}
      scroll={{
        x: "max-content",
      }}
      sticky
      rowClassName="table-row"
    />
  );
};

export default ProductTable;
