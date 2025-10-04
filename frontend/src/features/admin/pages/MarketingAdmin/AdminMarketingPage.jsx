// src/pages/Admin/Marketing/MarketingAdminPage.jsx
import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Tag,
  Image,
  Space,
  Popconfirm,
  message,
  Card,
  Typography,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import moment from "moment";

import BannerForm from "../../components/MarketingAdmin/BannerForm";
import { getBanners } from "../../services/marketingApi";
import API from "../../../login_register/services/api";

const { Title } = Typography;

const MarketingAdminPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Lấy danh sách banner
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await getBanners();
      setBanners(res.data);
    } catch (err) {
      console.error("Lỗi khi tải banner:", err);
      message.error("Không thể tải danh sách banner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Xử lý xóa
  const handleDelete = async (id) => {
    try {
      await API.delete(`/marketing/banners/${id}/`); // ✅ Tự động có token!
      message.success("Xóa banner thành công");
      fetchBanners();
    } catch (err) {
      console.error("Lỗi xóa banner:", err.response?.data || err.message);
      const detail = err.response?.data?.detail || "Không thể xóa banner";
      message.error(`Xóa thất bại: ${detail}`);
    }
  };

  // Sau khi tạo/sửa thành công
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingBanner(null);
    fetchBanners();
  };

  // Map vị trí sang nhãn đẹp
  const getPositionLabel = (position) => {
    const map = {
      hero: "Hero - Top",
      carousel: "Carousel",
      side: "Sidebar",
      mobile: "Mobile only",
      modal: "Modal Popup",
    };
    return map[position] || position;
  };

  const getPositionColor = (position) => {
    return position === "modal" ? "purple" : "blue";
  };

  const columns = [
    {
      title: "Ảnh",
      dataIndex: "image",
      width: 100,
      render: (url) => (
        <Image
          src={url}
          alt="banner"
          width={80}
          height={40}
          style={{ objectFit: "cover" }}
          fallback="/placeholder-banner.png"
        />
      ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      render: (text) => text || <i>Không có tiêu đề</i>,
    },
    {
      title: "Vị trí",
      dataIndex: "position",
      render: (pos) => (
        <Tag color={getPositionColor(pos)}>{getPositionLabel(pos)}</Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      render: (active) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "Đang hiện" : "Ẩn"}
        </Tag>
      ),
    },
    {
      title: "Thời gian hiển thị",
      key: "time",
      render: (_, record) => (
        <div style={{ fontSize: "13px" }}>
          <div>
            <strong>Bắt đầu:</strong>{" "}
            {record.start_at
              ? moment(record.start_at).format("DD/MM/YYYY HH:mm")
              : "Ngay lập tức"}
          </div>
          <div>
            <strong>Kết thúc:</strong>{" "}
            {record.end_at
              ? moment(record.end_at).format("DD/MM/YYYY HH:mm")
              : "Vô hạn"}
          </div>
        </div>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="link"
            onClick={() => {
              setEditingBanner(record);
              setShowForm(true);
            }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa?"
            description="Bạn có chắc muốn xóa banner này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>Quản lý Banner & Modal Quảng Cáo</Title>
      <p>
        Quản lý các banner hiển thị trên website, bao gồm cả modal popup khi
        người dùng truy cập.
      </p>

      {/* Nút tạo mới */}
      <div style={{ textAlign: "right", marginBottom: "24px" }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingBanner(null);
            setShowForm(true);
          }}
        >
          Thêm Banner Mới
        </Button>
      </div>

      {/* Form tạo/sửa (ẩn/hiện) */}
      {showForm && (
        <Card
          title={editingBanner ? "Chỉnh sửa Banner" : "Tạo Banner Mới"}
          style={{ marginBottom: "24px" }}
          extra={<Button onClick={() => setShowForm(false)}>Đóng</Button>}
        >
          <BannerForm
            bannerId={editingBanner?.id}
            onSuccess={handleFormSuccess}
          />
        </Card>
      )}

      {/* Bảng danh sách */}
      <Card>
        <Table
          dataSource={banners}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default MarketingAdminPage;
