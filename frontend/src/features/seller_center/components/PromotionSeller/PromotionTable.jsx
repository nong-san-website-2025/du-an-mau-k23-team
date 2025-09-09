import React from "react";
import { Table, Dropdown, Menu, Button, Tag } from "antd";
import { MoreOutlined } from "@ant-design/icons";

const PromotionTable = ({ promotions, loading, getStatus, onEdit, onDelete, onView }) => {
  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 50, align: "center" },
    { title: "Code", dataIndex: "code", key: "code", width: 120, align: "center" },
    { title: "Tên khuyến mãi", dataIndex: "name", key: "name" },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (t) => (t === "Promotion" ? "Giảm tiền" : t === "Flash Sale" ? "Giảm %" : t === "Voucher" ? "Freeship" : t),
    },
    { title: "Điều kiện", dataIndex: "condition", key: "condition", render: (v) => v || "-" },
    {
      title: "Ngày bắt đầu",
      dataIndex: "start",
      key: "start",
      width: 120,
      align: "center",
      render: (d) => (d ? new Date(d).toLocaleDateString() : "-"),
    },
    {
      title: "Ngày kết thúc",
      dataIndex: "end",
      key: "end",
      width: 120,
      align: "center",
      render: (d) => (d ? new Date(d).toLocaleDateString() : "-"),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 100,
      align: "center",
      render: (_, record) => {
        const status = getStatus(record);
        const color = status === "Đang chạy" ? "green" : status === "Sắp diễn ra" ? "orange" : "default";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record) => {
        const menu = (
          <Menu>
            <Menu.Item key="edit" onClick={() => onEdit(record)}>Sửa</Menu.Item>
            <Menu.Item key="delete" onClick={() => onDelete(record)}>Xóa</Menu.Item>
            <Menu.Item key="view" onClick={() => onView(record)}>Xem chi tiết</Menu.Item>
          </Menu>
        );
        return (
          <Dropdown overlay={menu} trigger={["click"]}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return <Table columns={columns} dataSource={promotions} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />;
};

export default PromotionTable;
