import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  Modal,
  Tag,
  Space,
  Image,
  Select,
  message,
  Input,
  Row,
  Col,
  Popconfirm,
  Tooltip, // <--- Đã thêm Tooltip
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  StopOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";

// Import Component Form
import BannerForm from "./BannerForm";
import ButtonAction from "../../../../components/ButtonAction";
import {
  getAdminBanners,
  getAdSlots,
  deleteBanner,
} from "../../services/marketingApi";

const BannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Filter states
  const [slotFilter, setSlotFilter] = useState(null); // Lưu ID của slot
  const [searchText, setSearchText] = useState("");

  // Selection states (Chọn nhiều)
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resBanners, resSlots] = await Promise.all([
        getAdminBanners(),
        getAdSlots(),
      ]);
      // Reset selection khi reload data
      setSelectedRowKeys([]);
      setBanners(resBanners.data || resBanners);
      setSlots(resSlots.data || resSlots);
    } catch (error) {
      console.error(error);
      message.error("Không thể tải dữ liệu marketing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Xóa 1 cái
  const handleDelete = async (id) => {
    try {
      await deleteBanner(id);
      message.success("Đã xóa banner.");
      fetchData();
    } catch {
      message.error("Lỗi khi xóa banner.");
    }
  };

  // Xóa nhiều cái (Bulk Delete)
  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;

    setLoading(true);
    try {
      await Promise.all(selectedRowKeys.map((id) => deleteBanner(id)));

      message.success(`Đã xóa ${selectedRowKeys.length} banner thành công!`);
      fetchData();
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra khi xóa danh sách.");
      setLoading(false);
    }
  };

  // --- LOGIC LỌC ---
  const filteredBanners = banners.filter((b) => {
    // 1. Lọc theo Tiêu đề
    const normalizedSearch = searchText.toLowerCase().trim();
    const titleMatch = b.title
      ? b.title.toLowerCase().includes(normalizedSearch)
      : false;

    if (searchText && !titleMatch) return false;

    // 2. Lọc theo Vị trí
    if (slotFilter) {
      const bannerSlotId =
        typeof b.slot === "object" && b.slot !== null ? b.slot.id : b.slot;

      if (String(bannerSlotId) !== String(slotFilter)) {
        return false;
      }
    }

    return true;
  });

  // Cấu hình cột bảng
  const columns = [
    {
      title: "Hình ảnh",
      dataIndex: "image",
      key: "image",
      width: 120,
      render: (src) => (
        <Image
          src={src}
          width={100}
          height={50}
          style={{
            objectFit: "cover",
            borderRadius: 4,
            border: "1px solid #ddd",
          }}
          fallback="https://via.placeholder.com/100x50"
        />
      ),
    },
    {
      title: "Thông tin Banner",
      key: "info",
      width: isMobile ? 220 : undefined,
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {record.title || "Chưa đặt tên"}
          </div>
          <div style={{ marginTop: 4 }}>
            <Tag color="blue">{record.slot?.name || `Slot ID: ${record.slot}`}</Tag>
            {record.priority > 0 && (
              <Tag color="gold">Ưu tiên: {record.priority}</Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Thời gian",
      key: "time",
      width: isMobile ? 200 : 220,
      sorter: (a, b) => new Date(a.start_at) - new Date(b.start_at),
      render: (_, b) => (
        <div style={{ fontSize: 13, color: "#666" }}>
          <div>BĐ: {moment(b.start_at).format("DD/MM/YYYY HH:mm")}</div>
          <div>
            KT:{" "}
            {b.end_at ? (
              moment(b.end_at).format("DD/MM/YYYY HH:mm")
            ) : (
              <span style={{ color: "green" }}>Vô hạn</span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 130,
      align: "center",
      render: (_, record) => {
        const now = moment();
        const start = moment(record.start_at);
        const end = record.end_at ? moment(record.end_at) : null;

        if (!record.is_active)
          return (
            <Tag icon={<StopOutlined />} color="default">
              Đã ẩn
            </Tag>
          );
        if (end && end.isBefore(now))
          return (
            <Tag icon={<WarningOutlined />} color="error">
              Hết hạn
            </Tag>
          );
        if (start.isAfter(now))
          return (
            <Tag icon={<ClockCircleOutlined />} color="warning">
              Sắp chạy
            </Tag>
          );
        return (
          <Tag icon={<EyeOutlined />} color="success">
            Hiển thị
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record) => (
        <ButtonAction
          record={record}
          actions={[
            {
              actionType: "edit",
              icon: <EditOutlined />,
              tooltip: "Sửa",
              onClick: (r) => {
                setEditingBanner(r);
                setShowForm(true);
              },
            },
            {
              actionType: "delete",
              icon: <DeleteOutlined />,
              tooltip: "Xóa",
              confirm: { title: "Xóa banner này?", okText: "Xóa" },
              onClick: (r) => handleDelete(r.id),
            },
          ]}
        />
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space wrap>
              {/* Input Tìm kiếm */}
              <Input
                placeholder="Tìm tiêu đề..."
                prefix={<SearchOutlined />}
                style={{ width: 220 }}
                value={searchText}
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
              />

              {/* Select Lọc Slot */}
              <Select
                placeholder="Lọc theo vị trí"
                allowClear
                style={{ width: 200 }}
                value={slotFilter}
                onChange={setSlotFilter}
                options={slots.map((s) => ({ label: s.name, value: s.id }))}
              />
            </Space>
          </Col>

          <Col>
            <Space>
              {/* Nút Xóa Nhiều */}
              {selectedRowKeys.length > 0 && (
                <Popconfirm
                  title={`Bạn có chắc muốn xóa ${selectedRowKeys.length} banner đã chọn?`}
                  onConfirm={handleBulkDelete}
                  okText="Xóa ngay"
                  okButtonProps={{ danger: true }}
                >
                  <Button type="primary" danger icon={<DeleteOutlined />}>
                    Xóa ({selectedRowKeys.length}) mục
                  </Button>
                </Popconfirm>
              )}

              {/* --- NÚT LÀM MỚI (MỚI THÊM) --- */}
              <Tooltip title="Tải lại dữ liệu">
                <Button
                  icon={<ReloadOutlined spin={loading} />}
                  onClick={fetchData}
                  style={{
                    backgroundColor: "#fff",
                    borderColor: "#d9d9d9", // Viền xanh dương chuẩn Antd
                    color: "#000000ff",       // Chữ xanh dương
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Làm mới
                </Button>
              </Tooltip>

              {/* --- NÚT THÊM BANNER (ĐÃ SỬA MÀU #28a645) --- */}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingBanner(null);
                  setShowForm(true);
                }}
                style={{
                  backgroundColor: "#28a645", // Màu xanh lá
                  borderColor: "#28a645",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Thêm Banner Mới
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={filteredBanners}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 6,
          showTotal: (total) => `Tổng ${total} banner`,
        }}
        rowSelection={rowSelection}
        rowClassName={(record) => {
          const now = moment();
          const end = record.end_at ? moment(record.end_at) : null;
          return end && end.isBefore(now) ? "expired-row" : "";
        }}
      />

      <style jsx="true">{`
        .expired-row {
          opacity: 0.6;
          background-color: #fafafa;
          filter: grayscale(1);
        }
        .expired-row:hover {
          opacity: 1;
          filter: grayscale(0);
        }
      `}</style>

      <Modal
        title={editingBanner ? "Chỉnh sửa Banner" : "Thêm Banner Mới"}
        open={showForm}
        onCancel={() => setShowForm(false)}
        footer={null}
        width={900}
        destroyOnClose
        centered
        maskClosable={false}
      >
        <BannerForm
          bannerId={editingBanner?.id}
          onSuccess={() => {
            setShowForm(false);
            fetchData();
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </>
  );
};

export default BannerManager;