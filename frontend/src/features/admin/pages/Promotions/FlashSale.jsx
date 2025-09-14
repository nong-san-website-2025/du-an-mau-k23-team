import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Popconfirm,
  Select,
  Space,
  message,
  Row,
  Col,
  DatePicker,
} from "antd";
import {
  getFlashSales,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
} from "../../services/promotionServices";
import dayjs from "dayjs";

const { Search } = Input;

const FlashSale = () => {
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);

  const [products, setProducts] = useState([]);

  // Load Flash Sales
  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const data = await getFlashSales();
      setFlashSales(data);
    } catch (error) {
      message.error("Không tải được danh sách Flash Sale");
    } finally {
      setLoading(false);
    }
  };

  // Load danh sách sản phẩm
  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/products/");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      message.error("Không tải được danh sách sản phẩm");
    }
  };

  useEffect(() => {
    fetchFlashSales();
    fetchProducts();
  }, []);

  const filteredData = flashSales.filter((item) => {
    const matchSearch = item.name
      ?.toLowerCase()
      .includes(searchText.toLowerCase());
    const matchStatus = filterStatus ? item.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const handleOpenModal = (record = null) => {
    setEditing(record);
    if (record) {
      form.setFieldsValue({
        ...record,
        start_time: dayjs(record.start_time),
        end_time: dayjs(record.end_time),
      });
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        start_time: values.start_time.toISOString(),
        end_time: values.end_time.toISOString(),
        items: [
          {
            product_id: values.product_id,
            sale_price: Number(values.sale_price),
            quantity: Number(values.quantity),
          },
        ],
      };

      if (editing) {
        await updateFlashSale(editing.id, payload);
        message.success("Cập nhật Flash Sale thành công");
      } else {
        await createFlashSale(payload);
        message.success("Thêm Flash Sale thành công");
      }

      setModalOpen(false);
      fetchFlashSales();
    } catch (error) {
      message.error("Lưu Flash Sale thất bại");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteFlashSale(id);
      message.success("Xoá Flash Sale thành công");
      fetchFlashSales();
    } catch (error) {
      message.error("Xoá Flash Sale thất bại");
    }
  };

  const columns = [
    {
      title: "Chiến dịch",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Sản phẩm",
      render: (record) => record.items?.map((i) => i.product?.name).join(", ") || "—",
    },
    {
      title: "Giá Flash Sale",
      render: (record) =>
        record.items?.map((i) => `${i.sale_price}₫`).join(", ") || "—",
    },
    {
      title: "Thời gian",
      render: (record) => (
        <>
          {dayjs(record.start_time).format("DD/MM/YYYY HH:mm")} →{" "}
          {dayjs(record.end_time).format("DD/MM/YYYY HH:mm")}
        </>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (record) => (
        <Space>
          <Button type="link" onClick={() => handleOpenModal(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xoá?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger>
              Xoá
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>Quản lý Flash Sale</h2>
      <Space style={{ marginBottom: 16 }}>
        <Search
          placeholder="Tìm theo tên chiến dịch..."
          onSearch={(value) => setSearchText(value)}
          allowClear
        />
        <Button type="primary" onClick={() => handleOpenModal()}>
          Thêm Flash Sale
        </Button>
        <Button onClick={() => fetchFlashSales()}>Làm mới</Button>
      </Space>

      <Table
        dataSource={filteredData}
        columns={columns}
        rowKey="id"
        loading={loading}
      />

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        title={editing ? "Sửa Flash Sale" : "Thêm Flash Sale"}
        width={900}
      >
        <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Chiến dịch"
                rules={[{ required: true, message: "Nhập tên chiến dịch" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="product_id"
                label="Sản phẩm"
                rules={[{ required: true, message: "Chọn sản phẩm" }]}
              >
                <Select>
                  {products.map((p) => (
                    <Select.Option key={p.id} value={p.id}>
                      {p.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sale_price"
                label="Giá Flash Sale"
                rules={[{ required: true, message: "Nhập giá" }]}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Số lượng"
                rules={[{ required: true, message: "Nhập số lượng" }]}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_time"
                label="Bắt đầu"
                rules={[{ required: true, message: "Chọn thời gian bắt đầu" }]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: "100%" }}
                  disabledDate={(current) =>
                    form.getFieldValue("end_time") &&
                    current > form.getFieldValue("end_time")
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_time"
                label="Kết thúc"
                dependencies={["start_time"]}
                rules={[
                  { required: true, message: "Chọn thời gian kết thúc" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || value.isAfter(getFieldValue("start_time"))) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Thời gian kết thúc phải sau thời gian bắt đầu")
                      );
                    },
                  }),
                ]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default FlashSale;
