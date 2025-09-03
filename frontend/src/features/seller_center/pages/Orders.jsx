import React from "react";
import { Table, Tag } from "antd";

const dataSource = [
  { key: '1', orderId: "DH001", customer: "Nguyễn Văn A", status: "Mới", total: 50000 },
  { key: '2', orderId: "DH002", customer: "Trần Thị B", status: "Đang xử lý", total: 80000 },
];

const columns = [
  { title: "Mã đơn", dataIndex: "orderId", key: "orderId" },
  { title: "Khách hàng", dataIndex: "customer", key: "customer" },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    render: status => {
      let color = "blue";
      if (status === "Mới") color = "green";
      else if (status === "Đang xử lý") color = "orange";
      else if (status === "Hoàn thành") color = "gray";
      return <Tag color={color}>{status}</Tag>;
    }
  },
  { title: "Tổng tiền (VNĐ)", dataIndex: "total", key: "total" },
];

export default function Orders() {
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Quản lý đơn hàng</h2>
      <Table dataSource={dataSource} columns={columns} />
    </div>
  );
}
