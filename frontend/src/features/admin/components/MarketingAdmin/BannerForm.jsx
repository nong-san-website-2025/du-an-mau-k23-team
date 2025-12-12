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
  Divider,
  Typography
} from "antd";
import { InboxOutlined, LinkOutlined, SaveOutlined } from "@ant-design/icons";
import moment from "moment";
import API from "../../../login_register/services/api";

const { Dragger } = Upload;
const { RangePicker } = DatePicker;
const { Text } = Typography;

const BannerForm = ({ bannerId, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  const [fileList, setFileList] = useState([]);

  // Fetch Slots
  useEffect(() => {
    API.get("/marketing/slots/")
      .then((res) => setSlots(res.data))
      .catch(() => message.error("Không tải được danh sách vị trí"));
  }, []);

  // Fetch Detail Data
  useEffect(() => {
    if (bannerId) {
      API.get(`/marketing/banners/${bannerId}/`)
        .then((res) => {
          const data = res.data;
          
          // Set fileList cho Upload component hiển thị ảnh cũ
          if (data.image) {
             setFileList([{
                uid: '-1',
                name: 'current-banner.png',
                status: 'done',
                url: data.image,
             }]);
          }

          form.setFieldsValue({
            title: data.title,
            slot: data.slot?.id || data.slot, // Handle object or ID
            priority: data.priority,
            is_active: data.is_active,
            click_url: data.click_url,
            // Gom 2 ngày thành 1 mảng cho RangePicker
            date_range: [
                data.start_at ? moment(data.start_at) : null,
                data.end_at ? moment(data.end_at) : null
            ],
          });
        })
        .catch(() => message.error("Không tải được dữ liệu banner"));
    } else {
      form.resetFields();
      setFileList([]);
    }
  }, [bannerId, form]);

  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();

    formData.append("title", values.title || "");
    formData.append("slot_id", values.slot);
    formData.append("priority", values.priority || 0);
    formData.append("is_active", values.is_active ? "true" : "false");
    formData.append("click_url", values.click_url || "");

    // Xử lý ngày tháng từ RangePicker
    if (values.date_range && values.date_range[0]) {
        formData.append("start_at", values.date_range[0].toISOString());
    }
    if (values.date_range && values.date_range[1]) {
        formData.append("end_at", values.date_range[1].toISOString());
    }

    // Xử lý file ảnh
    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("image", fileList[0].originFileObj);
    } 
    // Nếu tạo mới mà không có ảnh
    else if (!bannerId && fileList.length === 0) {
        message.error("Vui lòng tải lên ảnh banner!");
        setLoading(false);
        return;
    }

    try {
      if (bannerId) {
        await API.put(`/marketing/banners/${bannerId}/`, formData);
        message.success("Cập nhật banner thành công!");
      } else {
        await API.post("/marketing/banners/", formData);
        message.success("Tạo banner mới thành công!");
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      message.error("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    // Giới hạn chỉ 1 file, file mới nhất sẽ thay thế
    setFileList(newFileList.slice(-1));
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        priority: 0,
        is_active: true,
      }}
    >
      <Row gutter={24}>
        {/* CỘT TRÁI: Ảnh & Vị trí quan trọng */}
        <Col span={10}>
          <Form.Item
            label="Hình ảnh Banner"
            required
            tooltip="Tỉ lệ ảnh phụ thuộc vào vị trí hiển thị (VD: Carousel 1200x400)"
          >
            <Dragger
              fileList={fileList}
              onChange={handleUploadChange}
              beforeUpload={() => false} // Chặn auto upload
              listType="picture"
              maxCount={1}
              height={180}
              style={{ padding: 20, background: '#fafafa' }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">Kéo thả hoặc click để tải ảnh</p>
              <p className="ant-upload-hint">Hỗ trợ .png, .jpg, .webp</p>
            </Dragger>
          </Form.Item>

          <Form.Item
            label="Vị trí hiển thị (Slot)"
            name="slot"
            rules={[{ required: true, message: "Vui lòng chọn vị trí" }]}
          >
            <Select placeholder="Chọn vị trí xuất hiện" size="large">
              {slots.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {/* CỘT PHẢI: Thông tin chi tiết */}
        <Col span={14}>
          <Form.Item
            label="Tiêu đề Banner"
            name="title"
            rules={[{ required: true, message: "Nhập tiêu đề để quản lý" }]}
          >
            <Input placeholder="VD: Khuyến mãi Mùa hè 2024" maxLength={150} size="large" />
          </Form.Item>

          <Form.Item 
            label="Đường dẫn khi click (URL)" 
            name="click_url"
            tooltip="Người dùng sẽ được chuyển đến trang này khi bấm vào banner"
          >
            <Input prefix={<LinkOutlined />} placeholder="https://..." />
          </Form.Item>

          <Row gutter={16}>
             <Col span={12}>
                <Form.Item
                    label="Thời gian áp dụng"
                    name="date_range"
                    help="Để trống nếu muốn hiển thị ngay và vô thời hạn"
                >
                    <RangePicker 
                        showTime={{ format: 'HH:mm' }} 
                        format="DD/MM/YYYY HH:mm" 
                        style={{ width: '100%' }}
                        placeholder={['Bắt đầu', 'Kết thúc']}
                    />
                </Form.Item>
             </Col>
             <Col span={12}>
                <Form.Item
                    label="Độ ưu tiên"
                    name="priority"
                    tooltip="Số càng lớn, banner càng xuất hiện ở đầu danh sách"
                >
                    <InputNumber min={0} max={999} style={{ width: "100%" }} />
                </Form.Item>
             </Col>
          </Row>

          <Divider style={{ margin: "12px 0" }} />

          <Form.Item label="Trạng thái hiển thị" name="is_active" valuePropName="checked" style={{ marginBottom: 0 }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text type="secondary">Kích hoạt banner này ngay sau khi lưu?</Text>
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
             </div>
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <div style={{ textAlign: "right" }}>
        <Space>
          <Button onClick={onCancel} size="large">
            Hủy bỏ
          </Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} size="large">
            {bannerId ? "Lưu Thay Đổi" : "Hoàn Tất"}
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default BannerForm;