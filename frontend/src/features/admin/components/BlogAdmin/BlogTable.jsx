import React from "react";
import { Table, Button, Switch, Popconfirm, Tag, Space, message } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { adminDeleteBlog, adminTogglePublish } from "../../../blog/api/blogApi";

export default function BlogTable({ blogs, loading, pagination, onChange, fetchBlogs, setEditing, setModalVisible }) {
  const handleDelete = async (slug) => {
    try {
      await adminDeleteBlog(slug);
      message.success("Đã xóa bài viết");
      fetchBlogs(pagination.current, pagination.pageSize);
    } catch {
      message.error("Xóa thất bại");
    }
  };

  const togglePublish = async (slug, checked) => {
    try {
      await adminTogglePublish(slug, checked);
      message.success(checked ? "Đã xuất bản" : "Đã gỡ xuất bản");
      fetchBlogs(pagination.current, pagination.pageSize);
    } catch {
      message.error("Lỗi khi thay đổi trạng thái xuất bản");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "Tiêu đề", dataIndex: "title" },
    { title: "Tác giả", dataIndex: "author_name", width: 140 },
    { title: "Danh mục", dataIndex: "category_name", render: (name) => <Tag color="blue">{name}</Tag>, width: 120 },
    { title: "Lượt xem", dataIndex: "views", align: "center", width: 100 },
    {
      title: "Xuất bản",
      dataIndex: "is_published",
      align: "center",
      width: 110,
      render: (p, r) => <Switch checked={p} onChange={(checked) => togglePublish(r.slug, checked)} />,
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      render: (d) => new Date(d).toLocaleString("vi-VN"),
      width: 160,
    },
    {
      title: "Hành động",
      key: "action",
      width: 130,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); setModalVisible(true); }} />
          <Popconfirm title="Xóa bài viết?" onConfirm={() => handleDelete(r.slug)} okText="Xóa" cancelText="Hủy">
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={blogs}
      pagination={pagination}
      onChange={onChange}
    />
  );
}
