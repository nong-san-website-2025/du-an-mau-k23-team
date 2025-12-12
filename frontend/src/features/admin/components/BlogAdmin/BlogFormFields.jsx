import React from "react";
import { Row, Col, Form, Input, Select, Upload, Card, Switch, Typography, Space } from "antd";
import { InboxOutlined, FileImageOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Dragger } = Upload;
const { Text } = Typography;

export default function BlogFormFields({ fileList, setFileList, categories }) {
  
  const handleUploadChange = ({ fileList: newList }) => {
    // Giới hạn chỉ 1 file
    setFileList(newList.slice(-1));
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      // message.error được xử lý ở component cha hoặc để mặc định antd
    }
    return false; // Return false để không auto upload, ta sẽ upload thủ công khi submit form
  };

  return (
    <Row gutter={24}>
      {/* Cột chính: Nội dung bài viết */}
      <Col span={16}>
        <Card title="Nội dung chi tiết" bordered={false} className="shadow-sm">
          <Form.Item
            label="Tiêu đề bài viết"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
          >
            <Input placeholder="Nhập tiêu đề hấp dẫn..." size="large" showCount maxLength={200} />
          </Form.Item>

          <Form.Item
            label="Nội dung"
            name="content"
            rules={[{ required: true, message: "Nội dung không được để trống!" }]}
          >
            <TextArea
              rows={18}
              placeholder="Viết nội dung của bạn ở đây (Hỗ trợ Markdown hoặc HTML)..."
              showCount
              style={{ fontSize: 16, lineHeight: 1.6, padding: 12 }}
            />
          </Form.Item>
        </Card>
      </Col>

      {/* Cột phải: Cài đặt & Meta */}
      <Col span={8}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          
          <Card title="Phân loại & Trạng thái" size="small">
            <Form.Item
              label="Danh mục"
              name="category"
              rules={[{ required: true, message: "Chọn danh mục!" }]}
            >
              <Select placeholder="-- Chọn danh mục --" size="large">
                {categories.map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Trạng thái" name="is_published" valuePropName="checked" initialValue={true}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Xuất bản ngay</Text>
                <Switch defaultChecked />
              </div>
            </Form.Item>
          </Card>

          <Card title="Ảnh đại diện (Thumbnail)" size="small">
            <Form.Item style={{ marginBottom: 0 }}>
              <Dragger
                fileList={fileList}
                beforeUpload={beforeUpload}
                onChange={handleUploadChange}
                accept="image/*"
                listType="picture"
                maxCount={1}
                height={150}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text">Kéo thả ảnh hoặc click để chọn</p>
                <p className="ant-upload-hint">Hỗ trợ JPG, PNG. Tối đa 5MB.</p>
              </Dragger>
            </Form.Item>
          </Card>

          {/* Nếu sau này cần thêm SEO Meta fields thì thêm Card ở đây */}
          
        </Space>
      </Col>
    </Row>
  );
}