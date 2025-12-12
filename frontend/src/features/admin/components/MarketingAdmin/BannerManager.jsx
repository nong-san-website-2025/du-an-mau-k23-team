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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  StopOutlined,
} from "@ant-design/icons";
import moment from "moment";

// IMPORT COMPONENTS
import BannerForm from "./BannerForm";
import API from "../../../login_register/services/api";
import ButtonAction from "../../../../components/ButtonAction"; // Đảm bảo đường dẫn import đúng

const BannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [slotFilter, setSlotFilter] = useState(null);
  const [searchText, setSearchText] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resBanners, resSlots] = await Promise.all([
        API.get("/marketing/banners/"),
        API.get("/marketing/slots/"),
      ]);
      setBanners(resBanners.data);
      setSlots(resSlots.data);
    } catch {
      message.error("Không thể tải dữ liệu marketing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    try {
      await API.delete(`/marketing/banners/${id}/`);
      message.success("Đã xóa banner.");
      fetchData();
    } catch {
      message.error("Lỗi khi xóa banner.");
    }
  };

  // Logic lọc dữ liệu kết hợp
  const filteredBanners = banners.filter((b) => {
    const matchSlot = slotFilter ? b.slot.code === slotFilter : true;
    const matchSearch = searchText
      ? b.title.toLowerCase().includes(searchText.toLowerCase())
      : true;
    return matchSlot && matchSearch;
  });

  const columns = [
    {
      title: "Hình ảnh",
      dataIndex: "image",
      key: "image",
      width: 150,
      render: (src) => (
        <div style={{ borderRadius: 6, overflow: "hidden", border: "1px solid #f0f0f0" }}>
          <Image
            src={src}
            alt="banner"
            width={140}
            height={70}
            style={{ objectFit: "cover" }}
            fallback="/placeholder-banner.png"
            preview={{ mask: <EyeOutlined /> }}
          />
        </div>
      ),
    },
    {
      title: "Thông tin Banner",
      key: "info",
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{record.title}</span>
          <Space size={4}>
            <Tag color="geekblue">{record.slot?.name}</Tag>
            {record.priority > 0 && <Tag color="gold">Ưu tiên: {record.priority}</Tag>}
          </Space>
        </div>
      ),
    },
    {
      title: "Thời gian hiển thị",
      key: "time",
      width: 200,
      render: (_, b) => (
        <div style={{ fontSize: 13, color: "#666" }}>
          <div>
            Bắt đầu: <span style={{ color: "#333" }}>{moment(b.start_at).format("DD/MM/YYYY HH:mm")}</span>
          </div>
          <div>
            Kết thúc:{" "}
            <span style={{ color: b.end_at ? "#333" : "green" }}>
              {b.end_at ? moment(b.end_at).format("DD/MM/YYYY HH:mm") : "Vô thời hạn"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      width: 120,
      align: "center",
      render: (active) =>
        active ? (
          <Tag icon={<EyeOutlined />} color="success">
            Hiển thị
          </Tag>
        ) : (
          <Tag icon={<StopOutlined />} color="default">
            Đã ẩn
          </Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      align: "center",
      render: (_, record) => (
        <ButtonAction
          record={record}
          actions={[
            {
              actionType: "edit", // Sẽ tự động lấy màu Cyan từ ButtonAction
              icon: <EditOutlined />,
              tooltip: "Chỉnh sửa",
              onClick: (r) => {
                setEditingBanner(r);
                setShowForm(true);
              },
            },
            {
              actionType: "delete", // Sẽ tự động lấy màu Đỏ từ ButtonAction
              icon: <DeleteOutlined />,
              tooltip: "Xóa",
              confirm: {
                title: "Bạn chắc chắn muốn xóa banner này?",
                description: "Hành động này không thể hoàn tác.",
                okText: "Xóa",
                cancelText: "Hủy",
              },
              onClick: (r) => handleDelete(r.id),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space wrap>
              <Input
                placeholder="Tìm kiếm theo tiêu đề..."
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Select
                placeholder="Lọc theo vị trí"
                allowClear
                style={{ width: 200 }}
                value={slotFilter}
                onChange={(v) => setSlotFilter(v)}
                options={slots.map((s) => ({ label: s.name, value: s.code }))}
              />
              <Button icon={<ReloadOutlined />} onClick={fetchData} title="Làm mới dữ liệu" />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: "right" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => {
                setEditingBanner(null);
                setShowForm(true);
              }}
            >
              Thêm Banner Mới
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={filteredBanners}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 6, showTotal: (total) => `Tổng ${total} banners` }}
        bordered
      />

      <Modal
        title={
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {editingBanner ? (
              <>
                <EditOutlined /> Chỉnh sửa Banner
              </>
            ) : (
              <>
                <PlusOutlined /> Tạo Banner Mới
              </>
            )}
          </div>
        }
        open={showForm}
        onCancel={() => setShowForm(false)}
        footer={null}
        width={800}
        destroyOnClose
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