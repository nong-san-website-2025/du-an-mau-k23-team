import React from "react";
import { Row, Col, Form, Input, Select, Upload, Button, Space, Card, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { TextArea } = Input;

export default function BlogFormFields({ form, fileList, setFileList, categories, onClose, editing }) {
  const handleUploadChange = ({ fileList: newList }) => setFileList(newList);

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) message.error("Chỉ chấp nhận file ảnh!");
    return isImage;
  };

  return (
    <Row gutter={24}>
      {/* Cột trái: nội dung */}
      <Col span={16}>
        <Form.Item
          label="Tiêu đề"
          name="title"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
        >
          <Input placeholder="Tiêu đề bài viết" size="large" />
        </Form.Item>

        <Form.Item
          label="Danh mục"
          name="category"
          rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
        >
          <Select placeholder="Chọn danh mục" size="large">
            {categories.map((c) => (
              <Select.Option key={c.id} value={c.id}>
                {c.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Nội dung"
          name="content"
          rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
        >
          <TextArea
            rows={10}
            placeholder="Nhập nội dung (Markdown hoặc HTML)"
            style={{ borderRadius: 6, fontSize: 15, lineHeight: 1.6 }}
          />
        </Form.Item>
      </Col>

      {/* Cột phải: ảnh và nút */}
      <Col span={8}>
        <Card 
          title="Ảnh đại diện" 
          variant="borderless"
          styles={{ 
            body: { background: "#fafafa" },
          }}
          style={{ background: "#fafafa", borderRadius: 8 }}
        >
          <Upload
            listType="picture-card"
            maxCount={1}
            fileList={fileList}
            beforeUpload={beforeUpload}
            onChange={handleUploadChange}
            accept="image/*"
          >
            {fileList.length >= 1 ? null : (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Chọn ảnh</div>
              </div>
            )}
          </Upload>
        </Card>

        <Form.Item style={{ marginTop: 24 }}>
          <Space>
            <Button 
              type="primary" 
              onClick={() => form.submit()}
              size="large"
            >
              {editing ? "Cập nhật bài viết" : "Đăng bài mới"}
            </Button>
            <Button size="large" onClick={onClose}>
              Hủy
            </Button>
          </Space>
        </Form.Item>
      </Col>
    </Row>
  );
}
