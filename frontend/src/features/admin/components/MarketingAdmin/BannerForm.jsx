import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Switch,
  DatePicker,
  InputNumber,
  Button,
  message,
  Space,
  Upload,
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Alert,
  Divider
} from "antd";
import {
  InboxOutlined,
  LinkOutlined,
  SaveOutlined,
  PictureOutlined,
  CalendarOutlined,
  SettingOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  StopOutlined
} from "@ant-design/icons";
import moment from "moment";
import ImgCrop from "antd-img-crop";
import API from "../../../login_register/services/api";

const { Dragger } = Upload;
const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const BannerForm = ({ bannerId, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [selectedSlotConfig, setSelectedSlotConfig] = useState(null);

  // --- DATA FETCHING (Giữ nguyên logic cũ) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const slotsRes = await API.get("/marketing/slots/");
        setSlots(slotsRes.data);

        if (bannerId) {
          const detailRes = await API.get(`/marketing/banners/${bannerId}/`);
          const data = detailRes.data;

          if (data.image) {
            setFileList([{
              uid: '-1',
              name: 'current-banner',
              status: 'done',
              url: data.image,
            }]);
          }

          const slotId = typeof data.slot === 'object' ? data.slot.id : data.slot;
          const foundSlot = slotsRes.data.find(s => s.id === slotId);
          if (foundSlot) setSelectedSlotConfig(foundSlot);

          form.setFieldsValue({
            title: data.title,
            slot: slotId,
            priority: data.priority,
            is_active: data.is_active,
            click_url: data.click_url,
            date_range: [
              data.start_at ? moment(data.start_at) : null,
              data.end_at ? moment(data.end_at) : null
            ],
          });
        }
      } catch (error) {
        message.error("Không tải được dữ liệu.");
      }
    };
    fetchData();
  }, [bannerId, form]);

  // --- HANDLERS ---
  const handleSlotChange = (value) => {
    const slot = slots.find((s) => s.id === value);
    setSelectedSlotConfig(slot || null);
    // Optional: Reset ảnh khi đổi slot để ép user chọn lại đúng tỉ lệ
    // setFileList([]); 
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList.slice(-1));
  };

  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();
    // ... (Logic append formData giữ nguyên như code cũ của bạn)
    formData.append("title", values.title || "");
    formData.append("slot_id", values.slot);
    formData.append("priority", values.priority || 0);
    formData.append("is_active", values.is_active ? "true" : "false");
    formData.append("click_url", values.click_url || "");

    if (values.date_range?.[0]) formData.append("start_at", values.date_range[0].toISOString());
    if (values.date_range?.[1]) formData.append("end_at", values.date_range[1].toISOString());

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("image", fileList[0].originFileObj);
    } else if (!bannerId && fileList.length === 0) {
        message.error("Vui lòng tải lên ảnh banner!");
        setLoading(false);
        return;
    }

    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      if (bannerId) {
        await API.put(`/marketing/banners/${bannerId}/`, formData, config);
        message.success("Cập nhật thành công!");
      } else {
        await API.post("/marketing/banners/", formData, config);
        message.success("Tạo mới thành công!");
      }
      onSuccess();
    } catch (err) {
      message.error("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Tính aspect ratio
  const aspectWidth = selectedSlotConfig?.width_hint || 16;
  const aspectHeight = selectedSlotConfig?.height_hint || 9;
  const aspectRatio = aspectWidth / aspectHeight;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ priority: 0, is_active: true }}
      className="banner-form-container"
    >
      <Row gutter={[24, 24]}>
        
        {/* === CỘT CHÍNH (MAIN CONTENT) === */}
        <Col xs={24} lg={16}>
          {/* Card 1: Thông tin cơ bản */}
          <Card 
            title={<Space><PictureOutlined /><span>Nội dung Banner</span></Space>} 
            bordered={false} 
            className="shadow-sm mb-4"
          >
             <Form.Item
              label="Tiêu đề Banner"
              name="title"
              rules={[{ required: true, message: "Vui lòng nhập tiêu đề banner" }]}
            >
              <Input placeholder="Ví dụ: Siêu Sale 11.11 - Giảm giá 50%" size="large" />
            </Form.Item>

            <Form.Item
              label="Liên kết đích (URL)"
              name="click_url"
              tooltip="Người dùng sẽ được chuyển hướng đến đây khi click vào ảnh."
            >
              <Input prefix={<LinkOutlined className="text-muted" />} placeholder="https://greenfarm.com/san-pham/..." size="large" />
            </Form.Item>
          </Card>

          {/* Card 2: Hình ảnh (Quan trọng nhất) */}
          <Card 
            title={<Space><InboxOutlined /><span>Hình ảnh hiển thị</span></Space>} 
            bordered={false} 
            className="shadow-sm"
          >
             {/* Thông báo hướng dẫn thông minh */}
             {!selectedSlotConfig ? (
                <Alert 
                    message="Vui lòng chọn 'Vị trí hiển thị' ở cột bên phải trước khi tải ảnh." 
                    type="warning" 
                    showIcon 
                    style={{ marginBottom: 16 }}
                />
             ) : (
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Tag color="blue" style={{ fontSize: 14, padding: '4px 10px' }}>
                        Tỉ lệ chuẩn: {selectedSlotConfig.width_hint} x {selectedSlotConfig.height_hint} px
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 13 }}>Hệ thống sẽ hỗ trợ cắt ảnh theo tỉ lệ này.</Text>
                </div>
             )}

            <Form.Item name="image" noStyle>
                <ImgCrop 
                    rotationSlider 
                    aspect={aspectRatio} 
                    showGrid 
                    showReset
                    quality={1}
                    modalTitle="Cắt ảnh banner"
                    modalWidth={800} // Modal to hơn để dễ cắt
                >
                  <Dragger
                    fileList={fileList}
                    onChange={handleUploadChange}
                    beforeUpload={() => false}
                    listType="picture-card" // Đổi kiểu hiển thị sang card cho đẹp
                    maxCount={1}
                    showUploadList={{ showPreviewIcon: false }} // Ẩn icon preview mặc định xấu xí
                    style={{ width: '100%' }}
                    disabled={!selectedSlotConfig} // Disable nếu chưa chọn slot
                    className="banner-dragger"
                  >
                    {fileList.length < 1 && (
                        <div style={{ padding: '40px 0' }}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined style={{ color: selectedSlotConfig ? '#1890ff' : '#d9d9d9' }} />
                            </p>
                            <p className="ant-upload-text" style={{ fontSize: 16 }}>
                                Nhấn hoặc kéo thả ảnh vào đây
                            </p>
                            <p className="ant-upload-hint">Hỗ trợ JPG, PNG, WEBP (Max 5MB)</p>
                        </div>
                    )}
                  </Dragger>
                </ImgCrop>
            </Form.Item>
          </Card>
        </Col>

        {/* === CỘT PHỤ (SIDEBAR SETTINGS) === */}
        <Col xs={24} lg={8}>
            {/* Card 3: Xuất bản & Trạng thái */}
            <Card 
                title={<Space><RocketOutlined /><span>Thiết lập hiển thị</span></Space>} 
                bordered={false} 
                className="shadow-sm mb-4"
                bodyStyle={{ padding: 20 }}
            >
                <Form.Item
                    label="Vị trí hiển thị (Slot)"
                    name="slot"
                    rules={[{ required: true, message: "Bắt buộc chọn" }]}
                >
                    <Select 
                        placeholder="-- Chọn vị trí --" 
                        size="large"
                        onChange={handleSlotChange}
                        optionLabelProp="label"
                        listHeight={400}
                    >
                        {slots.map((s) => (
                            <Select.Option key={s.id} value={s.id} label={s.name}>
                                <div className="py-1">
                                    <div style={{ fontWeight: 500 }}>{s.name}</div>
                                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                                        Size: {s.width_hint || 'Auto'} x {s.height_hint || 'Auto'}
                                    </div>
                                </div>
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Trạng thái" name="is_active" valuePropName="checked">
                    <div style={{ background: '#f5f5f5', padding: '10px 15px', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {form.getFieldValue('is_active') ? 
                            <Text type="success" strong><CheckCircleOutlined /> Đang hiển thị</Text> : 
                            <Text type="secondary"><StopOutlined /> Đang ẩn</Text>
                        }
                        <Switch />
                    </div>
                </Form.Item>

                 <Form.Item label="Độ ưu tiên" name="priority" tooltip="Số càng lớn càng hiển thị trước">
                    <InputNumber min={0} max={999} style={{ width: "100%" }} size="large" />
                </Form.Item>
            </Card>

             {/* Card 4: Lịch trình */}
             <Card 
                title={<Space><CalendarOutlined /><span>Lịch chạy Banner</span></Space>} 
                bordered={false} 
                className="shadow-sm"
            >
                 <Form.Item name="date_range" help="Để trống nếu muốn chạy vĩnh viễn">
                    <RangePicker 
                        showTime={{ format: 'HH:mm' }} 
                        format="DD/MM/YYYY HH:mm" 
                        style={{ width: '100%' }} 
                        size="large"
                        placeholder={['Bắt đầu', 'Kết thúc']}
                    />
                </Form.Item>
            </Card>
        </Col>
      </Row>

      <div className="form-footer-action">
          <Divider/>
          <div style={{ textAlign: "right", paddingBottom: 20 }}>
            <Space size="middle">
                <Button onClick={onCancel} size="large" style={{ minWidth: 100 }}>Hủy bỏ</Button>
                <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<SaveOutlined />} 
                    loading={loading} 
                    size="large"
                    style={{ minWidth: 140, height: 45, fontSize: 16 }}
                >
                    {bannerId ? "Cập nhật" : "Đăng Banner"}
                </Button>
            </Space>
          </div>
      </div>

        {/* Style CSS-in-JS nhanh cho component này */}
        <style jsx="true">{`
            .shadow-sm { box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .text-muted { color: #bfbfbf; }
            .banner-dragger .ant-upload.ant-upload-select-picture-card {
                width: 100% !important;
                height: auto !important;
                min-height: 200px;
                background: #fafafa;
                border: 2px dashed #d9d9d9;
            }
            .banner-dragger .ant-upload-list-picture-card-container {
                width: 100% !important;
                height: auto !important;
            }
            .banner-dragger .ant-upload-list-item {
                height: 300px; /* Chiều cao preview ảnh */
                object-fit: contain;
                padding: 8px;
            }
            .banner-dragger .ant-upload-list-item-thumbnail img {
                object-fit: contain !important;
            }
        `}</style>
    </Form>
  );
};

export default BannerForm;