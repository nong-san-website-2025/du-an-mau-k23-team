import React from "react";
import { Row, Col, Form, Input, Select, Upload, Card, Switch, Typography, Space } from "antd";
import { InboxOutlined } from "@ant-design/icons";

// 1. Import React Quill và CSS của nó
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; 

const { Dragger } = Upload;
const { Text } = Typography;

export default function BlogFormFields({ fileList, setFileList, categories }) {
  
  const handleUploadChange = ({ fileList: newList }) => {
    setFileList(newList.slice(-1));
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      // Handle error logic
    }
    return false;
  };

  // 2. Cấu hình Toolbar cho Editor (Tùy chọn: thêm/bớt chức năng)
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
      [{ 'color': [] }, { 'background': [] }], // Thêm chọn màu chữ/nền
      [{ 'align': [] }],
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet',
    'link', 'image',
    'color', 'background', 'align'
  ];

  return (
    <Row gutter={24}>
      <Col span={16}>
        <Card title="Nội dung chi tiết" bordered={false} className="shadow-sm">
          <Form.Item
            label="Tiêu đề bài viết"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
          >
            <Input placeholder="Nhập tiêu đề hấp dẫn..." size="large" showCount maxLength={200} />
          </Form.Item>

          {/* 3. Thay thế TextArea bằng ReactQuill */}
          <Form.Item
            label="Nội dung"
            name="content"
            rules={[{ required: true, message: "Nội dung không được để trống!" }]}
            // ReactQuill cần trigger là 'onChange' để cập nhật vào Form
            trigger="onChange"
            validateTrigger={['onChange', 'onBlur']}
          >
            <ReactQuill
              theme="snow"
              modules={modules}
              formats={formats}
              placeholder="Viết nội dung của bạn ở đây..."
              style={{ 
                height: '400px', // Set chiều cao cho vùng soạn thảo
                marginBottom: '50px' // Margin dưới để tránh thanh status bar đè lên (do height của quill)
              }} 
            />
          </Form.Item>
        </Card>
      </Col>

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
        </Space>
      </Col>
    </Row>
  );
}