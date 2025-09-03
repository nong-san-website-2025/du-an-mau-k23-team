import React from "react";
import { Table } from "antd";

const dataSource = [
  { key: 1, date: "2025-08-27", amount: 500000, status: "Đã thanh toán" },
  { key: 2, date: "2025-08-26", amount: 300000, status: "Chờ thanh toán" },
];

const columns = [
  { title: "Ngày", dataIndex: "date", key: "date" },
  { title: "Số tiền (VNĐ)", dataIndex: "amount", key: "amount" },
  { title: "Trạng thái", dataIndex: "status", key: "status" },
];

export default function Finance() {
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Doanh thu & Thanh toán</h2>
      <Table dataSource={dataSource} columns={columns} />
    </div>
  );
}
