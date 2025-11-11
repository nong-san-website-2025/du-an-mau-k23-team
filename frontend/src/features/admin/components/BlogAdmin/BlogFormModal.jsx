import React, { useEffect, useState } from "react";
import { Modal, Form, message, Divider } from "antd";
import { FileAddOutlined, EditOutlined, InfoCircleOutlined } from "@ant-design/icons";
import BlogFormFields from "./BlogFormFields";
import { adminCreateBlog, adminUpdateBlog } from "../../../blog/api/blogApi";

export default function BlogFormModal({ visible, onClose, editing, fetchBlogs, pagination, categories }) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    if (editing) {
      form.setFieldsValue({ ...editing, category: editing.category?.id });
      setFileList(
        editing.image
          ? [{ uid: "-1", name: editing.image.split("/").pop(), url: editing.image, status: "done" }]
          : []
      );
    } else {
      form.resetFields();
      setFileList([]);
    }
  }, [editing, form]);

  const onFinish = async (values) => {
    try {
      // Form validation
      if (!values.category) {
        message.error("Vui lòng chọn danh mục");
        return;
      }

      const formData = new FormData();

      // Append form values
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      // Add image if exists
      if (fileList[0]?.originFileObj) {
        formData.append("image", fileList[0].originFileObj);
      }

      // Send to backend
      if (editing) {
        await adminUpdateBlog(editing.slug, formData);
      } else {
        await adminCreateBlog(formData);
      }

      message.success(editing ? "Cập nhật thành công" : "Đã thêm bài mới");
      onClose();
      fetchBlogs(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error("Error:", error);
      message.error("Thao tác thất bại: " + error.message);
    }
  };

  return (
    <Modal
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {editing ? <EditOutlined /> : <FileAddOutlined />}
          {editing ? "Chỉnh sửa bài viết" : "Viết bài mới"}
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      destroyOnClose
      styles={{
        body: { maxHeight: "75vh", overflowY: "auto", background: "#fafafa", borderRadius: 8 }
      }}
      style={{ top: 20 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onSubmit={e => e.preventDefault()}
        preserve={false}
        style={{ background: "#fff", padding: 24, borderRadius: 12 }}
      >
        <Divider orientation="left">
          <InfoCircleOutlined style={{ marginRight: 6, color: "#1890ff" }} />
          Thông tin bài viết
        </Divider>
        <BlogFormFields
          form={form}
          fileList={fileList}
          setFileList={setFileList}
          categories={categories}
          onClose={onClose}
          editing={editing}
        />
      </Form>
    </Modal>
  );
}
