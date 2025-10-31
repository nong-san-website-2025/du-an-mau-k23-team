import React, { useEffect, useState } from "react";
import {
  Input,
  Select,
  message,
  Spin,
  Modal,
  Descriptions,
  Button,
  Table,
  Dropdown,
  Menu,
  Space,
} from "antd";
import { EllipsisOutlined } from "@ant-design/icons";
import axios from "axios";
import AddCategoryWithSubModal from "../../components/ProductAdmin/Category/AddCategoryWithSubModal";
import AdminPageLayout from "../../components/AdminPageLayout"; // ← Đảm bảo đường dẫn đúng

const { Option } = Select;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

const CategoryManagementPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("products/categories/", {
        headers: getAuthHeaders(),
      });
      const raw = Array.isArray(res.data) ? res.data : res.data.results || [];

      const mapped = raw.map((cat) => ({
        key: `cat-${cat.id}`,
        id: cat.id,
        name: cat.name,
        type: "Category",
        status: cat.status,
        children: (cat.subcategories || []).map((sub) => ({
          key: `sub-${sub.id}`,
          id: sub.id,
          name: `${sub.name}`,
          type: "Subcategory",
          status: sub.status,
          product_count: sub.product_count || 0,
        })),
      }));

      setData(mapped);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredData = data.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleView = (record) => {
    setSelectedCategory(record);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setSelectedCategory(record);
    setAddModalVisible(true);
  };

  const handleDelete = async (record) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/products/categories/${record.id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Xoá danh mục thành công");
      fetchCategories();
    } catch (err) {
      console.error(err);
      message.error("Xoá thất bại");
    }
  };

  const columns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      width: 300,
      render: (text, record) =>
        record.type === "Category"
          ? text
          : `${text} (${record.product_count} sản phẩm)`,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 150,
      render: (type) => (type === "Category" ? "Danh mục cha" : "Danh mục con"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        let color = "red";
        let label = "Ngưng";
        if (status === "active") {
          color = "green";
          label = "Hoạt động";
        }
        return <span style={{ color }}>{label}</span>;
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 80,
      render: (_, record) => {
        const menu = (
          <Menu>
            <Menu.Item key="view" onClick={() => handleView(record)}>
              Xem
            </Menu.Item>
            <Menu.Item key="edit" onClick={() => handleEdit(record)}>
              Sửa
            </Menu.Item>
            <Menu.Item key="delete" onClick={() => handleDelete(record)} danger>
              Xoá
            </Menu.Item>
          </Menu>
        );

        return (
          <Dropdown overlay={menu} trigger={["click"]}>
            <Button icon={<EllipsisOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  // ✅ Toolbar cho AdminPageLayout
  const toolbar = (
    <Space wrap>
      <Input
        placeholder="Tìm kiếm theo tên danh mục"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: 300 }}
      />
      <Select
        placeholder="Lọc theo trạng thái"
        onChange={(value) => setStatusFilter(value)}
        style={{ width: 200 }}
        allowClear
      >
        <Option value="active">Hoạt động</Option>
        <Option value="inactive">Ngưng</Option>
      </Select>
      <Button type="primary" onClick={() => setAddModalVisible(true)}>
        + Thêm danh mục
      </Button>
    </Space>
  );

  return (
    <AdminPageLayout title="QUẢN LÝ DANH MỤC" extra={toolbar}>
      {loading ? (
        <Spin />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={false}
          size="small"
        />
      )}

      <AddCategoryWithSubModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSuccess={fetchCategories}
        category={selectedCategory}
      />

      {selectedCategory && (
        <Modal
          open={modalVisible}
          title={`Chi tiết: ${selectedCategory.name}`}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={600}
        >
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label="ID">
              {selectedCategory.id}
            </Descriptions.Item>
            <Descriptions.Item label="Tên">
              {selectedCategory.name}
            </Descriptions.Item>
            <Descriptions.Item label="Loại">
              {selectedCategory.type === "Category"
                ? "Danh mục cha"
                : "Danh mục con"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {selectedCategory.status === "active" ? "Hoạt động" : "Ngưng"}
            </Descriptions.Item>
          </Descriptions>
        </Modal>
      )}
    </AdminPageLayout>
  );
};

export default CategoryManagementPage;