import React from "react";
import { Table, Button, Popconfirm, Tag, Space } from "antd";

const ProductTable = ({ data, onEdit, onDelete, onSelfReject }) => {
  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 70, align: "center" },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      width: 220,
      ellipsis: true,
    },
    {
      title: "Danh mục",
      key: "category",
      width: 200,
      render: (record) => (
        <>
          <div style={{ fontWeight: 500 }}>{record.category_name || "---"}</div>
          <small style={{ color: "#888" }}>
            {record.subcategory_name || "---"}
          </small>
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
      title: "Duyệt",
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
          case "self_rejected":
            return <Tag color="volcano">Tự từ chối</Tag>;
          default:
            return <Tag>{status}</Tag>;
        }
      },
    },
    {
      title: "Hàng hóa",
      dataIndex: "availability_status",
      key: "availability_status",
      width: 140,
      align: "center",
      render: (availability) => {
        switch (availability) {
          case "available":
            return <Tag color="blue">Có sẵn</Tag>;
          case "coming_soon":
            return <Tag color="purple">Sắp có</Tag>;
          default:
            return <Tag>{availability}</Tag>;
        }
      },
    },
    {
      title: "Mùa vụ & Sản lượng",
      key: "season",
      width: 280,
      render: (record) => {
        if (record.availability_status === "coming_soon") {
          const formatDate = (d) =>
            d ? new Date(d).toLocaleDateString("vi-VN") : "";
          return (
            <div style={{ textAlign: "left" }}>
              <div>
                <b>Mùa vụ:</b> {formatDate(record.season_start)} →{" "}
                {formatDate(record.season_end)}
              </div>
              <div>
                <b>Dự kiến:</b>{" "}
                {record.estimated_quantity?.toLocaleString("vi-VN") || 0} sản
                phẩm
              </div>
              <div>
                <b>Đã đặt:</b>{" "}
                {record.ordered_quantity?.toLocaleString("vi-VN") || 0} sản phẩm
              </div>
            </div>
          );
        }
        // Khi "có sẵn" thì không hiển thị gì
        return null;
      },
    },

    {
      title: "Hành động",
      key: "action",
      width: 250,
      align: "center",
      render: (_, record) => {
        const isSelfRejected = record.status === "self_rejected";

        return (
          <Space size="small">
            {!isSelfRejected && (
              <Popconfirm
                title="Bạn có chắc muốn tự từ chối sản phẩm này?"
                okText="Xác nhận"
                cancelText="Hủy"
                onConfirm={() => onSelfReject(record)}
              >
                <Button type="link" danger>
                  Tự từ chối
                </Button>
              </Popconfirm>
            )}
            {/* Luôn hiển thị nút Sửa */}
            <Button type="link" onClick={() => onEdit(record)}>
              Sửa
            </Button>
            {isSelfRejected && (
              <Popconfirm
                title="Bạn có chắc chắn muốn xóa sản phẩm này?"
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                onConfirm={() => onDelete(record.id)}
              >
                <Button type="link" danger>
                  Xóa
                </Button>
              </Popconfirm>
            )}
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
      pagination={{ pageSize: 10, showSizeChanger: false }}
      scroll={{ x: 1300 }}
      size="small"
    />
  );
};

export default ProductTable;
