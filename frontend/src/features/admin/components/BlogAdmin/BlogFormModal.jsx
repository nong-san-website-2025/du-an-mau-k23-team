import React, { useEffect, useState } from "react";
import { Drawer, Form, message, Button, Space } from "antd";
import { EditOutlined, FileAddOutlined } from "@ant-design/icons";
import BlogFormFields from "./BlogFormFields";
import { adminCreateBlog, adminUpdateBlog } from "../../../blog/api/blogApi";

export default function BlogFormDrawer({ visible, onClose, editing, fetchBlogs, categories }) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editing) {
        form.setFieldsValue({ 
          ...editing, 
          category: editing.category?.id || editing.category 
        });
        setFileList(
          editing.image
            ? [{ uid: "-1", name: "current-image.png", url: editing.image, status: "done" }]
            : []
        );
      } else {
        form.resetFields();
        setFileList([]);
      }
    }
  }, [visible, editing, form]);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      
      // Xử lý các field cơ bản
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      // Xử lý ảnh: Nếu có file mới (originFileObj) thì gửi file, nếu không thì giữ nguyên
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("image", fileList[0].originFileObj);
      } else if (fileList.length === 0 && !editing) {
        // Nếu tạo mới mà không có ảnh (tuỳ logic backend có bắt buộc không)
      }

      if (editing) {
        await adminUpdateBlog(editing.slug, formData);
        message.success("Cập nhật bài viết thành công!");
      } else {
        await adminCreateBlog(formData);
        message.success("Đăng bài viết mới thành công!");
      }

      onClose();
      fetchBlogs();
    } catch (error) {
      console.error("Error:", error);
      message.error(error.response?.data?.detail || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title={
        <Space>
          {editing ? <EditOutlined /> : <FileAddOutlined />}
          {editing ? `Chỉnh sửa: ${editing.title}` : "Soạn bài viết mới"}
        </Space>
      }
      width={900} // Rộng hơn để viết bài thoải mái
      onClose={onClose}
      open={visible}
      styles={{ body: { paddingBottom: 80 } }} // Chừa chỗ cho footer
      extra={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button onClick={() => form.submit()} type="primary" loading={submitting}>
            {editing ? "Lưu thay đổi" : "Xuất bản ngay"}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
      >
        <BlogFormFields
          form={form}
          fileList={fileList}
          setFileList={setFileList}
          categories={categories}
        />
      </Form>
    </Drawer>
  );
}