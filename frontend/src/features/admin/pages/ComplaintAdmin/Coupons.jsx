import React, { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Tag,
  Space,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const Coupons = () => {
  const [visible, setVisible] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [coupons, setCoupons] = useState([
    {
      key: "1",
      code: "SALE50",
      discount: 50,
      expire: "2025-12-31",
    },
    {
      key: "2",
      code: "FREESHIP",
      discount: 100,
      expire: "2025-09-01",
    },
  ]);

  const [form] = Form.useForm();

  // 🟢 Tính trạng thái dựa theo ngày hết hạn
  const getStatus = (expire) => {
    return new Date(expire) >= new Date() ? "Hoạt động" : "Hết hạn";
  };

  const columns = [
    {
      title: "Mã giảm giá",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Giảm (%)",
      dataIndex: "discount",
      key: "discount",
      render: (value) => `${value}%`,
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "expire",
      key: "expire",
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => {
        const status = getStatus(record.expire);
        return status === "Hoạt động" ? (
          <Tag color="green">{status}</Tag>
        ) : (
          <Tag color="red">{status}</Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.key)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  // 🟢 Thêm hoặc cập nhật mã giảm giá
  const handleFinish = (values) => {
    if (editingCoupon) {
      // cập nhật
      setCoupons(
        coupons.map((c) =>
          c.key === editingCoupon.key
            ? {
                ...c,
                code: values.code,
                discount: values.discount,
                expire: values.expire.format("YYYY-MM-DD"),
              }
            : c
        )
      );
      message.success("Đã cập nhật mã giảm giá!");
    } else {
      // thêm mới
      const newCoupon = {
        key: Date.now().toString(),
        code: values.code,
        discount: values.discount,
        expire: values.expire.format("YYYY-MM-DD"),
      };
      setCoupons([...coupons, newCoupon]);
      message.success("Đã thêm mã giảm giá!");
    }
    setVisible(false);
    form.resetFields();
    setEditingCoupon(null);
  };

  // 🟢 Xóa coupon
  const handleDelete = (key) => {
    Modal.confirm({
      title: "Xác nhận xóa?",
      content: "Bạn có chắc muốn xóa mã giảm giá này?",
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: () => {
        setCoupons(coupons.filter((c) => c.key !== key));
        message.success("Đã xóa mã giảm giá!");
      },
    });
  };

  // 🟢 Sửa coupon
  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setVisible(true);
    form.setFieldsValue({
      code: coupon.code,
      discount: coupon.discount,
      expire: dayjs(coupon.expire),
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🎁 Mã giảm giá hệ thống</h2>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          setVisible(true);
          setEditingCoupon(null);
          form.resetFields();
        }}
        style={{ marginBottom: 16 }}
      >
        Thêm mã giảm giá
      </Button>

      <Table columns={columns} dataSource={coupons} bordered />

      <Modal
        title={editingCoupon ? "Sửa mã giảm giá" : "Thêm mã giảm giá"}
        open={visible}
        onCancel={() => {
          setVisible(false);
          setEditingCoupon(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="code"
            label="Mã giảm giá"
            rules={[{ required: true, message: "Nhập mã giảm giá!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="discount"
            label="Giảm (%)"
            rules={[{ required: true, message: "Nhập mức giảm!" }]}
          >
            <InputNumber min={1} max={100} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="expire"
            label="Ngày hết hạn"
            rules={[{ required: true, message: "Chọn ngày hết hạn!" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingCoupon ? "Cập nhật" : "Lưu"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Coupons;
