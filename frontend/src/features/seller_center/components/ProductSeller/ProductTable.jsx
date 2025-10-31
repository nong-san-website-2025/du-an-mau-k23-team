import React from "react";
import { Table, Button, Popconfirm, Tag, Space } from "antd";
import { intcomma } from "../../../../utils/format";

const ProductTable = ({ data, onEdit, onDelete, onSelfReject, onRow }) => {
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
      title: "Giá gốc",
      dataIndex: "original_price",
      key: "original_price",
      width: 120,
      align: "right",
      render: (price) => intcomma(price), // <= dùng intcomma
    },

    {
      title: "Giá giảm",
      dataIndex: "discounted_price",
      key: "discounted_price",
      width: 120,
      align: "right",
      render: (price) => intcomma(price) , // <= dùng intcomma
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
      title: "Mùa vụ",
      key: "season",
      width: 260,
      render: (record) => {
        if (record.availability_status !== "coming_soon") {
          return <span style={{ color: "#8c8c8c" }}>—</span>;
        }

        const formatDate = (dateStr) => {
          if (!dateStr) return "—";
          const d = new Date(dateStr);
          return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
        };

        const start = formatDate(record.season_start);
        const end = formatDate(record.season_end);
        const estimated = record.estimated_quantity || 0;
        const ordered = record.ordered_quantity || 0;

        return (
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <span style={{ color: "#595959", fontWeight: 500 }}>📅</span>
              <span>
                <b>{start}</b> → <b>{end}</b>
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div>
                <Tag
                  color="purple"
                  style={{ fontSize: 12, fontWeight: 500, marginRight: 0 }}
                >
                  Dự kiến: {estimated.toLocaleString("vi-VN")}
                </Tag>
              </div>
              <div>
                <Tag
                  color="geekblue"
                  style={{ fontSize: 12, fontWeight: 500, marginRight: 0 }}
                >
                  Đã đặt: {ordered.toLocaleString("vi-VN")}
                </Tag>
              </div>
            </div>
          </div>
        );
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
          <div onClick={(e) => e.stopPropagation()}>
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
              <Button
                type="link"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(record);
                }}
              >
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
          </div>
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
      onRow={onRow} // 👈 Thêm dòng này
    />
  );
};

export default ProductTable;
