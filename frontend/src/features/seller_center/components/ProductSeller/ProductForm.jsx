import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Typography,
  Row,
  Col,
  Card,
  Divider,
  Radio,
  Space,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

// 🟢 REGEX: Cho phép Tiếng Việt, Số, Khoảng trắng và các dấu cơ bản (., - & ())
// Chặn các ký tự đặc biệt như @ # $ % ^ * [ ] { } < >
const VIETNAMESE_REGEX = /^[a-zA-Z0-9\s\u00C0-\u1EF9\(\)\,\.\-\&]+$/;

const ProductForm = ({ visible, onCancel, onSubmit, initialValues, categories = [] }) => {
  const [form] = Form.useForm();
  const [availability, setAvailability] = useState("available");

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);

  const [fileList, setFileList] = useState([]);
  const [primaryImage, setPrimaryImage] = useState(null);

  // Xử lý logic Category
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    const selected = categories.find((cat) => cat.id === categoryId);
    setSubcategories(selected?.subcategories || []);
    form.setFieldsValue({ subcategory: undefined });
  };

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        // --- CHẾ ĐỘ EDIT ---
        form.setFieldsValue({
          ...initialValues,
          availability_status: initialValues.availability_status || "available",
          unit: initialValues.unit || "kg",
        });
        setAvailability(initialValues.availability_status || "available");

        if (initialValues.images && initialValues.images.length > 0) {
          const gallery = initialValues.images.map((img, idx) => ({
            uid: String(img.id),
            name: `Ảnh ${idx + 1}`,
            status: "done",
            url: img.image,
            is_primary: img.is_primary,
          }));
          setFileList(gallery);
          const primary = gallery.find((img) => img.is_primary);
          setPrimaryImage(primary ? primary.uid : gallery[0].uid);
        } else {
          setFileList([]);
          setPrimaryImage(null);
        }

        if (categories.length > 0 && initialValues.subcategory) {
          const foundCategory = categories.find((cat) =>
            cat.subcategories?.some((sub) => sub.id === initialValues.subcategory)
          );
          if (foundCategory) {
            setSelectedCategory(foundCategory.id);
            setSubcategories(foundCategory.subcategories || []);
            form.setFieldsValue({ category: foundCategory.id });
          }
        }
      } else {
        // --- CHẾ ĐỘ ADD NEW ---
        form.resetFields();
        setAvailability("available");
        setFileList([]);
        setPrimaryImage(null);
        setSelectedCategory(null);
        setSubcategories([]);
        form.setFieldsValue({ unit: 'kg', stock: 0, availability_status: 'available' });
      }
    }
  }, [visible, initialValues, categories, form]);

  const handleAvailabilityChange = (value) => {
    setAvailability(value);
    form.setFieldsValue({ availability_status: value });
  };

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        if (!values.original_price || values.original_price <= 0) {
          message.error("Vui lòng nhập giá gốc hợp lệ!");
          return;
        }
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
          if (key === 'original_price') {
            formData.append(key, value);
          } else if (value !== undefined && value !== null) {
            formData.append(key, value);
          }
        });
        
        if (!formData.has('original_price')) {
          message.error("Lỗi: Giá gốc không được gửi!");
          return;
        }

        const primaryFile = fileList.find((file) => file.uid === primaryImage);
        if (primaryFile?.originFileObj) {
          formData.append("image", primaryFile.originFileObj);
        }

        const newImages = fileList.filter(f => f.originFileObj && f.uid !== primaryImage);
        newImages.forEach((file) => {
          formData.append('images', file.originFileObj);
        });

        onSubmit(formData);
      })
      .catch((err) => {
        message.error("Vui lòng kiểm tra lại các trường báo đỏ!");
        console.log(err);
      });
  };

  return (
    <Modal
      open={visible}
      centered
      title={
        <Title level={4} style={{ margin: 0 }}>
          {initialValues ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
        </Title>
      }
      okText={initialValues ? "Lưu thay đổi" : "Thêm sản phẩm"}
      cancelText="Hủy"
      onCancel={onCancel}
      onOk={handleOk}
      width={1200}
      style={{ top: 20 }}
      destroyOnClose
      maskClosable={false}
      styles={{ body: { maxHeight: "80vh", overflowY: "auto", padding: "24px" } }}
    >
      <Form
        form={form}
        layout="vertical"
        name="productForm"
        initialValues={{ availability_status: "available", unit: "kg" }}
      >
        <Row gutter={24}>
          <Col xs={24} md={10}>
            <Card
              title="Thư viện ảnh sản phẩm"
              bordered={false}
              style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
              extra={<Text type="secondary">Tối đa 6 ảnh</Text>}
            >
              <Upload
                listType="picture-card"
                beforeUpload={() => false}
                fileList={fileList}
                onChange={({ fileList: newList }) => setFileList(newList)}
                multiple
                maxCount={6}
              >
                {fileList.length < 6 && (
                  <div>
                    <UploadOutlined style={{ fontSize: 20 }} />
                    <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                  </div>
                )}
              </Upload>
              {fileList.length > 0 && (
                <>
                  <Divider orientation="left" style={{ margin: "12px 0" }}>
                    Chọn ảnh đại diện
                  </Divider>
                  <Radio.Group
                    value={primaryImage}
                    onChange={(e) => setPrimaryImage(e.target.value)}
                  >
                    <Space wrap>
                      {fileList.map((file) => (
                        <Radio key={file.uid} value={file.uid}>
                          <img
                            src={file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : '')}
                            alt="img"
                            style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: primaryImage === file.uid ? "2px solid #1677ff" : "1px solid #ccc" }}
                          />
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                </>
              )}
            </Card>
          </Col>

          <Col xs={24} md={14}>
            <Card
              title="Thông tin cơ bản"
              bordered={false}
              style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: 16 }}
            >
              {/* 🛡️ VALIDATE TÊN SẢN PHẨM */}


              {/* 🛡️ VALIDATE THƯƠNG HIỆU & XUẤT XỨ */}
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="Tên sản phẩm"
                    name="name"
                    rules={[
                      { required: true, message: "Vui lòng nhập tên sản phẩm" },
                      { whitespace: true, message: "Tên không được để trống" },
                      { min: 10, message: "Tên sản phẩm quá ngắn (tối thiểu 10 ký tự)" },
                      { max: 255, message: "Tên sản phẩm quá dài (tối đa 255 ký tự)" },
                      {
                        pattern: VIETNAMESE_REGEX,
                        message: "Tên không được chứa ký tự đặc biệt (@, #, $, <, >...)"
                      }
                    ]}
                  >
                    <Input placeholder="VD: Gạo ST25 Ông Cua Chính Hãng..." count={{ show: true, max: 255 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Nơi sản xuất / Xuất xứ"
                    name="location"
                    rules={[
                      { max: 100, message: "Tối đa 100 ký tự" },
                      { pattern: VIETNAMESE_REGEX, message: "Không chứa ký tự lạ" }
                    ]}
                  >
                    <Input placeholder="VD: Đà Lạt, Bến Tre..." count={{ show: true, max: 100 }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="Danh mục"
                    name="category"
                    rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
                  >
                    <Select
                      placeholder="Chọn danh mục"
                      onChange={handleCategoryChange}
                      loading={categories.length === 0}
                    >
                      {categories.map((cat) => (
                        <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Nhóm sản phẩm"
                    name="subcategory"
                    rules={[{ required: true, message: "Vui lòng chọn nhóm" }]}
                  >
                    <Select
                      placeholder={selectedCategory ? "Chọn nhóm sản phẩm" : "Chọn danh mục trước"}
                      disabled={!selectedCategory}
                    >
                      {subcategories.map((sub) => (
                        <Option key={sub.id} value={sub.id}>{sub.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="Giá gốc (VNĐ)"
                    name="original_price"
                    initialValue={initialValues?.original_price || null}
                    rules={[
                      { required: true, message: "Vui lòng nhập giá gốc" },
                      { type: 'number', min: 1000, message: "Giá tối thiểu là 1,000đ" },
                      { type: 'number', max: 1000000000, message: "Giá trị quá lớn" }
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="Nhập giá gốc (VD: 50000)"
                      formatter={(v) => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
                      parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Giá khuyến mãi"
                    name="discounted_price"
                    dependencies={['original_price']}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('original_price') >= value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Giá KM phải nhỏ hơn giá gốc!'));
                        },
                      }),
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Tồn kho" name="stock" initialValue={0}>
                    <InputNumber style={{ width: "100%" }} min={0} max={999999} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Đơn vị tính" name="unit" initialValue="kg">
                    <Select>
                      <Option value="kg">Kilogram (kg)</Option>
                      <Option value="g">Gram (g)</Option>
                      <Option value="l">Lít (l)</Option>
                      <Option value="ml">Milliliter (ml)</Option>
                      <Option value="unit">Cái / Chiếc</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              title="Thông tin chi tiết"
              bordered={false}
              style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
            >
              <Form.Item
                label="Trạng thái hàng hóa"
                name="availability_status"
                rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
              >
                <Select onChange={handleAvailabilityChange}>
                  <Option value="available">Có sẵn</Option>
                  <Option value="coming_soon">Sắp có (Mùa vụ)</Option>
                  <Option value="out_of_stock">Hết hàng</Option>
                </Select>
              </Form.Item>

              {/* 🛡️ VALIDATE MÔ TẢ */}
              <Form.Item
                label="Mô tả sản phẩm"
                name="description"
                rules={[
                  { required: true, message: "Vui lòng nhập mô tả" },
                  { min: 20, message: "Mô tả quá ngắn, hãy viết chi tiết hơn (tối thiểu 20 ký tự)" }
                ]}
              >
                <TextArea
                  rows={5}
                  placeholder="Nhập mô tả chi tiết, thành phần, hướng dẫn sử dụng..."
                  showCount
                  maxLength={5000}
                />
              </Form.Item>

              {availability === "coming_soon" && (
                <>
                  <Divider orientation="left">🗓️ Thông tin Mùa vụ</Divider>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label="Bắt đầu mùa vụ" name="season_start">
                        <Input type="date" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Kết thúc mùa vụ" name="season_end">
                        <Input type="date" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    label="Sản lượng dự kiến (Cho phép đặt trước)"
                    name="estimated_quantity"
                    help="Khách hàng có thể đặt trước tối đa số lượng này"
                  >
                    <InputNumber style={{ width: "100%" }} min={0} />
                  </Form.Item>
                </>
              )}
            </Card>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default ProductForm;