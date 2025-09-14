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
  const [modalOpen, setModalOpen] = useState(false); // create / edit modal
  const [detail, setDetail] = useState(null); // currently editing item
  const [detailModalOpen, setDetailModalOpen] = useState(false); // view-only modal
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();

  // --- Fetch list with optional filters ---
  const fetchData = async (filters = {}) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Note: gửi params lên backend. Nếu backend dùng tên param khác, đổi ở đây.
      const res = await axios.get(
        "http://127.0.0.1:8000/api/promotions/overview/",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: filters,
        }
      );

      // Map lại một chút để đảm bảo các field cần thiết luôn có:
      const mapped = Array.isArray(res.data)
        ? res.data.map((item) => ({
            ...item,
            // try normalize name/title
            title: item.title ?? item.name ?? "",
            name: item.name ?? item.title ?? "",
            // normalize start/end fields from possible different backend keys
            start: item.start_at ?? item.start ?? item.start_date ?? null,
            end: item.end_at ?? item.end ?? item.end_date ?? null,
            description: item.description ?? item.note ?? "",
            usage_limit: item.usage_limit ?? item.usageLimit ?? null,
          }))
        : [];

      setData(mapped);
    } catch (err) {
      console.error("Fetch promotions error:", err);
      // show status if server responded
      if (err.response) {
        console.error("Request URL:", err.config?.url || err.request?.responseURL);
        message.error(
          `Lỗi tải dữ liệu: ${err.response.status} ${err.response.statusText}`
        );
      } else {
        message.error("Không thể kết nối tới server");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Helpers to normalize id (some of your code used 'voucher-12' style ids) ---
  const extractId = (rawId) => {
    if (!rawId) return rawId;
    if (typeof rawId === "string" && rawId.includes("-")) {
      const parts = rawId.split("-");
      const last = parts[parts.length - 1];
      // if last is numeric string return as-is else return rawId
      return /^\d+$/.test(last) ? last : rawId;
    }
    return rawId;
  };

  // --- Show view-only detail modal ---
  const handleViewDetail = async (record) => {
    try {
      const id = extractId(record.id);
      const detailData = await getVoucher(id);
      // normalize detail mapping same as list
      const normalized = {
        ...detailData,
        title: detailData.title ?? detailData.name ?? "",
        description: detailData.description ?? detailData.note ?? "",
        usage_limit: detailData.usage_limit ?? detailData.usageLimit ?? null,
      };
      setDetail(normalized);
      setDetailModalOpen(true);
    } catch (err) {
      console.error("Load detail error:", err);
      message.error("Không tải được chi tiết voucher");
    }
  };

  // --- Delete (with confirm) ---
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
          fetchData(filterForm.getFieldsValue()); // refresh with current filters if any
        } catch (err) {
          console.error("Delete error:", err);
          if (err?.response?.status === 404) {
            message.error("Không tìm thấy voucher (404). Kiểm tra endpoint.");
          } else {
            message.error("Không xóa được voucher");
          }
        }
      },
    });
  };

  const handleCreate = () => {
    form.resetFields();
    setDetail(null);
    setModalOpen(true);
  };

  // Submit create/update
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
      if (err.response?.data?.code) {
        message.error(err.response.data.code[0]);
      } else {
        message.error("Có lỗi khi lưu voucher");
      }
    }
  };

  // --- Filter handling ---
  const handleFilter = async () => {
    const values = filterForm.getFieldsValue();
    // Build params for backend. IMPORTANT: nếu backend dùng tên param khác, đổi key ở đây.
    const params = {};
    if (values.search) {
      // send both 'search' and 'name' in case backend expects one of them
      params.search = values.search;
      params.name = values.search; // backend might expect 'name' or 'search' - adjust if needed
    }
    if (values.voucherType) params.voucher_type = values.voucherType;
    if (values.minOrderValue || values.minOrderValue === 0)
      params.min_order_value = values.minOrderValue;
    if (values.status)
      params.active = values.status === "active" ? true : values.status === "inactive" ? false : undefined;
    if (values.dateRange && values.dateRange.length === 2) {
      params.start_date = values.dateRange[0].toISOString();
      params.end_date = values.dateRange[1].toISOString();
    }
    // call fetch with params
    fetchData(params);
  };

  const handleClearFilter = () => {
    filterForm.resetFields();
    fetchData(); // without filters
  };

  // Action menu for each row
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
      render: (val) => (val === "freeship" ? <Tag>Miễn ship</Tag> : <Tag>Thường</Tag>),
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
      render: (val) => (val ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Tắt</Tag>),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Dropdown overlay={actionMenu(record)} trigger={["click"]}>
          <Button>⋮</Button>
        </Dropdown>
      ),
    },
  ];

  // Build footer array for edit/create modal (avoid inline conditional array to satisfy ESLint)
  const editModalFooter = (() => {
    const arr = [
      <Button key="cancel" onClick={() => setModalOpen(false)}>
        Hủy
      </Button>,
    ];
    if (detail) {
      arr.push(
        <Button danger key="delete" onClick={() => handleDelete(detail)}>
          Xóa
        </Button>
      );
    }
    arr.push(
      <Button type="primary" key="save" onClick={handleSubmit}>
        Lưu
      </Button>
    );
    return arr;
  })();

  const detailModalFooter = [<Button key="close" onClick={() => setDetailModalOpen(false)}>Đóng</Button>];

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
                <Select.Option value="freeship">Voucher miễn ship</Select.Option>
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
              <Button onClick={handleClearFilter}>Xóa lọc</Button>
            </Space>
          </Col>
        </Row>
      </Form>

      {/* Actions */}
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleCreate}>
          + Tạo Voucher
        </Button>
        <Button onClick={() => fetchData(filterForm.getFieldsValue())}>Làm mới</Button>
      </Space>

      {/* Table */}
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} />

      {/* Create / Edit modal */}
      <Modal
        title={detail ? "Chi tiết Voucher" : "Tạo Voucher"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={editModalFooter}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={
            detail
              ? {
                  code: detail.code,
                  title: detail.title,
                  description: detail.description,
                  usageLimit: detail.usage_limit,
                  voucherType: detail.voucher_type,
                  discountType: detail.discount_type,
                  discountValue:
                    detail.discount_percent ?? detail.discount_amount ?? detail.freeship_amount,
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
              <Form.Item name="code" label="Mã voucher" rules={[{ required: true }]}>
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="voucherType" label="Loại voucher" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="normal">Voucher thường</Select.Option>
                  <Select.Option value="freeship">Voucher miễn ship</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discountType" label="Loại giảm" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="percent">Phần trăm</Select.Option>
                  <Select.Option value="amount">Số tiền</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="discountValue" label="Giá trị giảm" rules={[{ required: true }]}>
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
            <Descriptions.Item label="Mô tả">{detail.description || "-"}</Descriptions.Item>
            <Descriptions.Item label="Giới hạn sử dụng">{detail.usage_limit ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Loại">{detail.voucher_type}</Descriptions.Item>
            <Descriptions.Item label="Loại giảm">{detail.discount_type ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Giá trị giảm">
              {detail.discount_percent ?? detail.discount_amount ?? detail.freeship_amount ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Giá trị đơn tối thiểu">{detail.min_order_value ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Bắt đầu">
              {detail.start_at ? dayjs(detail.start_at).format("DD/MM/YYYY HH:mm") : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Kết thúc">
              {detail.end_at ? dayjs(detail.end_at).format("DD/MM/YYYY HH:mm") : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">{detail.active ? "Hoạt động" : "Tắt"}</Descriptions.Item>
          </Descriptions>
        ) : (
          "Đang tải..."
        )}
      </Modal>
    </div>
  );
}
