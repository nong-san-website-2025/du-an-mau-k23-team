import React, { useState } from "react";
import { Table, Tooltip, Image, Skeleton } from "antd";
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import ProductStatusTag from "./ProductStatusTag";
import "../../../styles/AdminPageLayout.css";

// Import file ButtonAction từ đường dẫn của bạn
import ButtonAction from "../../../../../components/ButtonAction";
import { intcomma } from "../../../../../utils/format";

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
    // --- Cột Ảnh (có Skeleton) ---
    {
      title: "Ảnh",
      key: "image",
      dataIndex: "image",
      width: 70,
      align: "center",
      render: (_, record) => {
        const productImage =
          record.main_image?.image ||
          (record.images?.length > 0 ? record.images[0].image : null);
        const imgWidth = 60;
        const imgHeight = 40;

        return (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: imgWidth,
              height: imgHeight,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          >
            {productImage ? (
              <Image
                src={productImage}
                alt={record.name}
                width={imgWidth}
                height={imgHeight}
                style={{ objectFit: "cover", borderRadius: 4 }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/60x40/f5f5f5/999999?text=No+Image";
                }}
                fallback="https://placehold.co/60x40/f5f5f5/999999?text=Error"
                preview={true}
              />
            ) : (
              <Skeleton.Image
                active={false}
                style={{ width: imgWidth, height: imgHeight, borderRadius: 4 }}
              />
            )}
          </div>
        );
      },
    },
    // --- Các cột thông tin cơ bản ---
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      width: 240,
      ellipsis: { showTitle: false },
      render: (text) => (
        <Tooltip title={text}>
          <span style={{ fontWeight: 500 }}>{text}</span>
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
      sorter: (a, b) => (a.category_name || "").localeCompare(b.category_name || ""),
    },
    {
      title: "Người bán",
      key: "seller",
      dataIndex: "seller",
      width: 150,
      align: "center",
      render: (_, record) => {
        const text = record.seller?.store_name || record.seller_name || "—";
        return (
          <Tooltip title={text}>
            <span style={{ display: "inline-block", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {text}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Giá bán",
      dataIndex: "price",
      key: "price",
      width: 120,
      align: "right",
      render: (price) => (price ? `${intcomma(price)} đ` : "—"),
      sorter: (a, b) => a.price - b.price,
    }
    ,
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
      width: 180,
      align: "center",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "—"),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    // --- CỘT HÀNH ĐỘNG (Cấu hình nút ở đây) ---
    {
      title: "Hành động",
      key: "action",
      width: 100,
      align: "center",
      fixed: "right",
      render: (_, record) => {
        // Cấu hình danh sách nút dựa trên record hiện tại
        const actions = [
          {
            actionType: "view",
            icon: <EyeOutlined />,
            tooltip: "Xem chi tiết",
            onClick: onView,
            show: true,
          },
          {
            actionType: "approve",
            icon: <CheckOutlined />,
            tooltip: "Duyệt sản phẩm",
            // Chỉ cho phép duyệt nếu trạng thái là pending
            show: record.status === "pending",
            confirm: {
              title: "Duyệt sản phẩm này?",
              okText: "Duyệt",
            },
            onClick: onApprove,
          },
          {
            actionType: "reject",
            icon: <CloseOutlined />,
            tooltip: "Từ chối sản phẩm",
            // Chỉ cho phép từ chối nếu trạng thái là pending
            show: record.status === "pending",
            confirm: {
              title: "Từ chối sản phẩm này?",
              okText: "Từ chối",
            },
            onClick: onReject,
          },
          {
            actionType: record.status === "banned" ? "unlock" : "lock",
            icon: record.status === "banned" ? <UnlockOutlined /> : <LockOutlined />,
            tooltip: record.status === "banned" ? "Mở khóa" : "Khóa sản phẩm",
            // Chỉ cho phép khoá/mở khoá nếu sản phẩm đã duyệt
            show: record.status === "approved" || record.status === "banned",
            confirm: {
              title: record.status === "banned"
                ? "Mở khóa sản phẩm này?"
                : "Khóa sản phẩm này?",
              okText: "Đồng ý",
            },
            onClick: onToggleBan,
          },
        ];

        return <ButtonAction actions={actions} record={record} />;
      },
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
      scroll={{ x: "max-content" }}
      sticky
      rowClassName="table-row"
    />
  );
};

export default ProductTable;