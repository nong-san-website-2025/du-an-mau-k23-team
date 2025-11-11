// src/components/MarketingAdmin/BannerManager.jsx
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
  Popconfirm,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import BannerForm from "./BannerForm";
import API from "../../../login_register/services/api";
import moment from "moment";

const BannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slotFilter, setSlotFilter] = useState(null);
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
      message.error("Không thể tải dữ liệu");
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
      message.success("Xóa banner thành công");
      fetchData();
    } catch {
      message.error("Không thể xóa banner");
    }
  };

  const filteredBanners = slotFilter
    ? banners.filter((b) => b.slot.code === slotFilter)
    : banners;

  const columns = [
    {
      title: "Ảnh",
      dataIndex: "image",
      key: "image",
      render: (src) => (
        <Image
          src={src}
          alt="banner"
          width={80}
          height={50}
          style={{ objectFit: "cover", borderRadius: 4 }}
          fallback="/placeholder-banner.png"
        />
      ),
    },
    { title: "Tiêu đề", dataIndex: "title", key: "title" },
    {
      title: "Vị trí",
      dataIndex: ["slot", "name"],
      key: "slot",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (active) =>
        active ? <Tag color="green">Đang hoạt động</Tag> : <Tag color="red">Ẩn</Tag>,
    },
    {
      title: "Thời gian",
      key: "time",
      render: (_, b) =>
        `${moment(b.start_at).format("DD/MM HH:mm")} → ${
          b.end_at ? moment(b.end_at).format("DD/MM HH:mm") : "∞"
        }`,
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            type="link"
            onClick={() => {
              setEditingBanner(record);
              setShowForm(true);
            }}
          />
          <Popconfirm
            title="Xóa banner này?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} type="link" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Lọc theo vị trí"
          allowClear
          style={{ width: 240 }}
          value={slotFilter}
          onChange={(v) => setSlotFilter(v)}
        >
          {slots.map((s) => (
            <Select.Option key={s.code} value={s.code}>
              {s.name}
            </Select.Option>
          ))}
        </Select>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingBanner(null);
            setShowForm(true);
          }}
        >
          Thêm Banner
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredBanners}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 6 }}
      />

      <Modal
        title={editingBanner ? "Chỉnh sửa Banner" : "Tạo Banner Mới"}
        open={showForm}
        onCancel={() => setShowForm(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <BannerForm bannerId={editingBanner?.id} onSuccess={fetchData} />
      </Modal>
    </>
  );
};

export default BannerManager;
