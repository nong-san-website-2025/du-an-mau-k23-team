// src/pages/Admin/Marketing/BannerForm.jsx
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Switch,
  Upload,
  DatePicker,
  InputNumber,
  Button,
  message,
  Space,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import moment from "moment";
import API from "../../../login_register/services/api";

const { Option } = Select;

const BannerForm = ({ bannerId, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Load dữ liệu nếu đang sửa
  useEffect(() => {
    if (bannerId) {
      API.get(`/marketing/banners/${bannerId}/`)
        .then((res) => {
          const data = res.data;
          form.setFieldsValue({
            title: data.title || undefined,
            position: data.position,
            priority: data.priority,
            is_active: data.is_active,
            click_url: data.click_url || undefined,
            target_category: data.target_category?.id || undefined,
            start_at: data.start_at ? moment(data.start_at) : null,
            end_at: data.end_at ? moment(data.end_at) : null,
          });
        })
        .catch(() => message.error("Không tải được banner"));
    } else {
      form.resetFields();
    }
  }, [bannerId, form]);

  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();

    // Thêm các trường
    if (values.title) formData.append("title", values.title);
    formData.append("position", values.position);
    formData.append("priority", String(values.priority));
    formData.append("is_active", values.is_active ? "true" : "false");

    if (values.click_url) formData.append("click_url", values.click_url);
    if (values.target_category)
      formData.append("target_category", values.target_category);
    if (values.start_at)
      formData.append("start_at", values.start_at.toISOString());
    if (values.end_at) formData.append("end_at", values.end_at.toISOString());

    // Xử lý ảnh
    const fileList = values.image || [];
    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("image", fileList[0].originFileObj);
    }
    console.log("Image field:", values.image);
    console.log("First file:", values.image?.[0]?.originFileObj);
    try {
      if (bannerId) {
        await API.put(`/marketing/banners/${bannerId}/`, formData, {});
        message.success("Cập nhật banner thành công!");
      } else {
        await API.post("/marketing/banners/", formData, {});
        message.success("Tạo banner thành công!");
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      message.error("Lưu banner thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const normFile = (e) => {
    if (Array.isArray(e)) return e;
    return e?.fileList || [];
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        position: "carousel",
        priority: 0,
        is_active: false,
      }}
    >
      <Form.Item label="Tiêu đề" name="title">
        <Input
          placeholder="VD: Flash Sale 50% - Chỉ hôm nay!"
          maxLength={200}
        />
      </Form.Item>

      <Form.Item
        label="Vị trí hiển thị"
        name="position"
        rules={[{ required: true, message: "Vui lòng chọn vị trí" }]}
      >
        <Select>
          <Option value="hero">Hero - Top trang</Option>
          <Option value="carousel">Carousel (slider)</Option>
          <Option value="side">Sidebar</Option>
          <Option value="mobile">Chỉ hiển thị trên điện thoại</Option>
          <Option value="modal">Modal Popup (hiện khi vào web)</Option>
        </Select>
      </Form.Item>

      <Form.Item
        label="Ảnh banner"
        name="image"
        valuePropName="fileList"
        getValueFromEvent={normFile}
      >
        <Upload
          listType="picture"
          maxCount={1}
          beforeUpload={() => false} // Ngăn upload tự động
        >
          <Button icon={<UploadOutlined />}>
            Chọn ảnh (tỷ lệ đề xuất: 1200x400)
          </Button>
        </Upload>
      </Form.Item>

      <Form.Item label="URL khi click (tùy chọn)" name="click_url">
        <Input placeholder="https://yourshop.com/sale" />
      </Form.Item>

      {/* Nếu bạn có API danh mục, có thể fetch và hiển thị ở đây */}
      {/* <Form.Item label="Áp dụng cho danh mục" name="target_category">
        <Select allowClear placeholder="Tất cả danh mục">
          {categories.map(cat => (
            <Option key={cat.id} value={cat.id}>{cat.name}</Option>
          ))}
        </Select>
      </Form.Item> */}

      <Form.Item
        label="Độ ưu tiên"
        name="priority"
        tooltip="Số càng lớn, banner càng hiện trước"
      >
        <InputNumber min={0} style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item label="Kích hoạt" name="is_active" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item label="Thời gian bắt đầu" name="start_at">
        <DatePicker
          showTime
          format="DD/MM/YYYY HH:mm"
          style={{ width: "100%" }}
          placeholder="Ngay lập tức nếu để trống"
        />
      </Form.Item>

      <Form.Item label="Thời gian kết thúc" name="end_at">
        <DatePicker
          showTime
          format="DD/MM/YYYY HH:mm"
          style={{ width: "100%" }}
          placeholder="Không giới hạn nếu để trống"
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {bannerId ? "Cập nhật" : "Tạo banner"}
          </Button>
          <Button htmlType="button" onClick={onSuccess}>
            Hủy
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default BannerForm;
