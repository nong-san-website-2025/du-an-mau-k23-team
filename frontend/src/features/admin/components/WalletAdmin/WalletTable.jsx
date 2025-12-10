import React from "react";
import { Table, Button, Tooltip } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "../../styles/AdminPageLayout.css";

const WalletTable = ({ data, onView, onApprovePending }) => {
  const columns = [
    {
      title: "ID Seller",
      dataIndex: "seller_id",
      key: "seller_id",
      width: 100,
      sorter: (a, b) => a.seller_id - b.seller_id,
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
      title: "Số dư khả dụng",
      dataIndex: "balance",
      key: "balance",
      width: 150,
      render: (balance) => `${balance?.toLocaleString() || 0} VND`,
      sorter: (a, b) => (a.balance || 0) - (b.balance || 0),
      align: "right",
    },
    {
      title: "Số dư chờ duyệt",
      dataIndex: "pending_balance",
      key: "pending_balance",
      width: 150,
      render: (pending) => `${pending?.toLocaleString() || 0} VND`,
      sorter: (a, b) => (a.pending_balance || 0) - (b.pending_balance || 0),
      align: "right",
    },
    {
      title: "Tổng số dư",
      key: "total",
      width: 150,
      render: (_, record) => `${((record.balance || 0) + (record.pending_balance || 0)).toLocaleString()} VND`,
      sorter: (a, b) => ((a.balance || 0) + (a.pending_balance || 0)) - ((b.balance || 0) + (b.pending_balance || 0)),
      align: "right",
    },
    {
      title: "Cập nhật cuối",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 160,
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "—"),
      sorter: (a, b) => new Date(a.updated_at || 0) - new Date(b.updated_at || 0),
      align: "center",
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="seller_id"
      bordered
      pagination={{ pageSize: 10 }}
      scroll={{ x: 1200 }}
      size="small"
      rowClassName="table-row"
      onRow={(record) => ({
        onClick: () => onView && onView(record),
        style: { cursor: "pointer" },
      })}
    />
  );
};

export default WalletTable;