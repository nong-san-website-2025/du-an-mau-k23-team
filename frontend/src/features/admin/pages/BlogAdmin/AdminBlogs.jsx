import React, { useEffect, useState, useCallback } from "react";
import { Button, Input, Space, message, Row, Col, Modal } from "antd";
import { PlusOutlined, SearchOutlined, ReloadOutlined, DeleteOutlined } from "@ant-design/icons";
import AdminPageLayout from "../../components/AdminPageLayout";
import BlogTable from "../../components/BlogAdmin/BlogTable";
import BlogFormDrawer from "../../components/BlogAdmin/BlogFormModal"; 
import CategoryModal from "../../components/BlogAdmin/CategoryModal";
import { adminFetchBlogs, fetchCategories, adminDeleteBlog } from "../../../blog/api/blogApi";

const AdminBlogs = () => {
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 480px)").matches;
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);

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

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) {
      message.warning("Vui lòng chọn ít nhất một bài viết để xóa");
      return;
    }

    Modal.confirm({
      title: `Xóa ${selectedRows.length} bài viết?`,
      description: "Hành động này không thể hoàn tác",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        setLoading(true);
        try {
          const selectedBlogs = blogs.filter(blog => selectedRows.includes(blog.id));
          await Promise.all(selectedBlogs.map(blog => adminDeleteBlog(blog.slug)));
          message.success(`Đã xóa ${selectedRows.length} bài viết`);
          setSelectedRows([]);
          loadBlogs(pagination.current, pagination.pageSize, searchText);
        } catch {
          message.error("Xóa thất bại, vui lòng thử lại");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <AdminPageLayout
      title="QUẢN LÝ BÀI VIẾT"
      extra={
        <Space wrap style={{ rowGap: 8 }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={openCreate}
            size={isMobile ? "small" : "middle"}
            style={{ whiteSpace: 'nowrap' }}
          >
            {isMobile ? "Viết mới" : "Viết bài mới"}
          </Button>
          <Button 
            onClick={() => setCategoryModalVisible(true)}
            size={isMobile ? "small" : "middle"}
            style={{ whiteSpace: 'nowrap' }}
          >
            {isMobile ? "Danh mục" : "Quản lý Danh mục"}
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={handleBulkDelete}
            disabled={selectedRows.length === 0}
            size={isMobile ? "small" : "middle"}
            style={{ whiteSpace: 'nowrap' }}
          >
            {`Xóa (${selectedRows.length})`}
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => loadBlogs(pagination.current)}
            size={isMobile ? "small" : "middle"}
            style={{ whiteSpace: 'nowrap' }}
          >
            Làm mới
          </Button>
        </Space>
      }
    >
      {/* Thanh công cụ tìm kiếm */}
      <Row style={{ marginBottom: 16 }}>
        <Col xs={24} sm={16} md={8}>
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
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
      />

      <BlogFormDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        editing={editing}
        fetchBlogs={() => {
          setSelectedRows([]);
          loadBlogs(pagination.current, pagination.pageSize);
        }}
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