// src/features/seller_center/components/ProductTable.jsx
import React from "react";
import {
  Table,
  Button,
  Popconfirm,
  Tag,
  Space,
  Tooltip,
  Image,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { intcomma } from "../../../../utils/format";

const ProductTable = ({
  data,
  onEdit,
  onDelete,
  onSelfReject,
  onRow,
  onManageImages,
}) => {
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      align: "center",
    },
    {
      title: "Sản phẩm",
      key: "name",
      width: 300,
      render: (record) => {
        let imageUrl = null;
        if (Array.isArray(record.images) && record.images.length > 0) {
          const primary = record.images.find((img) => img.is_primary);
          imageUrl = primary?.image || record.images[0]?.image;
        }

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={record.name}
                width={48}
                height={48}
                style={{
                  objectFit: "cover",
                  borderRadius: 6,
                  border: "1px solid #f0f0f0",
                }}
                fallback="/no-image.png"
                preview={false}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#fafafa",
                  border: "1px solid #f0f0f0",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#bbb",
                  fontSize: 14,
                }}
              >
                ❌
              </div>
            )}
            <Tooltip title={record.name} placement="topLeft">
              <span
                style={{
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontWeight: 500,
                }}
              >
                {record.name}
              </span>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "Danh mục",
      key: "category",
      width: 180,
      render: (record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.category_name || "---"}</div>
          <small style={{ color: "#8c8c8c" }}>
            {record.subcategory_name || "---"}
          </small>
        </div>
      ),
    },
    {
      title: "Giá gốc",
      dataIndex: "original_price",
      key: "original_price",
      width: 120,
      align: "right",
      render: (price) => (
        <span style={{ color: "#999" }}>{intcomma(price)} đ</span>
      ),
    },
    {
      title: "Giá bán",
      dataIndex: "discounted_price",
      key: "discounted_price",
      width: 120,
      align: "right",
      render: (price) => (
        <strong style={{ color: "#1890ff" }}>{intcomma(price)} đ</strong>
      ),
    },
    {
      title: "Kho",
      dataIndex: "stock",
      key: "stock",
      width: 90,
      align: "center",
      render: (stock) =>
        stock > 0 ? (
          <Tag color="green">{stock.toLocaleString()}</Tag>
        ) : (
          <Tag color="red">Hết</Tag>
        ),
    },
    {
      title: "Duyệt",
      dataIndex: "status",
      key: "status",
      width: 140,
      align: "center",
      render: (status) => {
        const statusMap = {
          pending: { color: "orange", text: "Chờ duyệt" },
          approved: { color: "green", text: "Đã duyệt" },
          rejected: { color: "red", text: "Từ chối" },
          self_rejected: { color: "volcano", text: "Tự huỷ" },
        };
        const s = statusMap[status] || { color: "default", text: status };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: "Hàng hóa",
      dataIndex: "availability_status",
      key: "availability_status",
      width: 140,
      align: "center",
      render: (availability) => {
        const statusMap = {
          available: { color: "blue", text: "Có sẵn" },
          coming_soon: { color: "purple", text: "Sắp có" },
        };
        const s = statusMap[availability] || {
          color: "default",
          text: availability,
        };
        return <Tag color={s.color}>{s.text}</Tag>;
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
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Tag color="purple" style={{ fontSize: 12 }}>
                Dự kiến: {estimated.toLocaleString("vi-VN")}
              </Tag>
              <Tag color="geekblue" style={{ fontSize: 12 }}>
                Đã đặt: {ordered.toLocaleString("vi-VN")}
              </Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      fixed: "right",
      width: 180,
      align: "center",
      render: (_, record) => {
        const isSelfRejected = record.status === "self_rejected";

        return (
          <Space size="small" onClick={(e) => e.stopPropagation()}>
            {/* Quản lý ảnh */}
            <Tooltip title="Quản lý ảnh sản phẩm">
              <Button
                type="text"
                icon={<PictureOutlined style={{ color: "#1890ff" }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onManageImages(record);
                }}
              />
            </Tooltip>

            {/* Huỷ sản phẩm */}
            {!isSelfRejected && (
              <Tooltip title="Huỷ yêu cầu đăng sản phẩm">
                <Popconfirm
                  title="Bạn có chắc muốn huỷ thêm sản phẩm này?"
                  okText="Xác nhận"
                  cancelText="Hủy"
                  onConfirm={() => onSelfReject(record)}
                >
                  <Button
                    type="text"
                    danger
                    icon={<StopOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </Tooltip>
            )}

            {/* Sửa */}
            <Tooltip title="Chỉnh sửa sản phẩm">
              <Button
                type="text"
                icon={<EditOutlined style={{ color: "#52c41a" }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(record);
                }}
              />
            </Tooltip>

            {/* Xoá nếu đã tự huỷ */}
            {isSelfRejected && (
              <Tooltip title="Xóa sản phẩm khỏi danh sách">
                <Popconfirm
                  title="Bạn có chắc chắn muốn xóa sản phẩm này?"
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => onDelete(record.id)}
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </Tooltip>
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
      pagination={{
        pageSize: 10,
        showSizeChanger: false,
        showTotal: (total) => `Tổng ${total} sản phẩm`,
      }}
      scroll={{ x: 1400 }}
      size="middle"
      onRow={onRow}
      rowClassName="table-row-hover"
    />
  );
};

export default ProductTable;
