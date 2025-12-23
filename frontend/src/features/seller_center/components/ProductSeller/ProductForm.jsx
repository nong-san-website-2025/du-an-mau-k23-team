import React, { useEffect, useState } from "react";
import {
  Form, Input, InputNumber, Select, Upload,
  Typography, Row, Col, Card, Divider, Radio, Space,
  message, Alert, DatePicker, Tag,
  Button, Drawer,
  Tooltip
} from "antd";
import {
  UploadOutlined, ExclamationCircleOutlined,
  DollarOutlined, FileTextOutlined,
  AuditOutlined, InfoCircleOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const PRODUCT_TAX_TYPES = [
  {
    id: 1,
    rate: 0,
    label: "Nông sản tươi sống (Chưa qua chế biến)",
    desc: "VD: Rau, củ, quả tươi, thịt, cá, trứng, hải sản tươi sống...",
    color: "green"
  },
  {
    id: 2,
    rate: 5,
    label: "Nông sản đã sơ chế (Làm sạch, phơi, sấy)",
    desc: "VD: Gạo, hạt điều, cà phê hạt, tiêu, nông sản sấy khô...",
    color: "blue"
  },
  {
    id: 3,
    rate: 10,
    label: "Thực phẩm chế biến sâu / Đồ uống",
    desc: "VD: Nước ép đóng chai, mứt tết, đồ hộp, bánh kẹo...",
    color: "orange"
  }
];

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
  const [currentTaxRate, setCurrentTaxRate] = useState(0);
  const [commissionRate, setCommissionRate] = useState(0); 

  // State lưu trữ giá để tính toán real-time
  const [priceData, setPriceData] = useState({
    original_price: 0,
    discounted_price: 0
  });

  const isRejected = initialValues?.status === "rejected";
  const getRejectReason = () => initialValues?.reject_reason || initialValues?.admin_note || "Sản phẩm chưa đạt yêu cầu.";

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    const selected = categories.find((cat) => cat.id === categoryId);
    setSubcategories(selected?.subcategories || []);
    form.setFieldsValue({ subcategory: undefined });

    if (selected && selected.commission_rate !== undefined) {
      setCommissionRate(selected.commission_rate);  
    } else {
      setCommissionRate(0.05); 
    }
  };

  const handleAvailabilityChange = (value) => {
    setAvailability(value);
  };

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        const formattedValues = {
          ...initialValues,
          season_start: initialValues.season_start ? dayjs(initialValues.season_start) : null,
          season_end: initialValues.season_end ? dayjs(initialValues.season_end) : null,
          availability_status: initialValues.availability_status || "available",
          unit: initialValues.unit || "kg",
          tax_rate: initialValues.tax_rate || 0,
        };

        form.setFieldsValue(formattedValues);
        setAvailability(formattedValues.availability_status);
        setCurrentTaxRate(formattedValues.tax_rate);
        setCommissionRate(initialValues.commission_rate || 0.05);

        setPriceData({
          original_price: formattedValues.original_price || 0,
          discounted_price: formattedValues.discounted_price || 0
        });

        if (initialValues.images?.length > 0) {
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
          setCommissionRate(0.05);
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
        form.resetFields();
        setAvailability("available");
        setFileList([]);
        setPrimaryImage(null);
        setSelectedCategory(null);
        setSubcategories([]);
        setCurrentTaxRate(0);
        setPriceData({ original_price: 0, discounted_price: 0 });

        form.setFieldsValue({
          unit: "kg",
          stock: 0,
          availability_status: "available",
          tax_rate: 0,
        });
      }
    }
  }, [visible, initialValues, categories, form]);

  const renderNetIncome = () => {
    const price = priceData.original_price || 0;
    const discount = priceData.discounted_price || 0;

    // Logic hiển thị: Nếu discount > 0 thì dùng discount, ngược lại dùng giá gốc
    const sellingPrice = (discount > 0 && discount < price) ? discount : price;

    const priceExcludingTax = sellingPrice / (1 + currentTaxRate / 100);
    const taxAmount = Math.round(sellingPrice - priceExcludingTax);
    const platformFeeAmount = Math.round(sellingPrice * commissionRate);
    const netIncome = sellingPrice - taxAmount - platformFeeAmount;

    const isZero = sellingPrice === 0;
    const boxColor = isZero ? '#f5f5f5' : '#f6ffed';
    const borderColor = isZero ? '#d9d9d9' : '#b7eb8f';
    const textColor = isZero ? '#8c8c8c' : '#389e0d';

    return (
      <div style={{
        marginTop: 12, padding: '12px', background: boxColor,
        border: `1px solid ${borderColor}`, borderRadius: 8, transition: 'all 0.3s'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text type="secondary">Doanh thu (Khách trả):</Text>
          <Text strong>{sellingPrice.toLocaleString()} đ</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
          <Text type="secondary">Thuế GTGT ({currentTaxRate}%):</Text>
          <Text type="danger">- {taxAmount.toLocaleString()} đ</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
          <Text type="secondary">
            Phí sàn ({(commissionRate * 100).toFixed(1)}%):
            <Tooltip title={`Danh mục ${categories.find(c => c.id === selectedCategory)?.name || ''} có mức phí vận hành là ${(commissionRate * 100).toFixed(1)}%`}>
              <InfoCircleOutlined style={{ marginLeft: 4, cursor: 'pointer', color: '#1890ff' }} />
            </Tooltip>
          </Text>
          <Text type="danger">- {platformFeeAmount.toLocaleString()} đ</Text>
        </div>
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ color: textColor }}>THỰC NHẬN VỀ VÍ:</Text>
          <Text strong style={{ fontSize: 18, color: textColor }}>
            {netIncome > 0 ? netIncome.toLocaleString() : 0} đ
          </Text>
        </div>
      </div>
    );
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (!values.original_price || values.original_price <= 0) {
        return message.error("Giá gốc phải lớn hơn 0!");
      }
      // Check logic: Nếu CÓ nhập giá KM thì phải nhỏ hơn giá gốc
      if (values.discounted_price && values.discounted_price > 0 && values.discounted_price >= values.original_price) {
        return message.error("Giá khuyến mãi phải nhỏ hơn giá gốc!");
      }

      const formData = new FormData();

      Object.entries(values).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        // --- SỬA LỖI TẠI ĐÂY ---
        // Nếu trường là 'discounted_price':
        // - Nếu để trống hoặc = 0 -> Gán bằng 'original_price' (Để Backend hiểu là không giảm giá)
        // - Nếu có giá trị -> Gửi bình thường
        if (key === 'discounted_price') {
            if (!value || value <= 0) {
                formData.append(key, values.original_price); 
            } else {
                formData.append(key, value);
            }
            return; // Đã xử lý xong key này, return để không chạy xuống dưới
        }
        // -----------------------

        if (key === 'season_start' || key === 'season_end') {
          formData.append(key, dayjs(value).format('YYYY-MM-DD'));
        } else {
          formData.append(key, value);
        }
      });

      if (fileList.length === 0) return message.error("Vui lòng tải lên ít nhất 1 ảnh!");

      const primaryFile = fileList.find((file) => file.uid === primaryImage) || fileList[0];

      if (primaryFile?.originFileObj) {
        formData.append("image", primaryFile.originFileObj);
      } else if (primaryFile && initialValues) {
        formData.append("primary_image_id", primaryFile.uid);
      }

      const newGalleryImages = fileList.filter((f) => f.originFileObj && f.uid !== primaryFile.uid);

      newGalleryImages.forEach((file) => {
        formData.append("images", file.originFileObj);
      });

      if (isRejected) {
        formData.set("status", "pending");
      }

      onSubmit(formData);
    }).catch((err) => {
      console.error(err);
      message.error("Vui lòng điền đầy đủ các mục bắt buộc (có dấu *).");
    });
  };

  return (
    <Drawer
      title={initialValues ? "CẬP NHẬT THÔNG TIN SẢN PHẨM" : "ĐĂNG BÁN SẢN PHẨM MỚI"}
      width={1100}
      onClose={onCancel}
      open={visible}
      styles={{ body: { paddingBottom: 80, background: '#f0f2f5' } }}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>Hủy bỏ</Button>
            <Button onClick={handleOk} type="primary" size="large">
              {initialValues ? "Lưu thay đổi" : "Hoàn tất & Đăng bán"}
            </Button>
          </Space>
        </div>
      }
    >
      {isRejected && (
        <Alert
          message="Sản phẩm cần chỉnh sửa lại"
          description={<><Text strong>Lý do từ chối:</Text> <Text type="danger">{getRejectReason()}</Text></>}
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 20 }}
        />
      )}

      <Form form={form} layout="vertical">
        <Row gutter={24}>
          <Col xs={24} lg={9}>
            <Card title="1. Hình ảnh sản phẩm" bordered={false} className="mb-3 shadow-sm">
              <div style={{ textAlign: 'center' }}>
                <Upload
                  listType="picture-card"
                  beforeUpload={() => false}
                  fileList={fileList}
                  onChange={({ fileList: newList }) => setFileList(newList)}
                  multiple
                  maxCount={6}
                >
                  {fileList.length < 6 && (
                    <div><UploadOutlined style={{ fontSize: 20, color: '#1890ff' }} /><div style={{ marginTop: 8 }}>Thêm ảnh</div></div>
                  )}
                </Upload>
              </div>

              {fileList.length > 0 && (
                <div style={{ marginTop: 16, background: '#e6f7ff', padding: 12, borderRadius: 6 }}>
                  <Text strong style={{ fontSize: 13, color: '#1890ff' }}>Chọn ảnh bìa (Ảnh khách thấy đầu tiên):</Text>
                  <Divider style={{ margin: "8px 0" }} />
                  <Radio.Group value={primaryImage} onChange={(e) => setPrimaryImage(e.target.value)} style={{ width: '100%' }}>
                    <Space wrap size={[8, 8]}>
                      {fileList.map((file) => (
                        <Radio key={file.uid} value={file.uid} style={{ marginRight: 0 }}>
                          <div style={{
                            width: 48, height: 48, borderRadius: 4, overflow: 'hidden',
                            border: primaryImage === file.uid ? '2px solid #1890ff' : '1px solid #d9d9d9',
                            opacity: primaryImage === file.uid ? 1 : 0.6
                          }}>
                            <img
                              src={file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : "")}
                              alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                </div>
              )}
              <Alert type="info" message="Nên chọn ảnh rõ nét, chụp thực tế để khách tin tưởng." style={{ marginTop: 12, fontSize: 12 }} showIcon />
            </Card>

            <Card
              title={<span><AuditOutlined /> Phân loại tính thuế</span>}
              bordered={false}
              className="mb-3 shadow-sm"
              headStyle={{ background: '#fff7e6', color: '#d46b08' }}
            >
              <Form.Item
                label="Sản phẩm này thuộc nhóm nào?"
                name="tax_rate"
                rules={[{ required: true, message: "Vui lòng chọn nhóm sản phẩm" }]}
              >
                <Radio.Group
                  style={{ width: '100%' }}
                  onChange={(e) => setCurrentTaxRate(e.target.value)}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {PRODUCT_TAX_TYPES.map((type) => (
                      <Radio
                        key={type.id}
                        value={type.rate}
                        style={{
                          border: currentTaxRate === type.rate ? `1px solid ${type.color}` : '1px solid #d9d9d9',
                          padding: '12px',
                          borderRadius: '8px',
                          width: '100%',
                          background: currentTaxRate === type.rate ? '#f9f9f9' : 'white'
                        }}
                      >
                        <Space direction="vertical" size={0}>
                          <Text strong>{type.label}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>{type.desc}</Text>
                        </Space>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </Form.Item>

              <div style={{ marginTop: 12, padding: '8px 12px', background: '#f0f5ff', borderRadius: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontSize: 13 }}>
                  Mức thuế áp dụng: <Tag color={currentTaxRate === 0 ? "green" : "volcano"} style={{ fontSize: 14, fontWeight: 'bold' }}>{currentTaxRate}%</Tag>
                  (Hệ thống tự động tính)
                </span>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={15}>
            <Card title={<span><FileTextOutlined /> Thông tin sản phẩm</span>} bordered={false} className="mb-3 shadow-sm">
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}>
                    <Input placeholder="VD: Gạo ST25 Ông Cua - Túi 5kg" size="large" showCount maxLength={120} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Thuộc danh mục" name="category" rules={[{ required: true, message: "Chọn danh mục" }]}>
                    <Select placeholder="-- Chọn danh mục --" onChange={handleCategoryChange} options={categories.map(c => ({ label: c.name, value: c.id }))} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Loại cụ thể" name="subcategory" rules={[{ required: true, message: "Chọn loại cụ thể" }]}>
                    <Select placeholder="-- Chọn loại --" disabled={!selectedCategory} options={subcategories.map(s => ({ label: s.name, value: s.id }))} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="Nguồn gốc / Xuất xứ" name="location">
                    <Input placeholder="VD: Vườn ổi Chú Ba, Cái Bè, Tiền Giang" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title={<span><DollarOutlined /> Giá bán & Kho hàng</span>} bordered={false} className="mb-3 shadow-sm">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={<Text strong>Giá bán cho khách (Niêm yết)</Text>}
                    name="original_price"
                    rules={[{ required: true, message: "Nhập giá bán" }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      size="large"
                      addonAfter="đ"
                      formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={v => v.replace(/\$\s?|(,*)/g, '')}
                      min={1000}
                      placeholder="VD: 50,000"
                      onChange={(val) => {
                        setPriceData(prev => ({ ...prev, original_price: val }));
                      }}
                    />
                  </Form.Item>

                  {renderNetIncome()}

                </Col>
                <Col span={12}>
                  <Form.Item label="Giá khuyến mãi (Chỉ nhập nếu giảm giá)" name="discounted_price">
                    <InputNumber
                      style={{ width: '100%' }}
                      size="large"
                      addonAfter="đ"
                      formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={v => v.replace(/\$\s?|(,*)/g, '')}
                      placeholder="Để trống nếu không giảm"
                      onChange={(val) => {
                        setPriceData(prev => ({ ...prev, discounted_price: val }));
                      }}
                    />
                  </Form.Item>
                </Col>

                <Divider dashed style={{ margin: '12px 0' }} />

                <Col span={8}>
                  <Form.Item label="Đơn vị bán" name="unit">
                    <Select>
                      <Option value="kg">Kilogram (Kg)</Option>
                      <Option value="l">Lít (L)</Option>
                      <Option value="ml">Milliliter (ml)</Option>
                      <Option value="unit">Cái / Chiếc / Quả</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Số lượng đang có" name="stock" rules={[{ required: true, message: "Nhập số lượng" }]}>
                    <InputNumber style={{ width: '100%' }} min={0} placeholder="VD: 100" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Trạng thái hàng" name="availability_status">
                    <Select onChange={handleAvailabilityChange}>
                      <Option value="available"><Tag color="green">Đang có hàng</Tag></Option>
                      <Option value="coming_soon"><Tag color="purple">Sắp thu hoạch</Tag></Option>
                      <Option value="out_of_stock"><Tag color="red">Hết hàng</Tag></Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {availability === "coming_soon" && (
              <Card
                size="small"
                title="📅 Kế hoạch bán trước (Hàng sắp thu hoạch)"
                className="mb-3"
                style={{ border: '1px solid #722ed1', background: '#f9f0ff' }}
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="Ngày mở bán" name="season_start" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" /></Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Ngày kết thúc" name="season_end" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" /></Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Sản lượng dự kiến" name="estimated_quantity" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} placeholder="VD: 500" /></Form.Item>
                  </Col>
                  <Col span={24}>
                    <Alert type="info" message="Khách có thể đặt cọc trước trong khoảng thời gian này." showIcon style={{ fontSize: 12 }} />
                  </Col>
                </Row>
              </Card>
            )}

            <Form.Item label="Mô tả sản phẩm" name="description" rules={[{ required: true, message: "Hãy mô tả sản phẩm để khách mua nhiều hơn" }]}>
              <TextArea
                rows={5}
                showCount
                maxLength={3000}
                placeholder="- Sản phẩm này ngon như thế nào?&#10;- Cách bảo quản ra sao?&#10;- Cam kết sạch, an toàn..."
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};

export default ProductForm;