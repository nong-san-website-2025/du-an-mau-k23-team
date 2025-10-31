import React from "react";
import { Table } from "antd";
import SellerStatusTag from "./SellerStatusTag";
import SellerActions from "./SellerActions";
import dayjs from "dayjs";

const SellerTable = ({ data, onApprove, onReject, onView, onLock }) => {
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
      title: "Tên cửa hàng",
      dataIndex: "store_name",
      key: "store_name",
      width: 250,
      sorter: (a, b) => a.store_name.localeCompare(b.store_name),
    },
    {
      title: "Người đăng ký",
      dataIndex: "owner_username",
      key: "owner_username",
      width: 150,
      sorter: (a, b) =>
        (a.owner_username || "").localeCompare(b.owner_username || ""),
    },
    {
      title: "Email",
      dataIndex: "user_email",
      key: "user_email",
      width: 220,
      sorter: (a, b) =>
        (a.user_email || "").localeCompare(b.user_email || ""),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => <SellerStatusTag status={status} />,
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      align: "center",
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (date) =>
        date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "—",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      align: "center",
    },
    {
      title: "Hành động",
      key: "action",
      width: 90,
      render: (_, record) => (
        <SellerActions
          record={record}
          onApprove={onApprove}
          onReject={onReject}
          onView={onView}
          onLock={onLock}
        />
      ),
      align: "center",
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      bordered
      pagination={{ pageSize: 5 }}
      scroll={{ x: 1200 }}
      size="small"
    />
  );
};

export default SellerTable;
