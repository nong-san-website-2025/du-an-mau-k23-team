import React, { useState } from "react";
import { Table, Tooltip, Image, Skeleton, Tag, Space, Typography } from "antd";
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  LockOutlined,
  UnlockOutlined,
  SyncOutlined,      // Icon Cập nhật
  PlusCircleOutlined, // Icon Mới
  DiffOutlined,      // Icon So sánh
} from "@ant-design/icons";
import dayjs from "dayjs";
import ProductStatusTag from "./ProductStatusTag"; // Component tag trạng thái cũ của bạn
import ButtonAction from "../../../../../components/ButtonAction"; // Component nút cũ của bạn
import { intcomma } from "../../../../../utils/format";

const { Text } = Typography;

const ProductTable = ({
  data,
  onApprove,
  onReject,
  onView,
  onToggleBan,
  onCompare,
  selectedRowKeys,
  setSelectedRowKeys,
  onRow,
}) => {
  const [selectedColumns] = useState([
    "image", "name", "category", "seller", "price", "status", "created_at", "action"
  ]);

  // Helper: Xác định đây là hàng Mới hay hàng Cập nhật
  const getRequestType = (record) => {
    if (record.status === "pending_update") return "pending_update";
    if (record.status !== "pending") return null;
    // Nếu updated_at > created_at quá 5 phút -> coi là Cập nhật
    const isUpdate = dayjs(record.updated_at).diff(dayjs(record.created_at), 'minute') > 5;
    return isUpdate ? "update" : "new";
  };

  const columns = [
    {
      title: "Ảnh",
      key: "image",
      dataIndex: "image",
      width: 80,
      align: "center",
      render: (_, record) => {
        const imgUrl = record.main_image?.image || (record.images?.[0]?.image);
        return (
          <div onClick={(e) => e.stopPropagation()} style={{ width: 60, height: 40, margin: "0 auto" }}>
            {imgUrl ? (
              <Image
                src={imgUrl}
                width={60}
                height={40}
                style={{ objectFit: "cover", borderRadius: 4 }}
                fallback="https://placehold.co/60x40?text=No+Image"
              />
            ) : (
              <Skeleton.Image active={false} style={{ width: 60, height: 40 }} />
            )}
          </div>
        );
      },
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      width: 280,
      render: (text, record) => {
        const reqType = getRequestType(record);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            {/* Hiển thị Tag phân loại nếu đang Pending */}
            {reqType === 'pending_update' && (
              <Tag color="orange" style={{ marginBottom: 4, marginRight: 0, fontSize: 11 }}>
                <DiffOutlined /> Chờ duyệt cập nhật
              </Tag>
            )}
            {reqType === 'update' && (
              <Tag color="warning" style={{ marginBottom: 4, marginRight: 0, fontSize: 11 }}>
                <SyncOutlined  /> Cập nhật lại
              </Tag>
            )}
            {reqType === 'new' && (
               <Tag color="cyan" style={{ marginBottom: 4, marginRight: 0, fontSize: 11 }}>
                 <PlusCircleOutlined /> Mới đăng
               </Tag>
             )}
            
            <Tooltip title={text}>
              <Text strong style={{ fontSize: 14, lineHeight: 1.2 }}>{text}</Text>
            </Tooltip>

            {/* Hiển thị thời gian */}
            <Text type="secondary" style={{ fontSize: 11, marginTop: 2 }}>
              {reqType === 'update' 
                ? `Sửa: ${dayjs(record.updated_at).format("HH:mm DD/MM")}`
                : `Tạo: ${dayjs(record.created_at).format("HH:mm DD/MM")}`
              }
            </Text>
          </div>
        );
      },
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
    },
    {
      title: "Danh mục & Shop",
      key: "category",
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
            <Text style={{fontSize: 13}}>{record.category_name || "—"}</Text>
            <Text type="secondary" style={{fontSize: 12}}>
                Store: {record.seller?.store_name || record.seller_name}
            </Text>
        </Space>
      ),
    },
    {
      title: "Giá bán",
      dataIndex: "price",
      key: "price",
      width: 120,
      align: "right",
      render: (_, record) => (
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <Text delete type="secondary" style={{fontSize: 11}}>{intcomma(record.original_price)}</Text>
            <Text strong type="danger">{intcomma(record.discounted_price || record.price)} ₫</Text>
          </div>
      ),
      sorter: (a, b) => (a.discounted_price || 0) - (b.discounted_price || 0),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 140,
      align: "center",
      render: (_, record) => <ProductStatusTag status={record.status} />,
    },
    {
      title: "Hành động",
      key: "action",
      width: 110,
      align: "center",
      fixed: "right",
      render: (_, record) => {
        const actions = [
          {
            actionType: "view",
            icon: <EyeOutlined />,
            tooltip: "Xem chi tiết",
            onClick: onView,
            show: true,
          },
          {
            actionType: "compare",
            icon: <DiffOutlined />,
            tooltip: "So sánh thay đổi",
            onClick: onCompare,
            show: record.status === "pending_update",
          },
          {
            actionType: "approve",
            icon: <CheckOutlined />,
            tooltip: "Duyệt",
            show: ["pending", "pending_update"].includes(record.status),
            confirm: { title: "Duyệt sản phẩm này?", okText: "Duyệt" },
            onClick: onApprove,
          },
          {
            actionType: "reject",
            icon: <CloseOutlined />,
            tooltip: "Từ chối",
            show: ["pending", "pending_update"].includes(record.status),
            confirm: { title: "Từ chối sản phẩm?", okText: "Từ chối", isDanger: true },
            onClick: onReject,
          },
          {
            actionType: record.status === "banned" ? "unlock" : "lock",
            icon: record.status === "banned" ? <UnlockOutlined /> : <LockOutlined />,
            tooltip: record.status === "banned" ? "Mở khóa" : "Khóa",
            show: ["approved", "banned"].includes(record.status),
            confirm: { title: "Xác nhận đổi trạng thái?", okText: "Đồng ý" },
            onClick: onToggleBan,
          },
        ];
        return <ButtonAction actions={actions} record={record} />;
      },
    },
  ];

  return (
    <Table
      rowKey="id"
      bordered
      size="small"
      dataSource={data}
      columns={columns.filter(c => selectedColumns.includes(c.key))}
      rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
      onRow={onRow}
      pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} sản phẩm` }}
      scroll={{ x: 1000 }}
      sticky
    />
  );
};

export default ProductTable;