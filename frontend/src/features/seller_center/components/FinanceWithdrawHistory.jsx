import React from "react";
import { Table } from "antd";

const columns = [
  { title: "Ngày rút", dataIndex: "date", key: "date" },
  { title: "Số tiền (VNĐ)", dataIndex: "amount", key: "amount" },
  { title: "Trạng thái", dataIndex: "status", key: "status" },
];

export default function FinanceWithdrawHistory({ data, loading }) {
  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{ pageSize: 5 }}
      title={() => "Lịch sử thanh toán từ sàn → người bán"}
    />
  );
}
