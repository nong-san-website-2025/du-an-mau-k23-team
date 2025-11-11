// src/seller_center/components/ProductSeller/ProductForm.jsx
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
import axios from "axios";

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const ProductForm = ({ visible, onCancel, onSubmit, initialValues }) => {
  const [form] = Form.useForm();
  const [availability, setAvailability] = useState("available");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [fileList, setFileList] = useState([]); // cho gallery nhiều ảnh
  const [primaryImage, setPrimaryImage] = useState(null);
  const [imageFile, setImageFile] = useState(null); // cho 1 ảnh upload nhanh
  const [previewUrl, setPreviewUrl] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/categories/")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Lỗi tải categories:", err));

    axios
      .get("http://localhost:8000/api/subcategories/")
      .then((res) => setSubcategories(res.data))
      .catch((err) => console.error("Lỗi tải subcategories:", err));
  }, []);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    const selected = categories.find((cat) => cat.id === categoryId);
    setSubcategories(selected ? selected.subcategories : []);
    form.setFieldsValue({ subcategory: undefined });
  };

  // 🟢 Khi mở modal, fill dữ liệu hoặc reset
  useEffect(() => {
    if (visible) {
      if (initialValues) {
        // ✅ Đặt tất cả giá trị cũ
        form.setFieldsValue({
          ...initialValues,
          availability_status: initialValues.availability_status || "available",
        });
        setAvailability(initialValues.availability_status || "available");

        // ✅ Xử lý ảnh
        if (initialValues.images && initialValues.images.length > 0) {
          const gallery = initialValues.images.map((img, idx) => ({
            uid: String(img.id),
            name: `Ảnh ${idx + 1}`,
            status: "done",
            url: img.image,
            is_primary: img.is_primary,
            existingImageId: img.id,
          }));
          setFileList(gallery);
          const primary = gallery.find((img) => img.is_primary);
          setPrimaryImage(primary ? primary.uid : gallery[0].uid);
        } else {
          setFileList([]);
          setPrimaryImage(null);
        }

        // ✅ Danh mục & nhóm
        const foundCategory = categories.find((cat) =>
          cat.subcategories.some((sub) => sub.id === initialValues.subcategory)
        );
        if (foundCategory) {
          setSelectedCategory(foundCategory.id);
          setSubcategories(foundCategory.subcategories);
          form.setFieldsValue({
            category: foundCategory.id, // 👈 THÊM DÒNG NÀY
          });
        }
      } else {
        // Reset khi mở form mới
        form.resetFields();
        setAvailability("available");
        setFileList([]);
        setPrimaryImage(null);
        setSelectedCategory(null);
        setSubcategories([]);
      }
    }
  }, [visible, initialValues, categories, form]);

  // 🟢 Xử lý chọn ảnh
  const handleImageChange = (info) => {
    const file = info.file?.originFileObj;

    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      // Nếu xóa ảnh hoặc không chọn file
      setImageFile(null);
      setPreviewUrl(null);
    }
  };

  // 🟢 Xử lý đổi trạng thái hàng hóa
  const handleAvailabilityChange = (value) => {
    setAvailability(value);
    form.setFieldsValue({ availability_status: value });
  };

  // 🟢 Gửi form
  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        const formData = new FormData();

        // Gửi các field thông thường
        Object.entries(values).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value);
          }
        });

        // Ảnh chính (nhiều ảnh)
        const primaryFile = fileList.find((file) => file.uid === primaryImage);
        if (primaryFile?.originFileObj) {
          formData.append("image", primaryFile.originFileObj);
        }

        // Ảnh đơn (previewUrl)
        if (imageFile) {
          formData.append("image_single", imageFile);
        }

        onSubmit(formData);
        onCancel();
      })
      .catch((err) => {
        message.error("Vui lòng kiểm tra lại thông tin!");
        console.log(err);
      });
  };

  return (
    <Modal
      open={visible}
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
      bodyStyle={{ maxHeight: "75vh", overflowY: "auto", padding: "24px" }}
      centered
      destroyOnClose
    >
      <Form form={form} layout="vertical" name="productForm">
        <Row gutter={24}>
          {/* --- Cột trái: Ảnh sản phẩm --- */}
          <Col xs={24} md={10}>
            <Card
              title="Thư viện ảnh sản phẩm"
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
              extra={<Text type="secondary">Tối đa 6 ảnh</Text>}
            >
              <Upload
                listType="picture-card"
                beforeUpload={() => false}
                fileList={fileList}
                onChange={({ fileList: newList }) => {
                  if (newList.length <= 6) setFileList(newList);
                  else message.warning("Chỉ được tải tối đa 6 ảnh!");
                }}
                multiple
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
                    Ảnh chính
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
                              URL.createObjectURL(file.originFileObj)
                            }
                            alt=""
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

          {/* --- Cột phải: Thông tin sản phẩm --- */}
          <Col xs={24} md={14}>
            <Card
              title="Thông tin cơ bản"
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                marginBottom: 16,
              }}
            >
              <Form.Item
                label="Trạng thái hàng hóa"
                name="availability_status"
                rules={[
                  { required: true, message: "Vui lòng chọn trạng thái" },
                ]}
                initialValue="available"
              >
                <Select onChange={handleAvailabilityChange}>
                  <Option value="available">Có sẵn</Option>
                  <Option value="coming_soon">Sắp có</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Tên sản phẩm"
                name="name"
                rules={[{ required: true, message: "Vui lòng nhập tên" }]}
              >
                <Input placeholder="Nhập tên sản phẩm" />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="Danh mục"
                    name="category"
                    rules={[{ required: true, message: "Chọn danh mục" }]}
                  >
                    <Select
                      placeholder="Chọn danh mục"
                      onChange={handleCategoryChange}
                      value={selectedCategory}
                    >
                      {categories.map((cat) => (
                        <Option key={cat.id} value={cat.id}>
                          {cat.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Nhóm sản phẩm"
                    name="subcategory"
                    rules={[{ required: true, message: "Chọn nhóm" }]}
                  >
                    <Select
                      placeholder={
                        selectedCategory
                          ? "Chọn nhóm sản phẩm"
                          : "Chọn danh mục trước"
                      }
                      disabled={!selectedCategory}
                    >
                      {subcategories.map((sub) => (
                        <Option key={sub.id} value={sub.id}>
                          {sub.name}
                        </Option>
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
                    rules={[{ required: true, message: "Nhập giá gốc" }]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      placeholder="VD: 25000"
                      formatter={(v) =>
                        `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Giá khuyến mãi" name="discounted_price">
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      placeholder="VD: 20000"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Tồn kho" name="stock">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Số lượng tồn"
                />
              </Form.Item>
            </Card>

            <Card
              title="Thông tin chi tiết"
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <Form.Item
                label="Mô tả sản phẩm"
                name="description"
                rules={[{ required: true, message: "Nhập mô tả" }]}
              >
                <TextArea
                  rows={5}
                  placeholder="Nhập mô tả chi tiết, công dụng, nguồn gốc..."
                />
              </Form.Item>

              {availability === "coming_soon" && (
                <>
                  <Divider orientation="left">🗓️ Mùa vụ</Divider>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label="Bắt đầu" name="season_start">
                        <Input type="date" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Kết thúc" name="season_end">
                        <Input type="date" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    label="Sản lượng dự kiến"
                    name="estimated_quantity"
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      placeholder="VD: 5000"
                    />
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
