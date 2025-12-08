import React, { useEffect, useState, useCallback } from "react";
import { Button, Input, Space, message, Row, Col } from "antd";
import { PlusOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import AdminPageLayout from "../../components/AdminPageLayout";
import BlogTable from "../../components/BlogAdmin/BlogTable";
import BlogFormDrawer from "../../components/BlogAdmin/BlogFormModal"; 
import CategoryModal from "../../components/BlogAdmin/CategoryModal";
import { adminFetchBlogs, fetchCategories } from "../../../blog/api/blogApi";

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState("");

  const loadBlogs = useCallback(async (page = 1, pageSize = 10, search = "") => {
    setLoading(true);
    try {
      // Giả sử API hỗ trợ tham số search, nếu không bạn có thể lọc client-side
      const { data } = await adminFetchBlogs(page, pageSize, search);
      
      let list = [];
      let total = 0;

      if (Array.isArray(data)) {
        list = data;
        total = data.length;
      } else if (data && Array.isArray(data.results)) {
        list = data.results;
        total = data.count;
      }

      setBlogs(list);
      setPagination({ current: page, pageSize, total });
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
    loadBlogs(1, 10, searchText);
    loadCategories();
  }, [loadBlogs, loadCategories]); // Bỏ searchText ra khỏi dep array để tránh call api liên tục khi gõ

  // Xử lý tìm kiếm khi nhấn Enter hoặc bấm nút tìm
  const handleSearch = () => {
    loadBlogs(1, pagination.pageSize, searchText);
  };

  const handleTableChange = (p) => loadBlogs(p.current, p.pageSize, searchText);

  const openCreate = () => {
    setEditing(null);
    setDrawerVisible(true);
  };

  return (
    <AdminPageLayout
      title="QUẢN LÝ BÀI VIẾT"
      extra={
        <Space>
           <Button icon={<ReloadOutlined />} onClick={() => loadBlogs(pagination.current)}>
            Làm mới
          </Button>
          <Button onClick={() => setCategoryModalVisible(true)}>
            Quản lý Danh mục
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Viết bài mới
          </Button>
        </Space>
      }
    >
      {/* Thanh công cụ tìm kiếm */}
      <Row style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Input 
            placeholder="Tìm kiếm bài viết..." 
            prefix={<SearchOutlined />} 
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
          />
        </Col>
      </Row>

      <BlogTable
        blogs={blogs}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        fetchBlogs={() => loadBlogs(pagination.current, pagination.pageSize)}
        setEditing={setEditing}
        setDrawerVisible={setDrawerVisible}
      />

      <BlogFormDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        editing={editing}
        fetchBlogs={() => loadBlogs(pagination.current, pagination.pageSize)}
        categories={categories}
      />

      <CategoryModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        categories={categories}
        onCategoriesUpdate={setCategories}
        loading={loading}
      />
    </AdminPageLayout>
  );
};

export default AdminBlogs;