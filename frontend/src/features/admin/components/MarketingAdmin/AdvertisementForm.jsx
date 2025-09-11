import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Switch,
  Upload,
  Button,
  message,
  Row,
  Col,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import moment from "moment";
import {
  createAdvertisement,
  updateAdvertisement,
} from "../../services/advertisementApi";

export default function AdvertisementForm({
  open,
  onClose,
  onSuccess,
  initialData,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        start_date: initialData.start_date
          ? moment(initialData.start_date)
          : null,
        end_date: initialData.end_date ? moment(initialData.end_date) : null,
      });
    } else {
      form.resetFields();
    }
  }, [initialData, form]);

  const handleSubmit = async (values) => {
    const formData = new FormData();

    // Lặp qua toàn bộ form values
    for (const key in values) {
      if (
        key === "image" &&
        Array.isArray(values.image) &&
        values.image.length > 0
      ) {
        formData.append("image", values.image[0].originFileObj); // Lấy đúng file
      } else if (moment.isMoment(values[key])) {
        // Nếu là DatePicker (moment object) -> convert sang string
        formData.append(key, values[key].toISOString());
      } else if (values[key] !== undefined && values[key] !== null) {
        formData.append(key, values[key]);
      }
    }

    try {
      if (initialData) {
        await updateAdvertisement(initialData.id, formData);
        message.success("Cập nhật quảng cáo thành công!");
      } else {
        await createAdvertisement(formData);
        message.success("Thêm quảng cáo thành công!");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      message.error("Lưu quảng cáo thất bại!");
    }
  };

  return (
    <Modal
      title={initialData ? "Cập nhật quảng cáo" : "Thêm quảng cáo"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Lưu"
      width={800} // <-- Tăng chiều rộng modal
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="title"
              label="Tiêu đề"
              rules={[{ required: true, message: "Nhập tiêu đề!" }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="description" label="Mô tả">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="image"
              label="Hình ảnh"
              valuePropName="fileList"
              getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
              rules={[{ required: !initialData, message: "Chọn hình ảnh!" }]}
            >
              <Upload
                maxCount={1}
                beforeUpload={() => false}
                listType="picture"
              >
                <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
              </Upload>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="redirect_link" label="Link điều hướng">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="ad_type"
              label="Loại quảng cáo"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="popup">Popup Modal</Select.Option>
                <Select.Option value="banner">Banner</Select.Option>
                <Select.Option value="flash_sale">Flash Sale</Select.Option>
                <Select.Option value="home_top">Home Top Banner</Select.Option>
                <Select.Option value="home_middle">
                  Home Middle Banner
                </Select.Option>
                <Select.Option value="home_bottom">
                  Home Bottom Banner
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="target_type"
              label="Mục tiêu"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="all_users">
                  Tất cả người dùng
                </Select.Option>
                <Select.Option value="new_users">Khách hàng mới</Select.Option>
                <Select.Option value="returning_users">
                  Khách quay lại
                </Select.Option>
                <Select.Option value="vip_users">Khách VIP</Select.Option>
                <Select.Option value="seller">Người bán</Select.Option>
                <Select.Option value="custom">Tùy chỉnh</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="start_date"
              label="Ngày bắt đầu"
              rules={[{ required: true }]}
            >
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="end_date" label="Ngày kết thúc">
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="priority" label="Thứ tự ưu tiên" initialValue={0}>
              <Input type="number" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="is_active"
              label="Kích hoạt"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
