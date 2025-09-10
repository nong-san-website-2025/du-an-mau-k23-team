import React from "react";
import { Table, Dropdown, Menu, Button, Tag } from "antd";
import { MoreOutlined } from "@ant-design/icons";

const nowrap = { whiteSpace: "nowrap" };

const PromotionTable = ({ promotions, loading, getStatus, onEdit, onDelete, onView }) => {
  const [current, setCurrent] = React.useState(1);
  const pageSize = 8;

  const columns = [
    {
      title: <span style={nowrap}>ID</span>,
      key: "index",
      width: 60,
      align: "left",
      render: (_t, _r, index) => (current - 1) * pageSize + index + 1,
    },
    { title: <span style={nowrap}>Code</span>, dataIndex: "code", key: "code", width: 120, align: "left" },
    { title: <span style={nowrap}>Tên khuyến mãi</span>, dataIndex: "name", key: "name", align: "left", ellipsis: true },
    {
      title: <span style={nowrap}>Loại</span>,
      dataIndex: "type",
      key: "type",
      width: 120,
      align: "left",
      render: (t) => (t === "Promotion" ? "Giảm tiền" : t === "Flash Sale" ? "Giảm %" : t === "Voucher" ? "Freeship" : t),
    },
    { title: <span style={nowrap}>Điều kiện</span>, dataIndex: "condition", key: "condition", align: "left", render: (v) => v || "-", ellipsis: true },
    {
      title: <span style={nowrap}>Ngày bắt đầu</span>,
      dataIndex: "start",
      key: "start",
      width: 140,
      align: "left",
      render: (d) => (d ? new Date(d).toLocaleDateString() : "-"),
    },
    {
      title: <span style={nowrap}>Ngày kết thúc</span>,
      dataIndex: "end",
      key: "end",
      width: 140,
      align: "left",
      render: (d) => (d ? new Date(d).toLocaleDateString() : "-"),
    },
    {
      title: <span style={nowrap}>Trạng thái</span>,
      key: "status",
      width: 120,
      align: "left",
      render: (_, record) => {
        const status = getStatus(record);
        const color = status === "Đang chạy" ? "green" : status === "Sắp diễn ra" ? "orange" : "default";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: <span style={nowrap}>Hành động</span>,
      key: "actions",
      width: 120,
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

  return (
    <Table
      columns={columns}
      dataSource={promotions}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize, current, onChange: (p) => setCurrent(p) }}
      scroll={{ x: "max-content" }}
    />
  );
};

export default PromotionTable;