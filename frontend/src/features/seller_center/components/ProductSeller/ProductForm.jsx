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
  Alert,
} from "antd";
import { UploadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const VIETNAMESE_REGEX = /^[a-zA-Z0-9\s\u00C0-\u1EF9\(\)\,\.\-\&\/]+$/;

const ProductForm = ({
  visible,
  onCancel,
  onSubmit,
  initialValues,
  categories = [],
}) => {
  const [form] = Form.useForm();
  const [availability, setAvailability] = useState("available");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [primaryImage, setPrimaryImage] = useState(null);

  // --- LOGIC CHECK TỪ CHỐI ---
  const isRejected = initialValues?.status === "rejected";

  const getRejectReason = () => {
    if (!initialValues) return null;
    return (
      initialValues.reject_reason ||
      initialValues.admin_note ||
      initialValues.reason ||
      initialValues.note ||
      initialValues.message ||
      "Sản phẩm chưa đạt yêu cầu."
    );
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    const selected = categories.find((cat) => cat.id === categoryId);
    setSubcategories(selected?.subcategories || []);
    form.setFieldsValue({ subcategory: undefined });
  };

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        // --- EDIT MODE ---
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
            cat.subcategories?.some(
              (sub) => sub.id === initialValues.subcategory
            )
          );
          if (foundCategory) {
            setSelectedCategory(foundCategory.id);
            setSubcategories(foundCategory.subcategories || []);
            form.setFieldsValue({ category: foundCategory.id });
          }
        }
      } else {
        // --- ADD MODE ---
        form.resetFields();
        setAvailability("available");
        setFileList([]);
        setPrimaryImage(null);
        setSelectedCategory(null);
        setSubcategories([]);
        form.setFieldsValue({
          unit: "kg",
          stock: 0,
          availability_status: "available",
        });
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
        
        // 1. Đưa dữ liệu từ Form vào FormData
        Object.entries(values).forEach(([key, value]) => {
          if (key === "original_price") {
            formData.append(key, value);
          } else if (value !== undefined && value !== null) {
            formData.append(key, value);
          }
        });

        // 2. Xử lý ảnh
        const primaryFile = fileList.find((file) => file.uid === primaryImage);
        if (primaryFile?.originFileObj) {
          formData.append("image", primaryFile.originFileObj);
        }
        const newImages = fileList.filter(
          (f) => f.originFileObj && f.uid !== primaryImage
        );
        newImages.forEach((file) => {
          formData.append("images", file.originFileObj);
        });

        // 3. QUAN TRỌNG: Ghi đè status thành 'pending' nếu đang sửa hàng bị từ chối
        // Sử dụng .set() để đảm bảo nó ghi đè bất kỳ giá trị status nào trước đó
        if (isRejected) {
          console.log("Đang gửi duyệt lại sản phẩm bị từ chối..."); // Log kiểm tra
          formData.set("status", "pending"); 
          // Nếu backend của bạn dùng số: formData.set("status", 1); // 1 = pending
        }

        onSubmit(formData);
      })
      .catch((err) => {
        message.error("Vui lòng kiểm tra các trường nhập liệu!");
        console.error(err);
      });
  };

  return (
    <Modal
      open={visible}
      centered
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Title level={4} style={{ margin: 0 }}>
            {initialValues 
              ? (isRejected ? "Sửa & Gửi duyệt lại" : "Cập nhật sản phẩm") 
              : "Thêm sản phẩm mới"}
          </Title>
        </div>
      }
      okText={initialValues ? (isRejected ? "Gửi duyệt lại" : "Lưu thay đổi") : "Thêm sản phẩm"}
      cancelText="Hủy"
      onCancel={onCancel}
      onOk={handleOk}
      width={1200}
      style={{ top: 20 }}
      destroyOnClose
      maskClosable={false}
      styles={{
        body: { maxHeight: "80vh", overflowY: "auto", padding: "24px" },
      }}
    >
      {isRejected && (
        <Alert
          message="Sản phẩm này cần sửa để được duyệt lại"
          description={
            <div style={{ marginTop: 4 }}>
              <Text strong>Lý do Admin từ chối: </Text>
              <Text type="danger">{getRejectReason()}</Text>
              <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
                Sau khi sửa thông tin, nhấn nút <b>"Gửi duyệt lại"</b> để chuyển trạng thái sang Chờ duyệt.
              </div>
            </div>
          }
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined style={{ fontSize: 24, top: 12 }} />}
          style={{ marginBottom: 24, border: '1px solid #ffccc7', background: '#fff2f0' }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        name="productForm"
        initialValues={{ availability_status: "available", unit: "kg" }}
      >
        <Row gutter={24}>
          <Col xs={24} md={10}>
            <Card
              title="Thư viện ảnh"
              bordered={false}
              extra={<Text type="secondary">Tối đa 6 ảnh</Text>}
              style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
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
                    <div style={{ marginTop: 8 }}>Tải ảnh</div>
                  </div>
                )}
              </Upload>
              {fileList.length > 0 && (
                <>
                  <Divider orientation="left" style={{ margin: "12px 0" }}>
                    Ảnh đại diện
                  </Divider>
                  <Radio.Group
                    value={primaryImage}
                    onChange={(e) => setPrimaryImage(e.target.value)}
                  >
                    <Space wrap>
                      {fileList.map((file) => (
                        <Radio key={file.uid} value={file.uid}>
                          <img
                            src={
                              file.url ||
                              (file.originFileObj
                                ? URL.createObjectURL(file.originFileObj)
                                : "")
                            }
                            alt="img"
                            style={{
                              width: 60,
                              height: 60,
                              objectFit: "cover",
                              borderRadius: 8,
                              border:
                                primaryImage === file.uid
                                  ? "2px solid #1677ff"
                                  : "1px solid #ccc",
                            }}
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
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="Tên sản phẩm"
                    name="name"
                    rules={[
                      { required: true, message: "Nhập tên sản phẩm" },
                      { pattern: VIETNAMESE_REGEX, message: "Ký tự không hợp lệ" },
                    ]}
                  >
                    <Input placeholder="VD: Gạo ST25..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Nơi sản xuất" name="location">
                    <Input placeholder="VD: Đà Lạt" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Danh mục" name="category" rules={[{ required: true }]}>
                    <Select placeholder="Chọn danh mục" onChange={handleCategoryChange}>
                      {categories.map((cat) => (
                        <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Nhóm sản phẩm" name="subcategory" rules={[{ required: true }]}>
                    <Select placeholder="Chọn nhóm" disabled={!selectedCategory}>
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
                    label="Giá Bán"
                    name="original_price"
                    rules={[{ required: true }]}
                  >
                    <InputNumber style={{ width: "100%" }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Giá KM"
                    name="discounted_price"
                  >
                    <InputNumber style={{ width: "100%" }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Tồn kho" name="stock">
                    <InputNumber style={{ width: "100%" }} min={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Đơn vị" name="unit">
                    <Select>
                      <Option value="kg">kg</Option>
                      <Option value="g">gram</Option>
                      <Option value="unit">Cái/Hộp</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              title="Chi tiết"
              bordered={false}
              style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
            >
              <Form.Item label="Trạng thái hàng" name="availability_status">
                <Select onChange={handleAvailabilityChange}>
                  <Option value="available">Có sẵn</Option>
                  <Option value="coming_soon">Sắp có</Option>
                  <Option value="out_of_stock">Hết hàng</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Mô tả"
                name="description"
                rules={[
                  { required: true, message: "Vui lòng nhập mô tả" },
                  { max: 1250, message: "Mô tả không được vượt quá 1250 ký tự" }
                ]}
              >
                <TextArea rows={4} maxLength={1250} showCount />
              </Form.Item>

              {availability === "coming_soon" && (
                <>
                  <Divider orientation="left">Mùa vụ</Divider>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label="Bắt đầu" name="season_start"><Input type="date" /></Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Kết thúc" name="season_end"><Input type="date" /></Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="SL Dự kiến" name="estimated_quantity">
                    <InputNumber style={{ width: "100%" }} />
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