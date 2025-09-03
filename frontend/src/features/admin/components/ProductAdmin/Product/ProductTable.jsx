// src/features/admin/components/ProductTable.jsx
import React from "react";
import { Table } from "antd";
import ProductStatusTag from "./ProductStatusTag";
import ProductActions from "./ProductActions";
import dayjs from "dayjs";

const ProductTable = ({
  data,
  onApprove,
  onReject,
  onView,
  onToggleBan,
  selectedRowKeys, // thêm state từ parent
  setSelectedRowKeys,
}) => {
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
      sorter: (a, b) => a.id - b.id,
      align: "center",
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      width: 250,
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
    },
    {
      title: "Danh mục",
      key: "category",
      width: 180,
      render: (_, record) => record.category_name || "—",
      sorter: (a, b) =>
        (a.category_name || "").localeCompare(b.category_name || ""),
      align: "center",
    },
    {
      title: "Người bán",
      key: "seller",
      width: 180,
      render: (_, record) =>
        record.seller?.store_name || record.seller_name || "—",
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      width: 120,
      height: 70,
      render: (price) => (price ? `${Number(price).toLocaleString()} đ` : "—"),
      sorter: (a, b) => a.price - b.price,
      align: "right",
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 140,
      render: (_, record) => <ProductStatusTag status={record.status} />,
      align: "center",
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "—"),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      align: "center",
    },
    {
      title: "Hành động",
      key: "action",
      width: 90,
      render: (_, record) => (
        <ProductActions
          record={record}
          onApprove={onApprove}
          onReject={onReject}
          onView={onView}
          onToggleBan={onToggleBan}
        />
      ),
      align: "center",
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys), // đây cần là function
  };

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      bordered
      pagination={{ pageSize: 10 }}
      scroll={{ x: 1100 }}
      size="small"
      rowSelection={rowSelection}
    />
  );
};

export default ProductTable;
