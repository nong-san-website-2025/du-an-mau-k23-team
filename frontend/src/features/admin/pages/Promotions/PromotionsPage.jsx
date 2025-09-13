import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Space,
  Tag,
  message,
  Row,
  Col,
} from "antd";
import {
  getPromotions,
  getVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher,
} from "../../services/promotionServices";
import dayjs from "dayjs";
import axios from "axios";

const { RangePicker } = DatePicker;

export default function PromotionsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();

  // load list
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token"); // đúng key
      const res = await axios.get(
        "http://127.0.0.1:8000/api/promotions/overview/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRowClick = async (record) => {
    try {
      const id = record.id.split("-")[1]; // voucher-12 -> 12
      const detailData = await getVoucher(id);
      setDetail(detailData);
      setModalOpen(true);
    } catch (err) {
      message.error("Không tải được chi tiết voucher");
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setDetail(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        code: values.code,
        title: values.title,
        voucher_type: values.voucherType,
        discount_percent:
          values.voucherType === "normal" && values.discountType === "percent"
            ? values.discountValue
            : null,
        discount_amount:
          values.voucherType === "normal" && values.discountType === "amount"
            ? values.discountValue
            : null,
        freeship_amount:
          values.voucherType === "freeship" ? values.discountValue : null,
        min_order_value: values.minOrderValue,
        start_at: values.dateRange ? values.dateRange[0].toISOString() : null,
        end_at: values.dateRange ? values.dateRange[1].toISOString() : null,
        active: true,
      };

      if (detail) {
        await updateVoucher(detail.id, payload);
        message.success("Cập nhật voucher thành công");
      } else {
        await createVoucher(payload);
        message.success("Tạo voucher thành công");
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("❌ Backend trả lỗi:", err.response?.data);
      if (err.response?.data?.code) {
        message.error(err.response.data.code[0]); // 👉 hiện ra: voucher with this code already exists
      } else {
        message.error("Có lỗi khi lưu voucher");
      }
    }
  };

  const handleDelete = async () => {
    if (!detail) return;
    try {
      await deleteVoucher(detail.id);
      message.success("Đã xóa voucher");
      setModalOpen(false);
      fetchData();
    } catch (err) {
      message.error("Không xóa được voucher");
    }
  };

  const handleFilter = async () => {
    const values = filterForm.getFieldsValue();
    const filters = {
      voucherType: values.voucherType || undefined,
      minOrderValue: values.minOrderValue || undefined,
      status: values.status || undefined,
      startDate:
        values.dateRange && values.dateRange[0]
          ? values.dateRange[0].toISOString()
          : undefined,
      endDate:
        values.dateRange && values.dateRange[1]
          ? values.dateRange[1].toISOString()
          : undefined,
    };
    fetchData(filters);
  };

  const columns = [
    {
      title: "Mã",
      dataIndex: "code",
    },
    {
      title: "Tên",
      dataIndex: "name",
    },
    {
      title: "Loại voucher",
      dataIndex: "voucher_type",
      render: (val) =>
        val === "freeship" ? (
          <Tag color="purple">Miễn ship</Tag>
        ) : (
          <Tag color="blue">Thường</Tag>
        ),
    },
    {
      title: "Loại giảm",
      dataIndex: "discount_type",
      render: (val) => (val ? <Tag color="cyan">{val}</Tag> : "-"),
    },
    {
      title: "Bắt đầu",
      dataIndex: "start",
      render: (val) => (val ? dayjs(val).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Kết thúc",
      dataIndex: "end",
      render: (val) => (val ? dayjs(val).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      render: (val) =>
        val ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Tắt</Tag>,
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      {/* Bộ lọc */}
      {/* Bộ lọc */}
      <Form form={filterForm} layout="inline" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle" style={{ width: "100%" }}>
          <Col>
            <Form.Item name="voucherType" label="Loại voucher">
              <Select placeholder="Chọn loại" style={{ width: 160 }}>
                <Select.Option value="normal">Voucher thường</Select.Option>
                <Select.Option value="freeship">
                  Voucher miễn ship
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col>
            <Form.Item name="minOrderValue" label="Giá trị đơn tối thiểu">
              <InputNumber placeholder=">= ..." style={{ width: 160 }} />
            </Form.Item>
          </Col>

          <Col>
            <Form.Item name="status" label="Trạng thái">
              <Select placeholder="Chọn" style={{ width: 140 }}>
                <Select.Option value="active">Hoạt động</Select.Option>
                <Select.Option value="inactive">Tắt</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col>
            <Form.Item name="dateRange" label="Thời gian áp dụng">
              <RangePicker />
            </Form.Item>
          </Col>

          <Col>
            <Space>
              <Button type="primary" onClick={handleFilter}>
                Lọc
              </Button>
              <Button onClick={() => fetchData()}>Xóa lọc</Button>
            </Space>
          </Col>
        </Row>
      </Form>

      {/* Action */}
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleCreate}>
          + Tạo Voucher
        </Button>
        <Button onClick={fetchData}>Làm mới</Button>
      </Space>

      {/* Bảng */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
        })}
      />

      {/* Modal tạo/sửa voucher */}
      <Modal
        title={detail ? "Chi tiết Voucher" : "Tạo Voucher"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText="Lưu"
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)}>
            Hủy
          </Button>,
          detail && (
            <Button danger key="delete" onClick={handleDelete}>
              Xóa
            </Button>
          ),
          <Button type="primary" key="save" onClick={handleSubmit}>
            Lưu
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={
            detail
              ? {
                  code: detail.code,
                  title: detail.title,
                  voucherType: detail.voucher_type,
                  discountType: detail.discount_type,
                  discountValue:
                    detail.discount_percent ||
                    detail.discount_amount ||
                    detail.freeship_amount,
                  minOrderValue: detail.min_order_value,
                  dateRange:
                    detail.start_at && detail.end_at
                      ? [dayjs(detail.start_at), dayjs(detail.end_at)]
                      : null,
                }
              : {}
          }
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã voucher"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="title" label="Tên voucher">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="voucherType"
                label="Loại voucher"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="normal">Voucher thường</Select.Option>
                  <Select.Option value="freeship">
                    Voucher miễn ship
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discountType"
                label="Loại giảm"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="percent">Phần trăm</Select.Option>
                  <Select.Option value="amount">Số tiền</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="discountValue"
                label="Giá trị giảm"
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="minOrderValue" label="Giá trị đơn tối thiểu">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="dateRange" label="Thời gian áp dụng">
                <RangePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
