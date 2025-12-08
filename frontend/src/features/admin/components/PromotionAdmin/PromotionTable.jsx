import React from "react";
import { Table, Space, Typography } from "antd";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import StatusTag from "../../../../components/StatusTag"; // Import component tái sử dụng
import ButtonAction from "../../../../components/ButtonAction"; // Import component tái sử dụng

const { Text } = Typography;

export default function PromotionTable({ data, loading, onView, onEdit, onDelete }) {
  const columns = [
    {
      title: "Thông tin Voucher",
      dataIndex: "code",
      key: "info",
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong copyable>{record.code}</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>{record.title}</Text>
        </Space>
      ),
    },
    {
      title: "Loại",
      dataIndex: "voucher_type",
      key: "voucher_type",
      width: 120,
      align: "center",
      render: (val) => {
        // Mapping màu sắc dựa trên business logic
        const isFreeship = val === "freeship";
        return (
          <StatusTag 
            status={isFreeship ? "shipping" : "processing"} 
            label={isFreeship ? "FreeShip" : "Discount"} 
          />
        );
      },
    },
    {
      title: "Thời gian áp dụng",
      key: "time",
      width: 200,
      render: (_, record) => (
        <div style={{ fontSize: 13 }}>
          <div>BĐ: {record.start ? dayjs(record.start).format("DD/MM/YYYY HH:mm") : "--"}</div>
          <div>KT: {record.end ? dayjs(record.end).format("DD/MM/YYYY HH:mm") : "--"}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      width: 120,
      align: "center",
      render: (val) => (
        <StatusTag 
          status={val ? "active" : "locked"} 
          label={val ? "Đang chạy" : "Tạm dừng"} 
        />
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      align: "right",
      width: 120,
      render: (_, record) => {
        // Cấu hình danh sách nút bấm cho ButtonAction
        const actions = [
          {
            actionType: "view",
            icon: <EyeOutlined />,
            tooltip: "Xem chi tiết",
            onClick: onView,
          },
          {
            actionType: "edit",
            icon: <EditOutlined />,
            tooltip: "Chỉnh sửa",
            onClick: onEdit,
          },
          {
            actionType: "delete",
            icon: <DeleteOutlined />,
            tooltip: "Xóa voucher",
            confirm: {
              title: "Xác nhận xóa?",
              description: `Bạn có chắc muốn xóa voucher ${record.code}?`,
              okText: "Xóa ngay",
            },
            onClick: onDelete,
          },
        ];
        return <ButtonAction actions={actions} record={record} />;
      },
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: true }}
      scroll={{ x: 800 }} // Responsive cho mobile
    />
  );
}