import React from "react";
import { Table, Button, Popconfirm, Tag, Space } from "antd";

const ProductTable = ({ data, onEdit, onDelete }) => {
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      align: "center",
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      width: 220,
      ellipsis: true, // nếu tên quá dài sẽ hiện ...
    },
    {
      title: "Danh mục",
      key: "category",
      width: 200,
      render: (record) => (
        <>
          <div style={{ fontWeight: 500 }}>{record.category_name}</div>
          <small style={{ color: "#888" }}>{record.subcategory_name}</small>
        </>
      ),
    },
    {
      title: "Giá (VNĐ)",
      dataIndex: "price",
      key: "price",
      width: 120,
      align: "right",
      render: (price) => (price ? price.toLocaleString("vi-VN") : "0"),
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      key: "stock",
      width: 100,
      align: "center",
      
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      align: "center",
      render: (status) => {
        switch (status) {
          case "pending":
            return <Tag color="orange">Chờ duyệt</Tag>;
          case "approved":
            return <Tag color="green">Đã duyệt</Tag>;
          case "rejected":
            return <Tag color="red">Bị từ chối</Tag>;
          default:
            return <Tag>{status}</Tag>;
        }
      },
    },

    {
      title: "Hành động",
      key: "action",
      width: 200,
      align: "center",
      render: (_, record) => {
        const canEdit = record.status !== "approved"; // Chỉ edit nếu chưa duyệt hoặc bị từ chối
        return (
          <Space size="small">
            {canEdit && (
              <Button type="link" onClick={() => onEdit(record)}>
                ✏️ Sửa
              </Button>
            )}
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa sản phẩm này?"
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(record.id)}
            >
              <Button type="link" danger>
                🗑️ Xóa
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      bordered
      pagination={{ pageSize: 5, showSizeChanger: false }}
      scroll={{ x: 950 }}
      size="small"
    />
  );
};

export default ProductTable;
