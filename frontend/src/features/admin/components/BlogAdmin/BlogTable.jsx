import React from "react";
import { Table, Switch, Tag, Space, message, Typography, Image, Tooltip, Skeleton } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined, UserOutlined } from "@ant-design/icons";
import { adminDeleteBlog, adminTogglePublish } from "../../../blog/api/blogApi";

// Giả sử ButtonAction nằm cùng thư mục hoặc trong thư mục components chung
// Bạn nhớ sửa đường dẫn import cho đúng với project nhé
import ButtonAction from "../../../../components/ButtonAction"; 

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
    {
      title: "Lượt xem",
      dataIndex: "views", 
      width: 100,
      align: "center",
      render: (count) => (
        <Space>
          <EyeOutlined style={{ color: "#1890ff" }} />
          <Text strong>{count ? count.toLocaleString() : 0}</Text>
        </Space>
      ),
    },
    {
      title: "Tác giả",
      dataIndex: "author_name",
      align: "center",
      width: 150,
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
      render: (_, record) => (
        <ButtonAction
          record={record}
          actions={[
            {
              actionType: "edit",
              tooltip: "Chỉnh sửa",
              icon: <EditOutlined />,
              onClick: (r) => {
                setEditing(r);
                setDrawerVisible(true);
              },
            },
            {
              actionType: "delete",
              tooltip: "Xóa",
              icon: <DeleteOutlined />,
              confirm: {
                title: "Bạn có chắc muốn xóa?",
                description: "Hành động này không thể hoàn tác",
                okText: "Xóa",
                cancelText: "Hủy",
              },
              onClick: (r) => handleDelete(r.slug),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
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