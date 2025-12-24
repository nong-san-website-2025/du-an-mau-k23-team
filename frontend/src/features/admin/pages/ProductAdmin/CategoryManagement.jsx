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
  Tooltip,
  Typography,
  InputNumber,
  Popover,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import axios from "axios";

// --- Imports Components ---
import AdminPageLayout from "../../components/AdminPageLayout";
import CategoryWithSubModal from "../../components/ProductAdmin/Category/AddCategoryWithSubModal";
import ButtonAction from "../../../../components/ButtonAction";
import StatusTag from "../../../../components/StatusTag";

const { Text } = Typography;
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
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/products/categories/`,
        {
          headers: getAuthHeaders(),
        }
      );

      const raw = Array.isArray(res.data) ? res.data : res.data.results || [];

      // Map dữ liệu để phù hợp với Table (Tree Data)
      const mapped = raw.map((cat) => ({
        key: cat.id,
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        image: cat.image,
        key_code: cat.key,
        commission_rate: cat.commission_rate || 0,
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
          parentId: cat.id,
          commission_rate: sub.commission_rate || 0,
        })),
        subcategories: cat.subcategories || [],
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
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
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
    if (record.type === "Subcategory") {
      message.info(
        "Vui lòng chỉnh sửa từ danh mục cha để thay đổi danh mục con."
      );
      return;
    }
    setSelectedCategory(record);
    setModalVisible(true);
  };

  const handleDelete = async (record) => {
    try {
      const endpoint =
        record.type === "Subcategory"
          ? `${process.env.REACT_APP_API_URL}/products/subcategories/${record.id}/`
          : `${process.env.REACT_APP_API_URL}/products/categories/${record.id}/`;

      await axios.delete(endpoint, { headers: getAuthHeaders() });
      message.success(
        `Đã xóa ${
          record.type === "Category" ? "danh mục" : "danh mục con"
        } thành công`
      );
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
      sorter: (a, b) => a.name.localeCompare(b.name),
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
            <div
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <Skeleton.Image active={false} style={{ width: 40, height: 40 }} />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{ fontWeight: record.type === "Category" ? 600 : 400 }}
            >
              {text}
              {record.type === "Category" && (
                <span
                  style={{ color: "#1890ff", fontSize: "11px", marginLeft: 8 }}
                >
                  ({record.subcategories.length} danh mục con)
                </span>
              )}
            </span>
            {record.type === "Subcategory" && (
              <span style={{ color: "#8c8c8c", fontSize: "11px" }}>
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
      sorter: (a, b) => a.type.localeCompare(b.type),
      render: (type) => (
        <span
          style={{
            fontSize: "12px",
            padding: "4px 8px",
            background: type === "Category" ? "#e6f7ff" : "#f9f0ff",
            color: type === "Category" ? "#1890ff" : "#722ed1",
            borderRadius: "4px",
          }}
        >
          {type === "Category" ? "Danh mục cha" : "Danh mục con"}
        </span>
      ),
    },
    {
      title: "Phí sàn",
      dataIndex: "commission_rate",
      key: "commission_rate",
      width: 120,
      align: 'center',
      sorter: (a, b) => a.commission_rate - b.commission_rate,
      render: (_, record) => {
        if (record.type === "Category") {
          return (
            <CommissionEditor record={record} onUpdate={fetchCategories} />
          );
        }
        return <span style={{ color: "#d9d9d9" }}>---</span>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      align: 'center',
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record) => {
        const isParentWithChildren =
          record.type === "Category" && record.subcategories?.length > 0;
        const isChildWithProducts =
          record.type === "Subcategory" && record.product_count > 0;

        const shouldDisableDelete =
          isParentWithChildren || isChildWithProducts;

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
            tooltip: "Xem chi tiết",
            onClick: (r) => handleView(r),
          },
          {
            actionType: "edit",
            icon: <EditOutlined />,
            tooltip: "Chỉnh sửa",
            show: record.type === "Category",
            onClick: (r) => handleEdit(r),
          },
          {
            actionType: record.status === "active" ? "lock" : "unlock",
            icon:
              record.status === "active" ? <LockOutlined /> : <UnlockOutlined />,
            tooltip:
              record.status === "active"
                ? "Ngưng hoạt động"
                : "Kích hoạt lại",
            show: true,
            buttonProps: {
              type: "text",
              style: {
                color: record.status === "active" ? "#faad14" : "#52c41a",
              },
            },
            confirm: {
              title: "Xác nhận chuyển trạng thái?",
              description: `Bạn có chắc chắn muốn chuyển trạng thái của "${
                record.name
              }" sang ${
                record.status === "active" ? "ngưng hoạt động" : "hoạt động"
              }?`,
              okText: "Chuyển",
              cancelText: "Hủy",
            },
            onClick: async (r) => {
              try {
                const endpoint =
                  r.type === "Subcategory"
                    ? `${process.env.REACT_APP_API_URL}/products/subcategories/${r.id}/`
                    : `${process.env.REACT_APP_API_URL}/products/categories/${r.id}/`;
                await axios.patch(
                  endpoint,
                  { status: r.status === "active" ? "inactive" : "active" },
                  { headers: getAuthHeaders() }
                );
                message.success("Đã chuyển trạng thái thành công");
                fetchCategories();
              } catch (err) {
                message.error("Chuyển trạng thái thất bại");
              }
            },
          },
          {
            actionType: "delete",
            icon: <DeleteOutlined />,
            tooltip: "Xóa danh mục",
            disabledReason: reason,
            buttonProps: {
              disabled: shouldDisableDelete,
            },
            confirm: {
              title: "Xác nhận xóa?",
              description: `Bạn có chắc chắn muốn xóa "${record.name}"?`,
              okText: "Xóa ngay",
              cancelText: "Hủy",
            },
            onClick: (r) => handleDelete(r),
          },
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

      {/* Nút Làm mới - Style Outline BLUE (giống ảnh) */}
      <Tooltip title="Tải lại dữ liệu">
        <Button
          icon={<ReloadOutlined spin={loading} />}
          onClick={fetchCategories}
          style={{
            color: "#010101ff",        // Màu chữ xanh dương
            borderColor: "#d9d9d9",  // Viền xanh dương
            backgroundColor: "#fff", // Nền trắng
            display: "flex",
            alignItems: "center",
          }}
        >
          Làm mới
        </Button>
      </Tooltip>

      {/* Nút Thêm Danh Mục - Style Solid GREEN (#28a645) */}
      <Tooltip title="Tạo mới một danh mục cha">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          style={{
            backgroundColor: "#28a645",
            borderColor: "#28a645",
            display: "flex",
            alignItems: "center",
          }}
        >
          Thêm danh mục
        </Button>
      </Tooltip>
    </Space>
  );

  const CommissionEditor = ({ record, onUpdate }) => {
    const [visible, setVisible] = useState(false);
    const [value, setValue] = useState(record.commission_rate * 100);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (visible) {
        setValue(record.commission_rate ? record.commission_rate * 100 : 0);
      }
    }, [visible, record.commission_rate]);

    const handleSave = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const payload = { commission_rate: value / 100 };

        await axios.patch(
          `${process.env.REACT_APP_API_URL}/products/categories/${record.id}/`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        message.success("Cập nhật thành công!");
        setVisible(false);
        record.commission_rate = payload.commission_rate;
        if (onUpdate) {
          onUpdate();
        }
      } catch (error) {
        console.error(error);
        message.error("Lỗi khi cập nhật");
      } finally {
        setLoading(false);
      }
    };

    const content = (
      <div style={{ display: "flex", gap: "8px" }}>
        <InputNumber
          min={0}
          max={100}
          value={value}
          onChange={setValue}
          formatter={(value) => `${value}%`}
          parser={(value) => value.replace("%", "")}
          autoFocus
        />
        <Button
          type="primary"
          size="small"
          icon={<CheckOutlined />}
          onClick={handleSave}
          loading={loading}
        />
        <Button
          size="small"
          icon={<CloseOutlined />}
          onClick={() => setVisible(false)}
          disabled={loading}
        />
      </div>
    );

    return (
      <Popover
        content={content}
        title="Sửa phí sàn"
        trigger="click"
        open={visible}
        onOpenChange={setVisible}
      >
        <div
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            padding: "4px 8px",
            border: "1px dashed #d9d9d9",
            borderRadius: "4px",
            background: "#fafafa",
            width: "fit-content",
            margin: "0 auto",
          }}
          className="hover-edit-cell"
        >
          <Text
            strong
            style={{ color: record.commission_rate > 0 ? "#faad14" : "#8c8c8c" }}
          >
            {record.commission_rate
              ? `${(record.commission_rate * 100).toFixed(1)}%`
              : "0%"}
          </Text>
          <EditOutlined style={{ fontSize: "10px", color: "#bfbfbf" }} />
        </div>
      </Popover>
    );
  };

  return (
    <AdminPageLayout title="QUẢN LÝ DANH MỤC" extra={Toolbar}>
      {loading && data.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
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

      <CategoryWithSubModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={fetchCategories}
        category={selectedCategory}
      />

      <Modal
        open={viewModalVisible}
        title={`Chi tiết: ${viewRecord?.name}`}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Tooltip title="Đóng cửa sổ này" key="close-tooltip">
            <Button key="close" onClick={() => setViewModalVisible(false)}>
              Đóng
            </Button>
          </Tooltip>,
        ]}
      >
        {viewRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{viewRecord.id}</Descriptions.Item>
            <Descriptions.Item label="Tên danh mục">
              {viewRecord.name}
            </Descriptions.Item>
            <Descriptions.Item label="Loại">
              {viewRecord.type === "Category" ? "Danh mục cha" : "Danh mục con"}
            </Descriptions.Item>
            <Descriptions.Item label="Mã Key">
              {viewRecord.key_code || "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <StatusTag status={viewRecord.status} />
            </Descriptions.Item>
            {viewRecord.type === "Category" && (
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