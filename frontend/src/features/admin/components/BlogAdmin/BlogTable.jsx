import React from "react";
import { Table, Button, Switch, Popconfirm, Tag, Space, message, Typography, Image, Tooltip, Skeleton } from "antd";
// Thêm UserOutlined cho tác giả để dành EyeOutlined cho lượt xem
import { EditOutlined, DeleteOutlined, EyeOutlined, UserOutlined } from "@ant-design/icons";
import { adminDeleteBlog, adminTogglePublish } from "../../../blog/api/blogApi";

const { Text } = Typography;

export default function BlogTable({ blogs, loading, pagination, onChange, fetchBlogs, setEditing, setDrawerVisible }) {

  const handleDelete = async (slug) => {
    try {
      await adminDeleteBlog(slug);
      message.success("Đã xóa bài viết");
      fetchBlogs();
    } catch {
      message.error("Xóa thất bại");
    }
  };

  const togglePublish = async (slug, checked) => {
    try {
      await adminTogglePublish(slug, checked);
      message.success(checked ? "Đã xuất bản" : "Đã chuyển về nháp");
      fetchBlogs();
    } catch {
      message.error("Lỗi cập nhật trạng thái");
    }
  };

  const columns = [
    {
      title: "Ảnh",
      dataIndex: "image",
      width: 80,
      align: "center",
      render: (src) => {
        if (src) {
          return (
            <Image
              src={src}
              width={50}
              height={50}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              fallback="https://gw.alipayobjects.com/zos/antfincdn/aPkFc8Sj7n/method-draw-image.svg"
            />
          );
        }
        return (
          <Skeleton.Image
            active={false}
            style={{ width: 50, height: 50, borderRadius: 4, minWidth: 50 }}
          />
        );
      }
    },
    {
      title: "Thông tin bài viết",
      dataIndex: "title",
      render: (text, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text strong style={{ fontSize: 15 }} ellipsis={{ tooltip: text }}>
            {text}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Slug: {record.slug}
          </Text>
        </div>
      )
    },
    {
      title: "Danh mục",
      dataIndex: "category_name",
      width: 150,
      render: (name) => <Tag color="cyan">{name}</Tag>
    },
    // --- CỘT LƯỢT XEM MỚI ---
    {
      title: "Lượt xem",
      dataIndex: "views", // Đảm bảo key này khớp với API trả về (vd: views, view_count)
      width: 100,
      align: "center",
      render: (count) => (
        <Space>
          <Text strong>{count ? count.toLocaleString() : 0}</Text>
        </Space>
      ),
    },
    // ------------------------
    {
      title: "Tác giả",
      dataIndex: "author_name",
      align: "center",
      width: 150,
      // Đổi icon sang UserOutlined cho đúng ngữ cảnh
      render: (name) => <Tag icon={<UserOutlined />} color="default">{name}</Tag> 
    },
    {
      title: "Trạng thái",
      dataIndex: "is_published",
      align: "center",
      width: 120,
      render: (p, r) => (
        <Tooltip title={p ? "Đang hiển thị" : "Đang ẩn"}>
          <Switch
            checkedChildren="Hiện"
            unCheckedChildren="Ẩn"
            checked={p}
            onChange={(checked) => togglePublish(r.slug, checked)}
          />
        </Tooltip>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      width: 140,
      align: "right",
      render: (d) => <Text type="secondary" style={{ fontSize: 13 }}>{new Date(d).toLocaleDateString("vi-VN")}</Text>,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, r) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
              onClick={() => { setEditing(r); setDrawerVisible(true); }}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc muốn xóa?"
            description="Hành động này không thể hoàn tác"
            onConfirm={() => handleDelete(r.slug)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id" // Hoặc rowKey="slug" nếu id không duy nhất
      loading={loading}
      columns={columns}
      dataSource={blogs}
      pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => `Tổng ${total} bài` }}
      onChange={onChange}
      bordered
      size="middle"
      scroll={{ x: 1000 }}
    />
  );
}