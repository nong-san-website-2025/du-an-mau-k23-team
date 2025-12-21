import React from "react";
import { Form, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";

const { Dragger } = Upload;

const UploadBlock = ({ label, onChange, fileState }) => (
  <Form.Item
    label={label}
    required
    rules={[{ required: true, message: "Bắt buộc tải lên tài liệu này" }]}
  >
    <Dragger
      beforeUpload={() => false}
      onChange={(info) => onChange(info.file)}
      maxCount={1}
      listType="picture"
      fileList={fileState ? [fileState] : []}
      style={{
        background: "#fafafa",
        borderColor: "#d9d9d9",
        padding: "10px",
      }}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined style={{ color: "#1890ff" }} />
      </p>
      <p className="ant-upload-text" style={{ fontSize: 14 }}>
        Kéo thả hoặc chọn ảnh
      </p>
    </Dragger>
  </Form.Item>
);

export default UploadBlock;