import React, { useEffect, useState, useCallback } from "react";
import { Button, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import AdminPageLayout from "../../components/AdminPageLayout";
import BlogTable from "../../components/BlogAdmin/BlogTable";
import BlogFormModal from "../../components/BlogAdmin/BlogFormModal";
import { adminFetchBlogs, fetchCategories } from "../../../blog/api/blogApi";

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const loadBlogs = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const { data } = await adminFetchBlogs(page, pageSize);
      // Backend may return either a paginated object { count, results }
      // or a plain array of blog posts. Handle both formats.
      if (Array.isArray(data)) {
        setBlogs(data);
        setPagination({ current: page, pageSize, total: data.length });
      } else if (data && Array.isArray(data.results)) {
        setBlogs(data.results);
        setPagination({ current: page, pageSize, total: data.count });
      } else {
        // Fallback: set to empty list
        setBlogs([]);
        setPagination({ current: page, pageSize, total: 0 });
      }
    } catch {
      message.error("Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await fetchCategories();
      setCategories(data);
    } catch {
      message.error("Không thể tải danh mục");
    }
  }, []);

  useEffect(() => {
    loadBlogs();
    loadCategories();
  }, [loadBlogs, loadCategories]);

  const handleTableChange = (p) => loadBlogs(p.current, p.pageSize);

  return (
    <AdminPageLayout
      title="QUẢN LÝ BÀI VIẾT"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalVisible(true); }}>
          Viết bài mới
        </Button>
      }
    >
      <BlogTable
        blogs={blogs}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        fetchBlogs={loadBlogs}
        setEditing={setEditing}
        setModalVisible={setModalVisible}
      />
      <BlogFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        editing={editing}
        fetchBlogs={loadBlogs}
        pagination={pagination}
        categories={categories}
      />
    </AdminPageLayout>
  );
};

export default AdminBlogs;
