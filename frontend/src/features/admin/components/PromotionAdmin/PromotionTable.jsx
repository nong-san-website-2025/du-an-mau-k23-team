// src/features/admin/promotions/components/PromotionTable.jsx
import React from "react";
import { Table, Tag, Dropdown, Button, Menu } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

export default function PromotionTable({ data, loading, onView, onDelete }) {
  const actionMenu = (record) => (
    <Menu>
      <Menu.Item key="view" onClick={() => onView(record)}>
        👁 Xem chi tiết
      </Menu.Item>
      <Menu.Item key="delete" danger onClick={() => onDelete(record)}>
        🗑 Xóa
      </Menu.Item>
    </Menu>
  );

  const columns = [
    { title: "Mã", dataIndex: "code", key: "code" },
    { title: "Tên", dataIndex: "title", key: "title" },
    {
      title: "Loại voucher",
      dataIndex: "voucher_type",
      key: "voucher_type",
      render: (val) =>
        val === "freeship" ? <Tag>Miễn ship</Tag> : <Tag>Thường</Tag>,
    },
    {
      title: "Bắt đầu",
      dataIndex: "start",
      key: "start",
      render: (val) => (val ? dayjs(val).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Kết thúc",
      dataIndex: "end",
      key: "end",
      render: (val) => (val ? dayjs(val).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      render: (val) =>
        val ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Tắt</Tag>,
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Dropdown overlay={actionMenu(record)} trigger={["click"]}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{ pageSize: 10 }}
      bordered
    />
  );
}
