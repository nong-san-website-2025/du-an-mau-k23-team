import React, { useState, useEffect } from "react";
import {
  Form, Input, Select, Switch, DatePicker, InputNumber, Button,
  message, Space, Upload, Row, Col, Card, Typography, Tag, Divider, Alert
} from "antd";
import {
  InboxOutlined, SaveOutlined, PictureOutlined, CalendarOutlined, 
  RocketOutlined, FileImageOutlined, PlusOutlined
} from "@ant-design/icons";
import moment from "moment";
import ImgCrop from "antd-img-crop";

// --- SỬA ĐƯỜNG DẪN IMPORT TẠI ĐÂY ---
// Lùi 2 cấp (../../) để ra thư mục src/features/admin/
import { getAdSlots } from "../../services/marketingApi";
import axiosClient from "../../services/axiosClient";

const { Dragger } = Upload;
const { RangePicker } = DatePicker;

const BannerForm = ({ bannerId, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [selectedSlotConfig, setSelectedSlotConfig] = useState(null);

  // LOGIC: Kiểm tra Slot có phải Carousel không (để bật chế độ 5 ảnh)
  const isCarouselSlot = selectedSlotConfig?.name?.toLowerCase().includes("carousel");
  
  // Bật Batch Upload nếu là Carousel
  const isBatchUpload = isCarouselSlot;

  useEffect(() => {
    const initData = async () => {
      try {
        const slotsRes = await getAdSlots();
        const listSlots = slotsRes.data || slotsRes;
        setSlots(listSlots);

        if (bannerId) {
          const res = await axiosClient.get(`/marketing/banners/${bannerId}/`);
          const data = res.data || res;

          form.setFieldsValue({
            title: data.title,
            slot: typeof data.slot === 'object' ? data.slot.id : data.slot,
            priority: data.priority,
            is_active: data.is_active,
            click_url: data.click_url,
            date_range: [
              data.start_at ? moment(data.start_at) : null,
              data.end_at ? moment(data.end_at) : null
            ],
          });

          if (data.image) {
            setFileList([{
              uid: '-1',
              name: 'anh-hien-tai.png',
              status: 'done',
              url: data.image,
            }]);
          }

          const currentSlot = listSlots.find(s => s.id === (typeof data.slot === 'object' ? data.slot.id : data.slot));
          if (currentSlot) setSelectedSlotConfig(currentSlot);
        }
      } catch (err) {
        message.error("Lỗi tải dữ liệu");
      }
    };
    initData();
  }, [bannerId, form]);

  const handleSlotChange = (val) => {
    const s = slots.find(item => item.id === val);
    setSelectedSlotConfig(s);

    const isNewSlotCarousel = s?.name?.toLowerCase().includes("carousel");
    if (!isNewSlotCarousel && fileList.length > 1) {
        message.warning("Vị trí này chỉ cho phép 1 ảnh. Hệ thống đã giữ lại ảnh đầu tiên.");
        setFileList([fileList[0]]);
    }
  };

  const onFinish = async (values) => {
    if (fileList.length === 0) {
      message.error("Vui lòng chọn ít nhất 1 ảnh!");
      return;
    }

    setLoading(true);

    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      
      const createFormData = (fileOrigin, priorityOffset = 0) => {
        const formData = new FormData();
        formData.append("title", values.title);
        formData.append("slot_id", values.slot);
        formData.append("priority", (values.priority || 0) + priorityOffset);
        formData.append("is_active", values.is_active ? "true" : "false");
        formData.append("click_url", values.click_url || "");
        
        if (values.date_range) {
          if (values.date_range[0]) formData.append("start_at", values.date_range[0].toISOString());
          if (values.date_range[1]) formData.append("end_at", values.date_range[1].toISOString());
        }

        if (fileOrigin) {
          formData.append("image", fileOrigin);
        }
        return formData;
      };

      const requestPromises = [];

      fileList.forEach((file, index) => {
          const isFirstFile = index === 0;
          const isNewImage = !!file.originFileObj; 

          if (isFirstFile) {
              const formData = createFormData(isNewImage ? file.originFileObj : null);
              if (bannerId) {
                  requestPromises.push(axiosClient.put(`/marketing/banners/${bannerId}/`, formData, config));
              } else {
                  requestPromises.push(axiosClient.post("/marketing/banners/", formData, config));
              }
          } 
          else if (isNewImage) {
              const formData = createFormData(file.originFileObj, index);
              requestPromises.push(axiosClient.post("/marketing/banners/", formData, config));
          }
      });

      await Promise.all(requestPromises);

      const msg = fileList.length > 1 
          ? `Thành công! Đã xử lý ${fileList.length} ảnh.` 
          : "Lưu thành công!";
      message.success(msg);
      
      onSuccess(); 
    } catch (err) {
      console.error(err);
      message.error("Lỗi lưu dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const aspect = selectedSlotConfig ? (selectedSlotConfig.width_hint / selectedSlotConfig.height_hint) : 16/9;

  const UploadComponent = (
    <Dragger
      fileList={fileList}
      multiple={isBatchUpload}           
      maxCount={isBatchUpload ? 5 : 1}
      beforeUpload={() => false}
      onChange={({ fileList: newFileList }) => setFileList(newFileList)}
      listType="picture-card"
      className="banner-dragger"
      disabled={!selectedSlotConfig}
    >
      {fileList.length < (isBatchUpload ? 5 : 1) && (
        <div style={{ padding: '20px 0' }}>
          <PlusOutlined style={{ fontSize: 30, color: selectedSlotConfig ? '#1890ff' : '#d9d9d9' }} />
          <div style={{ marginTop: 8, color: '#666' }}>
             {isBatchUpload ? "Thêm ảnh" : "Chọn ảnh"}
          </div>
        </div>
      )}
    </Dragger>
  );

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ is_active: true, priority: 0 }}>
      <Row gutter={24}>
        <Col span={15}>
          <Card title={<Space><PictureOutlined /> Thông tin chính</Space>} size="small">
            <Form.Item name="title" label="Tiêu đề Banner" rules={[{ required: true, message: "Nhập tiêu đề" }]}>
              <Input placeholder="Ví dụ: Khuyến mãi..." />
            </Form.Item>
            <Form.Item name="click_url" label="Link khi click vào">
              <Input placeholder="https://..." />
            </Form.Item>
            
            <Form.Item label="Hình ảnh Banner" required>
               <div style={{ marginBottom: 10 }}>
                 {!selectedSlotConfig ? (
                    <Alert message="Vui lòng chọn Vị trí hiển thị bên phải trước!" type="warning" showIcon />
                 ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Tag color="blue" style={{ fontSize: 14, padding: '5px 10px' }}>
                            <FileImageOutlined /> Size gợi ý: <b>{selectedSlotConfig.width_hint} x {selectedSlotConfig.height_hint} px</b>
                        </Tag>
                        {isBatchUpload && <Tag color="green">Cho phép 5 ảnh (Slide)</Tag>}
                    </div>
                 )}
               </div>

               <Form.Item name="image" noStyle>
                 {isBatchUpload ? (
                   UploadComponent
                 ) : (
                   <ImgCrop rotationSlider aspect={aspect} showGrid modalTitle="Cắt ảnh" quality={1}>
                     {UploadComponent}
                   </ImgCrop>
                 )}
               </Form.Item>
               
               {isBatchUpload && (
                   <div style={{ fontSize: 12, color: '#999', marginTop: 5 }}>
                       * Slide hỗ trợ nhiều ảnh. Ảnh sẽ được tự động tạo thành các banner riêng biệt.
                   </div>
               )}
            </Form.Item>
          </Card>
        </Col>

        <Col span={9}>
          <Card title={<Space><RocketOutlined /> Thiết lập</Space>} size="small">
            <Form.Item name="slot" label="Vị trí hiển thị" rules={[{ required: true }]}>
              <Select placeholder="Chọn vị trí" onChange={handleSlotChange}>
                {slots.map(s => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.name} 
                    <span style={{ fontSize: 11, color: '#999', marginLeft: 5 }}>
                       ({s.width_hint}x{s.height_hint})
                    </span>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="priority" label="Độ ưu tiên">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>

            <Form.Item name="is_active" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
            </Form.Item>
          </Card>

          <Card title={<Space><CalendarOutlined /> Thời gian chạy</Space>} size="small" style={{ marginTop: 16 }}>
            <Form.Item name="date_range" help="Để trống nếu muốn chạy vĩnh viễn">
              <RangePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Card>
        </Col>
      </Row>
      
      <Divider />
      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>Hủy</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
            {bannerId ? "Lưu thay đổi" : "Tạo mới"}
          </Button>
        </Space>
      </div>
      
      <style jsx="true">{`
        .banner-dragger .ant-upload.ant-upload-select-picture-card {
            width: 100% !important;
            height: auto !important;
        }
        .banner-dragger .ant-upload-list-item-thumbnail img {
            object-fit: contain !important;
        }
      `}</style>
    </Form>
  );
};

export default BannerForm;