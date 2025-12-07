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
  Space,
  Image,
  Skeleton,
  Tooltip, // <--- 1. Thêm import Tooltip
} from "antd";
import { SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined, LockOutlined, UnlockOutlined } from "@ant-design/icons";
import axios from "axios";

// --- Imports Components ---
import AdminPageLayout from "../../components/AdminPageLayout";
import CategoryWithSubModal from "../../components/ProductAdmin/Category/AddCategoryWithSubModal";
import ButtonAction from "../../../../components/ButtonAction";
import StatusTag from "../../../../components/StatusTag";

const { Option } = Select;

const CategoryManagementPage = () => {
  // --- States ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // States cho Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  // States cho Modal Edit/Add
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // States cho Modal View (Xem chi tiết - Read only)
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);

  // --- API Functions ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/products/categories/`, {
        headers: getAuthHeaders(),
      });

      const raw = Array.isArray(res.data) ? res.data : res.data.results || [];

      // Map dữ liệu để phù hợp với Table (Tree Data)
      const mapped = raw.map((cat) => ({
        key: cat.id,
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        image: cat.image,
        key_code: cat.key,
        type: "Category",
        status: cat.status,
        children: (cat.subcategories || []).map((sub) => ({
          key: `${cat.id}-${sub.id}`,
          id: sub.id,
          name: sub.name,
          image: sub.image,
          type: "Subcategory",
          status: sub.status,
          product_count: sub.product_count || 0,
          parentId: cat.id
        })),
        subcategories: cat.subcategories || []
      }));

      setData(mapped);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- Handlers ---

  const filteredData = data.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setSelectedCategory(null);
    setModalVisible(true);
  };

  const handleView = (record) => {
    setViewRecord(record);
    setViewModalVisible(true);
  };

  const handleEdit = (record) => {
    if (record.type === 'Subcategory') {
      message.info("Vui lòng chỉnh sửa từ danh mục cha để thay đổi danh mục con.");
      return;
    }
    setSelectedCategory(record);
    setModalVisible(true);
  };

  const handleDelete = async (record) => {
    try {
      const endpoint = record.type === 'Subcategory'
        ? `${process.env.REACT_APP_API_URL}/products/subcategories/${record.id}/`
        : `${process.env.REACT_APP_API_URL}/products/categories/${record.id}/`;

      await axios.delete(endpoint, { headers: getAuthHeaders() });
      message.success(`Đã xóa ${record.type === 'Category' ? 'danh mục' : 'danh mục con'} thành công`);
      fetchCategories();
    } catch (err) {
      console.error(err);
      message.error("Xoá thất bại, có thể danh mục đang chứa sản phẩm.");
    }
  };

  // --- Table Columns Configuration ---
  const columns = [
    {
      title: "Tên danh mục",
      dataIndex: "name",
      key: "name",
      width: 350,
      render: (text, record) => (
        <Space>
          {record.image ? (
            <Image
              src={record.image}
              alt={text}
              width={40}
              height={40}
              style={{ objectFit: "cover", borderRadius: "4px" }}
              preview={true}
              fallback="https://via.placeholder.com/40?text=Error"
            />
          ) : (
            <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', overflow: 'hidden' }}>
              <Skeleton.Image active={false} style={{ width: 40, height: 40 }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: record.type === 'Category' ? 600 : 400 }}>
              {text}
              {record.type === 'Category' && (
                <span style={{ color: '#1890ff', fontSize: '11px', marginLeft: 8 }}>
                  ({record.subcategories.length} danh mục con)
                </span>
              )}
            </span>
            {record.type === 'Subcategory' && (
              <span style={{ color: '#8c8c8c', fontSize: '11px' }}>
                {record.product_count} sản phẩm
              </span>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 150,
      align: 'center',
      render: (type) => (
        <span style={{
          fontSize: '12px',
          padding: '4px 8px',
          background: type === 'Category' ? '#e6f7ff' : '#f9f0ff',
          color: type === 'Category' ? '#1890ff' : '#722ed1',
          borderRadius: '4px'
        }}>
          {type === "Category" ? "Danh mục cha" : "Danh mục con"}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      align: 'center',
      render: (status) => <StatusTag status={status} />,
    },
    // --- PHẦN QUAN TRỌNG: CỘT HÀNH ĐỘNG ĐÃ CÓ TOOLTIP CONFIG ---
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      align: 'center',
      render: (_, record) => {
        // 1. Logic kiểm tra điều kiện Disable
        const isParentWithChildren = record.type === 'Category' && record.subcategories?.length > 0;
        const isChildWithProducts = record.type === 'Subcategory' && record.product_count > 0;

        // Biến xác định có disable hay không
        const shouldDisableDelete = isParentWithChildren || isChildWithProducts;

        // 2. Xác định lý do disable (để hiển thị tooltip)
        let reason = "";
        if (isParentWithChildren) {
          reason = "Không thể xóa: Đang chứa danh mục con";
        } else if (isChildWithProducts) {
          reason = "Không thể xóa: Đang chứa sản phẩm";
        }

        const actions = [
          {
            actionType: "view",
            icon: <EyeOutlined />,
            tooltip: "Xem chi tiết", // Đã có
            onClick: (r) => handleView(r),
          },
          {
            actionType: "edit",
            icon: <EditOutlined />,
            tooltip: "Chỉnh sửa", // Đã có
            show: record.type === 'Category',
            onClick: (r) => handleEdit(r),
          },
            {
              actionType: "lock",
              icon: record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />,
              tooltip: record.status === 'active' ? 'Ngưng hoạt động' : 'Kích hoạt lại', // Đã có (rút gọn text cho đẹp)
              show: true,
              buttonProps: {
                type: 'text',
                style: { color: record.status === 'active' ? '#faad14' : '#52c41a' }
              },
              confirm: {
                title: 'Xác nhận chuyển trạng thái?',
                description: `Bạn có chắc chắn muốn chuyển trạng thái của "${record.name}" sang ${record.status === 'active' ? 'ngưng hoạt động' : 'hoạt động'}?`,
                okText: 'Chuyển',
                cancelText: 'Hủy',
              },
              onClick: async (r) => {
                try {
                  const endpoint = r.type === 'Subcategory'
                    ? `${process.env.REACT_APP_API_URL}/products/subcategories/${r.id}/`
                    : `${process.env.REACT_APP_API_URL}/products/categories/${r.id}/`;
                  await axios.patch(endpoint, { status: r.status === 'active' ? 'inactive' : 'active' }, { headers: getAuthHeaders() });
                  message.success('Đã chuyển trạng thái thành công');
                  fetchCategories();
                } catch (err) {
                  message.error('Chuyển trạng thái thất bại');
                }
              },
            },
          {
            actionType: "delete",
            icon: <DeleteOutlined />,
            tooltip: "Xóa danh mục", // Đã có

            // CẤU HÌNH CHO BUTTON ACTION:
            disabledReason: reason, // Tooltip khi nút bị disable

            buttonProps: {
              disabled: shouldDisableDelete
            },

            confirm: {
              title: "Xác nhận xóa?",
              description: `Bạn có chắc chắn muốn xóa "${record.name}"?`,
              okText: "Xóa ngay",
              cancelText: "Hủy",
            },
            onClick: (r) => handleDelete(r),
          }
        ];

        return <ButtonAction actions={actions} record={record} />;
      },
    },
  ];

  // --- Toolbar Component ---
  const Toolbar = (
    <Space wrap>
      <Input
        prefix={<SearchOutlined />}
        placeholder="Tìm tên danh mục..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: 250 }}
        allowClear
      />
      <Select
        placeholder="Lọc trạng thái"
        onChange={(value) => setStatusFilter(value)}
        style={{ width: 180 }}
        allowClear
      >
        <Option value="active">Hoạt động</Option>
        <Option value="inactive">Ngưng hoạt động</Option>
      </Select>
      
      {/* 2. Thêm Tooltip cho nút Thêm Danh Mục */}
      <Tooltip title="Tạo mới một danh mục cha">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Thêm danh mục
        </Button>
      </Tooltip>
    </Space>
  );

  return (
    <AdminPageLayout title="QUẢN LÝ DANH MỤC" extra={Toolbar}>
      {loading && data.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px" }}><Spin size="large" /></div>
      ) : (
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={false}
          size="middle"
          rowKey="key"
          indentSize={24}
          bordered
        />
      )}

      {/* Modal Thêm/Sửa */}
      <CategoryWithSubModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={fetchCategories}
        category={selectedCategory}
      />

      {/* Modal Xem chi tiết */}
      <Modal
        open={viewModalVisible}
        title={`Chi tiết: ${viewRecord?.name}`}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          // 3. Thêm Tooltip cho nút Đóng
          <Tooltip title="Đóng cửa sổ này" key="close-tooltip">
            <Button key="close" onClick={() => setViewModalVisible(false)}>Đóng</Button>
          </Tooltip>
        ]}
      >
        {viewRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{viewRecord.id}</Descriptions.Item>
            <Descriptions.Item label="Tên danh mục">{viewRecord.name}</Descriptions.Item>
            <Descriptions.Item label="Loại">
              {viewRecord.type === "Category" ? "Danh mục cha" : "Danh mục con"}
            </Descriptions.Item>
            <Descriptions.Item label="Mã Key">
              {viewRecord.key_code || "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <StatusTag status={viewRecord.status} />
            </Descriptions.Item>
            {viewRecord.type === 'Category' && (
              <Descriptions.Item label="Số danh mục con">
                {viewRecord.subcategories?.length || 0}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

    </AdminPageLayout>
  );
};

export default CategoryManagementPage;