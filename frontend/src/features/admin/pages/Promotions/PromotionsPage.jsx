import React, { useEffect, useState } from "react";
import dayjs from "dayjs";

import {
  Table,
  Input,
  Button,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Select,
  Tag,
  Space,
  Popconfirm,
  message,
} from "antd";
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "../../services/promotionServices";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;

const PromotionsPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);

  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPromotions();
        setVouchers(data);
      } catch (err) {
        setError("Không thể tải dữ liệu khuyến mãi");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleCreateOrUpdate = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        code: values.code,
        campaign_name: values.campaign_name,
        title: values.title,
        description: values.description,
        discount_percent: values.discount_percent,
        min_order_value: values.min_order_value,
        start_at: values.dateRange[0].toISOString(),
        end_at: values.dateRange[1].toISOString(),
        scope: values.scope,
      };

      if (editingVoucher) {
        const res = await updatePromotion(editingVoucher.id, payload);
        setVouchers(
          vouchers.map((v) => (v.id === editingVoucher.id ? res : v))
        );
        message.success("Cập nhật thành công");
      } else {
        const res = await createPromotion(payload);
        setVouchers([...vouchers, res]);
        message.success("Tạo mới thành công");
      }

      setShowModal(false);
      setEditingVoucher(null);
      form.resetFields();
    } catch (err) {
      console.error(
        "Lỗi tạo/cập nhật khuyến mãi:",
        err.response?.data || err.message
      );
    }
  };

  const handleEdit = (voucher) => {
    setEditingVoucher(voucher);
    setShowModal(true);
    form.setFieldsValue({
      code: voucher.code,
      campaign_name: voucher.campaign_name,
      title: voucher.title,
      description: voucher.description,
      discount_percent: voucher.discount_percent,
      min_order_value: voucher.min_order_value,
      dateRange: [
        voucher.start_at ? dayjs(voucher.start_at) : null,
        voucher.end_at ? dayjs(voucher.end_at) : null,
      ],
      scope: voucher.scope,
    });
  };

  const handleDelete = async (id) => {
    try {
      await deletePromotion(id);
      setVouchers(vouchers.filter((v) => v.id !== id));
      message.success("Xóa thành công");
    } catch (err) {
      console.error("Lỗi xóa khuyến mãi:", err);
      message.error("Không thể xóa khuyến mãi");
    }
  };

  const filteredVouchers = vouchers.filter(
    (v) =>
      v.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { title: "Mã KM", dataIndex: "code", key: "code" },
    { title: "Tên chương trình", dataIndex: "campaign_name", key: "campaign_name" },
    { title: "Tên khuyến mãi", dataIndex: "title", key: "title" },
    { title: "Mô tả", dataIndex: "description", key: "description" },
    {
      title: "% KM",
      dataIndex: "discount_percent",
      key: "discount_percent",
      render: (val) => (val ? `${val}%` : "-"),
    },
    {
      title: "Điều kiện",
      dataIndex: "min_order_value",
      key: "min_order_value",
      render: (val) =>
        val ? `Đơn tối thiểu ${val.toLocaleString("vi-VN")}` : "-",
    },
    {
      title: "Thời gian",
      key: "time",
      render: (_, v) =>
        `${new Date(v.start_at).toLocaleDateString()} → ${new Date(
          v.end_at
        ).toLocaleDateString()}`,
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, v) => {
        const now = new Date();
        const end = new Date(v.end_at);
        const isExpired = end < now;
        return isExpired ? (
          <Tag color="red">Hết hạn</Tag>
        ) : (
          <Tag color="green">Đang áp dụng</Tag>
        );
      },
    },
    {
      title: "Kênh áp dụng",
      dataIndex: "scope",
      key: "scope",
      render: (val) => (val === "system" ? "Hệ thống" : "Seller"),
    },
    {
      title: "Người tạo",
      dataIndex: "seller_name",
      key: "seller_name",
      render: (val) => val || "Admin Hệ Thống",
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, v) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(v)} />
          <Popconfirm
            title="Bạn có chắc muốn xóa?"
            onConfirm={() => handleDelete(v.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Input.Search
          placeholder="Tìm theo mã, tên chương trình hoặc tên khuyến mãi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 300 }}
        />
        <Button type="primary" onClick={() => setShowModal(true)}>
          + Tạo khuyến mãi
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredVouchers}
        loading={loading}
        rowKey="id"
        bordered
      />

      <Modal
        title={editingVoucher ? "✏️ Sửa khuyến mãi" : "+ Thêm khuyến mãi mới"}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingVoucher(null);
          form.resetFields();
        }}
        onOk={handleCreateOrUpdate}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Mã khuyến mãi"
            name="code"
            rules={[{ required: true, message: "Vui lòng nhập mã khuyến mãi" }]}
          >
            <Input placeholder="Ví dụ: SALE50" />
          </Form.Item>

          <Form.Item
            label="Tên chương trình"
            name="campaign_name"
            rules={[{ required: true, message: "Vui lòng nhập tên chương trình" }]}
          >
            <Input placeholder="Nhập tên chương trình" />
          </Form.Item>

          <Form.Item
            label="Tên khuyến mãi"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tên khuyến mãi" }]}
          >
            <Input placeholder="Ví dụ: Giảm 10% cho đơn từ 200k" />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} placeholder="Nhập mô tả chi tiết" />
          </Form.Item>

          <Form.Item label="% Khuyến mãi" name="discount_percent">
            <InputNumber
              style={{ width: "100%" }}
              min={1}
              max={100}
              parser={(value) => value.replace("%", "")}
              formatter={(value) => `${value}%`}
            />
          </Form.Item>

          <Form.Item label="Đơn hàng tối thiểu" name="min_order_value">
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              step={1000}
              parser={(value) => value.replace(/\./g, "")}
              formatter={(value) =>
                value.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
              }
            />
          </Form.Item>

          <Form.Item
            label="Thời gian áp dụng"
            name="dateRange"
            rules={[{ required: true, message: "Vui lòng chọn thời gian" }]}
          >
            <RangePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item label="Kênh áp dụng" name="scope" initialValue="system">
            <Select>
              <Select.Option value="system">Hệ thống</Select.Option>
              <Select.Option value="seller">Seller</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PromotionsPage;
