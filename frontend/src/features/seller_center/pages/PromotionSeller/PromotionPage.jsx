import React, { useState, useEffect } from "react";
import { message, Tag, Dropdown, Menu, Popconfirm, Modal, Button, Space } from "antd";
import {
  PlusOutlined,
  EllipsisOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import moment from "moment";
import PromotionBaseLayout from "../../components/PromotionSeller/PromotionBaseLayout";
import PromotionForm from "../../components/PromotionSeller/PromotionForm"; // file form đã có sẵn
import {
  getSellerVouchers,
  createSellerVoucher,
  updateSellerVoucher,
  deleteSellerVoucher,
} from "../../../admin/services/promotionServices";

import "../../styles/SellerPage.css";

export default function PromotionPage() {
  /* ===== State ===== */
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({});

  /* Modal */
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingVoucher, setViewingVoucher] = useState(null);

  /* ===== Effects ===== */
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getSellerVouchers(filters);
        setVouchers(data);
        setFiltered(data);
      } catch (e) {
        if (e.response?.status !== 500) message.error("Lỗi khi tải danh sách!");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [filters]);

  /* ===== CRUD ===== */
  const handleCreate = async (values) => {
    try {
      await createSellerVoucher(values);
      message.success("Tạo thành công!");
      closeEditModal();
      setFilters({});
    } catch (e) {
      message.error(e.response?.data?.detail || "Tạo thất bại!");
    }
  };
  const handleUpdate = async (values) => {
    try {
      await updateSellerVoucher(editingVoucher.id, values);
      message.success("Cập nhật thành công!");
      closeEditModal();
      setFilters({});
    } catch (e) {
      message.error(e.response?.data?.detail || "Cập nhật thất bại!");
    }
  };
  const handleDelete = async (id) => {
    try {
      await deleteSellerVoucher(id);
      message.success("Xóa thành công!");
      setFilters({});
    } catch {
      message.error("Xóa thất bại!");
    }
  };

  /* ===== Filter ===== */
  const handleFilter = (newFilters) => setFilters(newFilters);
  const handleClear = () => setFilters({});
  const handleSearch = (kw) => {
    const lower = kw.toLowerCase();
    setFiltered(
      vouchers.filter(
        (v) =>
          v.code.toLowerCase().includes(lower) ||
          v.title.toLowerCase().includes(lower)
      )
    );
  };
  const handleStatusFilter = (val) => {
    if (!val) return setFiltered(vouchers);
    const bool = val === "true";
    setFiltered(vouchers.filter((v) => v.active === bool));
  };

  /* ===== Modal ===== */
  const openCreate = () => {
    setEditingVoucher(null);
    setIsEditModalVisible(true);
  };
  const openEdit = (v) => {
    setEditingVoucher(v);
    setIsEditModalVisible(true);
  };
  const closeEditModal = () => {
    setIsEditModalVisible(false);
    setEditingVoucher(null);
  };
  const openView = (v) => {
    setViewingVoucher(v);
    setIsViewModalVisible(true);
  };
  const closeViewModal = () => setIsViewModalVisible(false);

  /* ===== Columns ===== */
  const columns = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      render: (t) => <strong>{t}</strong>,
    },
    { title: "Tên khuyến mãi", dataIndex: "title", key: "title" },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      render: (a) => (
        <Tag color={a ? "green" : "red"}>{a ? "Hoạt động" : "Tạm dừng"}</Tag>
      ),
    },
    {
      title: "Lượt sử dụng",
      dataIndex: "users_count",
      key: "users_count",
      render: (count) => (
        <span style={{ fontWeight: 500, color: "#1890ff" }}>
          {count || 0} người dùng
        </span>
      ),
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "start_at",
      key: "start_at",
      render: (d) => moment(d).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Ngày kết thúc",
      dataIndex: "end_at",
      key: "end_at",
      render: (d) => moment(d).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Hành động",
      key: "action",
      width: 180,
      className: "no-row-click", // nếu bạn dùng CSS loại hover
      render: (_, r) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Button
            type="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(r);
            }}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Bạn có chắc muốn xóa?"
            onConfirm={() => handleDelete(r.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ===== Render ===== */
  return (
    <>
      <PromotionBaseLayout
        title="QUẢN LÝ KHUYẾN MÃI"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tạo Voucher
          </Button>
        }
        loading={loading}
        data={filtered}
        columns={columns}
        onSearch={handleSearch}
        onFilterStatus={handleStatusFilter}
        statusFilterOptions={[
          { value: "true", label: "Hoạt động" },
          { value: "false", label: "Tạm dừng" },
        ]}
        onRow={(record) => ({
          className: "row-hover",
          onClick: () => openView(record), // click row → mở modal xem
        })}
      />

      {/* Modal Tạo/Sửa */}
      <Modal
        title={editingVoucher ? "Sửa Khuyến Mãi" : "Tạo Khuyến Mãi Mới"}
        visible={isEditModalVisible}
        onCancel={closeEditModal}
        footer={null}
        width={800}
        destroyOnClose
      >
        <PromotionForm
          key={editingVoucher ? editingVoucher.id : "new"}
          onSubmit={editingVoucher ? handleUpdate : handleCreate}
          onCancel={closeEditModal}
          initialData={editingVoucher}
        />
      </Modal>

      {/* Modal Xem */}
      {viewingVoucher && (
        <Modal
          title="Xem Chi Tiết Khuyến Mãi"
          visible={isViewModalVisible}
          onCancel={closeViewModal}
          footer={false}
          width={800}
          destroyOnClose
        >
          <PromotionForm initialData={viewingVoucher} disabled />
        </Modal>
      )}
    </>
  );
}
