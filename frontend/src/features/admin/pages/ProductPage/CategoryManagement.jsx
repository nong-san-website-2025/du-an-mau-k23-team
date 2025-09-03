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
} from "antd";
import { EllipsisOutlined } from "@ant-design/icons";
import axios from "axios";
import AddCategoryWithSubModal from "../../components/ProductAdmin/Category/AddCategoryWithSubModal";

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

  // bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // modal chi tiết
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [addModalVisible, setAddModalVisible] = useState(false);

  // gọi API lấy danh mục
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("products/categories/", {
        headers: getAuthHeaders(),
      });
      const raw = Array.isArray(res.data) ? res.data : res.data.results || [];

      // chuyển thành treeData (có children)
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

  // lọc dữ liệu
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
    setAddModalVisible(true); // dùng modal vừa tạo
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

  // cột table
  const columns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      width: 300, // tăng chiều dài
      render: (text, record) =>
        record.type === "Category"
          ? text
          : `${text} (${record.product_count} sản phẩm)`,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 150, // tăng chiều dài một chút
      render: (type) => (type === "Category" ? "Danh mục cha" : "Danh mục con"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100, // giảm chiều rộng
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
      width: 80, // giảm chiều rộng
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

  return (
    <div style={{ padding: 20, background: "#fff", minHeight: "100vh" }}>
      <h2 style={{ padding: 10 }}>Quản lý danh mục</h2>

      {/* Toolbar */}
      <div
        style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}
      >
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

        <AddCategoryWithSubModal
          visible={addModalVisible}
          onClose={() => setAddModalVisible(false)}
          onSuccess={fetchCategories}
          category={selectedCategory}
        />
      </div>

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

      {/* Modal chi tiết */}
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
    </div>
  );
};

export default CategoryManagementPage;
