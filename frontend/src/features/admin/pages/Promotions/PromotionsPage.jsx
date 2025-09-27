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
  Dropdown,
  Menu,
  Descriptions,
} from "antd";
import { MoreOutlined } from "@ant-design/icons";
import {
  getPromotionsOverview,
  getVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher,
} from "../../services/promotionServices";
import dayjs from "dayjs";
import { getCategories } from "../../services/products";

const { RangePicker } = DatePicker;

export default function PromotionsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [allCategorySelected, setAllCategorySelected] = useState(false);

  useEffect(() => {
    getCategories().then((res) => setCategories(res));
  }, []);
  // --- Fetch list with optional filters ---
  const fetchData = async (filters = {}) => {
    setLoading(true);
    try {
      const res = await getPromotionsOverview(filters);

      const mapped = Array.isArray(res)
        ? res.map((item) => ({
            ...item,
            title: item.title ?? item.name ?? "",
            name: item.name ?? item.title ?? "",
            start: item.start_at ?? item.start ?? item.start_date ?? null,
            end: item.end_at ?? item.end ?? item.end_date ?? null,
            description: item.description ?? item.note ?? "",
            usage_limit: item.usage_limit ?? item.usageLimit ?? null,
          }))
        : [];

      setData(mapped);
    } catch (err) {
      console.error("Fetch promotions error:", err);
      message.error("Không thể tải danh sách khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Helpers ---
  const extractId = (rawId) => {
    if (!rawId) return rawId;
    if (typeof rawId === "string" && rawId.includes("-")) {
      const parts = rawId.split("-");
      const last = parts[parts.length - 1];
      return /^\d+$/.test(last) ? last : rawId;
    }
    return rawId;
  };

  // --- View detail ---
  const handleViewDetail = async (record) => {
    try {
      const id = extractId(record.id);
      const detailData = await getVoucher(id);

      const normalized = {
        ...detailData,
        title: detailData.title ?? detailData.name ?? "",
        description: detailData.description ?? detailData.note ?? "",
        usage_limit: detailData.usage_limit ?? detailData.usageLimit ?? null,
      };

      setDetail(normalized);

      form.setFieldsValue({
        code: normalized.code,
        title: normalized.title,
        description: normalized.description,
        usageLimit: normalized.usage_limit,
        voucherType: normalized.voucher_type,
        discountType: normalized.discount_type,
        discountValue:
          normalized.discount_percent ??
          normalized.discount_amount ??
          normalized.freeship_amount,
        minOrderValue: normalized.min_order_value,
        dateRange:
          normalized.start_at && normalized.end_at
            ? [dayjs(normalized.start_at), dayjs(normalized.end_at)]
            : null,
      });

      setModalOpen(true);
    } catch (err) {
      console.error("Load detail error:", err);
      message.error("Không tải được chi tiết voucher");
    }
  };

  // --- Delete ---
  const handleDelete = (record) => {
    const id = extractId(record.id);
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc muốn xóa voucher này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteVoucher(id);
          message.success("Đã xóa voucher");
          fetchData(filterForm.getFieldsValue());
        } catch (err) {
          console.error("Delete error:", err);
          message.error("Không xóa được voucher");
        }
      },
    });
  };

  // --- Create ---
  const handleCreate = () => {
    form.resetFields();
    setDetail(null);
    setModalOpen(true);
  };

  // --- Submit create/update ---
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        code: values.code,
        title: values.title,
        description: values.description,
        usage_limit: values.usageLimit,
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
        distribution_type: values.distributionType,
        total_quantity:
          values.distributionType === "claim" ? values.totalQuantity : null,
        per_user_quantity:
          values.distributionType === "direct" ? values.perUserQuantity : 1,
      };

      if (detail) {
        const id = extractId(detail.id);
        await updateVoucher(id, payload);
        message.success("Cập nhật voucher thành công");
      } else {
        await createVoucher(payload);
        message.success("Tạo voucher thành công");
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Save error:", err.response?.data ?? err);
      message.error("Có lỗi khi lưu voucher");
    }
  };

  // --- Filters ---
  const handleFilter = () => {
    const values = filterForm.getFieldsValue();
    const params = {};

    if (values.search) params.search = values.search;

    if (values.voucherType === "normal") {
      params.voucher_type = "normal"; // lọc theo loại voucher
    } else if (values.voucherType === "freeship") {
      params.discount_type = "freeship"; // lọc theo loại giảm
    }

    if (values.status) {
      params.active = values.status === "active";
    }

    fetchData(params);
  };

  const handleClearFilter = () => {
    filterForm.resetFields();
    fetchData();
  };

  // --- Table ---
  const actionMenu = (record) => (
    <Menu>
      <Menu.Item key="view" onClick={() => handleViewDetail(record)}>
        👁 Xem chi tiết
      </Menu.Item>
      <Menu.Item key="delete" danger onClick={() => handleDelete(record)}>
        🗑 Xóa
      </Menu.Item>
    </Menu>
  );

  const columns = [
    { title: "Mã", dataIndex: "code", key: "code" },
    { title: "Tên", dataIndex: "title", key: "title" },
    {
      title: "Loại voucher",
      dataIndex: "voucher_type",
      key: "voucher_type",
      render: (val) =>
        val === "freeship" ? <Tag>Miễn ship</Tag> : <Tag>Thường</Tag>,
    },
    {
      title: "Loại giảm",
      dataIndex: "discount_type",
      key: "discount_type",
      render: (val) => (val ? <Tag>{val}</Tag> : "-"),
    },
    {
      title: "Bắt đầu",
      dataIndex: "start",
      key: "start",
      render: (val) => (val ? dayjs(val).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Kết thúc",
      dataIndex: "end",
      key: "end",
      render: (val) => (val ? dayjs(val).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      render: (val) =>
        val ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Tắt</Tag>,
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Dropdown overlay={actionMenu(record)} trigger={["click"]}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const editModalFooter = [
    <Button key="cancel" onClick={() => setModalOpen(false)}>
      Hủy
    </Button>,
    detail && (
      <Button danger key="delete" onClick={() => handleDelete(detail)}>
        Xóa
      </Button>
    ),
    <Button type="primary" key="save" onClick={handleSubmit}>
      Lưu
    </Button>,
  ];

  const detailModalFooter = [
    <Button key="close" onClick={() => setDetailModalOpen(false)}>
      Đóng
    </Button>,
  ];

  return (
    <div style={{ padding: 20 }}>
      {/* Filter */}
      <Form form={filterForm} layout="inline" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle" style={{ width: "100%" }}>
          <Col>
            <Form.Item name="search" label="Tìm kiếm">
              <Input.Search
                placeholder="Tìm theo tên voucher"
                allowClear
                onSearch={handleFilter}
                style={{ width: 220 }}
              />
            </Form.Item>
          </Col>

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
            <Form.Item name="status" label="Trạng thái">
              <Select placeholder="Chọn" style={{ width: 140 }}>
                <Select.Option value="active">Hoạt động</Select.Option>
                <Select.Option value="inactive">Tắt</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col>
            <Space>
              <Button type="primary" htmlType="button" onClick={handleFilter}>
                Lọc
              </Button>
              <Button htmlType="button" onClick={handleClearFilter}>
                Xóa lọc
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>

      {/* Actions */}
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleCreate}>
          + Tạo Voucher
        </Button>
        <Button onClick={() => fetchData(filterForm.getFieldsValue())}>
          Làm mới
        </Button>
      </Space>

      {/* Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
      />

      {/* Create / Edit modal */}
      <Modal
        title={detail ? "Chi tiết Voucher" : "Tạo Voucher"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={editModalFooter}
        width={700}
      >
        <Form form={form} layout="vertical">
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
              <Form.Item name="description" label="Mô tả">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="usageLimit" label="Giới hạn sử dụng">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Form.Item
              name="categories"
              label="Áp dụng cho danh mục"
              rules={[
                {
                  required: true,
                  message: "Chọn ít nhất 1 danh mục hoặc Tất cả",
                },
              ]}
            >
              <Select
                mode="multiple"
                allowClear
                placeholder="Chọn danh mục áp dụng"
                value={allCategorySelected ? ["all"] : undefined}
                onChange={(vals) => {
                  if (vals.includes("all")) {
                    setAllCategorySelected(true);
                    form.setFieldsValue({ categories: ["all"] });
                  } else {
                    setAllCategorySelected(false);
                    form.setFieldsValue({ categories: vals });
                  }
                }}
              >
                <Select.Option value="all">Tất cả danh mục</Select.Option>
                {categories.map((cat) => (
                  <Select.Option key={cat.id} value={cat.id}>
                    {cat.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="distributionType"
                label="Phân phối"
                rules={[{ required: true, message: "Chọn nơi phân phối" }]}
              >
                <Select placeholder="Chọn nơi phân phối">
                  <Select.Option value="claim">Kho voucher</Select.Option>
                  <Select.Option value="direct">
                    Push vào tài khoản
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) =>
                  prev.distributionType !== curr.distributionType
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue("distributionType") === "claim" ? (
                    <Form.Item
                      name="totalQuantity"
                      label="Số lượng tổng"
                      rules={[
                        { required: true, message: "Nhập số lượng tổng" },
                      ]}
                    >
                      <InputNumber style={{ width: "100%" }} />
                    </Form.Item>
                  ) : (
                    <Form.Item
                      name="perUserQuantity"
                      label="Số lượng mỗi user"
                      initialValue={1}
                      rules={[
                        { required: true, message: "Nhập số lượng mỗi user" },
                      ]}
                    >
                      <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                  )
                }
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

      {/* Detail (read-only) modal */}
      <Modal
        title={`Chi tiết voucher: ${detail?.title ?? ""}`}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={detailModalFooter}
        width={700}
      >
        {detail ? (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
            <Descriptions.Item label="Mã">{detail.code}</Descriptions.Item>
            <Descriptions.Item label="Tên">{detail.title}</Descriptions.Item>
            <Descriptions.Item label="Mô tả">
              {detail.description || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Giới hạn sử dụng">
              {detail.usage_limit ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Loại">
              {detail.voucher_type}
            </Descriptions.Item>
            <Descriptions.Item label="Loại giảm">
              {detail.discount_type ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Giá trị giảm">
              {detail.discount_percent ??
                detail.discount_amount ??
                detail.freeship_amount ??
                "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Giá trị đơn tối thiểu">
              {detail.min_order_value ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Bắt đầu">
              {detail.start_at
                ? dayjs(detail.start_at).format("DD/MM/YYYY HH:mm")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Kết thúc">
              {detail.end_at
                ? dayjs(detail.end_at).format("DD/MM/YYYY HH:mm")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {detail.active ? "Hoạt động" : "Tắt"}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          "Đang tải..."
        )}
      </Modal>
    </div>
  );
}
