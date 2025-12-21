import { Modal, Form, Input, Select, Button, message, Upload } from "antd";
import { useState, useEffect } from "react";
import axios from "axios";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";

const { Option } = Select;

// Hàm hỗ trợ convert file sang base64 để preview nhanh
const getBase64 = (img, callback) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result));
  reader.readAsDataURL(img);
};

const CategoryWithSubModal = ({ visible, onClose, onSuccess, category }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // States cho hình ảnh
  const [imageUrl, setImageUrl] = useState(null); // URL để hiển thị preview
  const [fileList, setFileList] = useState([]);   // File thực tế để gửi lên server

  useEffect(() => {
    if (category) {
      // Chế độ Edit: Fill dữ liệu cũ
      form.setFieldsValue({
        name: category.name,
        key: category.key_code || category.key, // Fallback nếu backend trả về tên trường khác nhau
        status: category.status,
      });
      // Hiển thị ảnh cũ từ server (nếu có)
      setImageUrl(category.image || null);
    } else {
      // Chế độ Thêm mới: Reset form
      form.resetFields();
      setImageUrl(null);
    }
    setFileList([]); // Reset file list mỗi khi mở modal
  }, [category, visible, form]);

  // Xử lý khi chọn ảnh
  const handleChange = (info) => {
    if (info.file.status === "uploading") {
      return;
    }
    // Lấy file thực tế
    const file = info.file.originFileObj || info.file;
    
    // Tạo preview ảnh
    getBase64(file, (url) => {
      setLoading(false);
      setImageUrl(url);
    });
    
    // Lưu vào state để tí gửi đi
    setFileList([file]);
  };

  // Chặn auto upload của Antd (để mình tự gửi qua axios submit form)
  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp";
    if (!isJpgOrPng) {
      message.error("Bạn chỉ có thể tải lên file JPG/PNG/WEBP!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Hình ảnh phải nhỏ hơn 2MB!");
    }
    // Trả về false để chặn auto upload, chỉ xử lý logic hiển thị
    return false; 
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // 1. Sử dụng FormData để gửi file + text
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("key", values.key); // Lưu ý backend nhận key hay key_code
      formData.append("status", values.status);

      // 2. Chỉ append ảnh nếu người dùng có chọn ảnh mới
      if (fileList.length > 0) {
        formData.append("image", fileList[0]);
      }

      // Cấu hình header cho multipart/form-data
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      if (category) {
        // --- CHỈNH SỬA ---
        await axios.patch(
          `${process.env.REACT_APP_API_URL}/products/categories/${category.id}/`,
          formData,
          config
        );
        message.success("Cập nhật danh mục và hình ảnh thành công");
      } else {
        // --- TẠO MỚI ---
        await axios.post(
          `${process.env.REACT_APP_API_URL}/products/categories/`,
          formData,
          config
        );
        message.success("Thêm danh mục mới thành công");
      }

      form.resetFields();
      setImageUrl(null);
      setFileList([]);
      onSuccess(); // Refresh lại bảng ở trang cha
      onClose();   // Đóng modal
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || "Lỗi khi lưu danh mục";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Nút upload
  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Tải ảnh</div>
    </div>
  );

  return (
    <Modal
      open={visible}
      title={category ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={500}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        
        {/* Phần Upload Ảnh */}
        <Form.Item label="Hình ảnh danh mục">
          <Upload
            name="image"
            listType="picture-card"
            className="avatar-uploader"
            showUploadList={false} // Ẩn list mặc định, dùng custom preview
            beforeUpload={beforeUpload}
            onChange={handleChange}
            fileList={fileList}
            accept="image/*"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
              />
            ) : (
              uploadButton
            )}
          </Upload>
        </Form.Item>

        <Form.Item
          label="Tên danh mục"
          name="name"
          rules={[{ required: true, message: "Nhập tên danh mục" }]}
        >
          <Input placeholder="Ví dụ: Rau củ quả" />
        </Form.Item>

        <Form.Item
          label="Key (Mã định danh)"
          name="key"
          rules={[{ required: true, message: "Nhập key duy nhất" }]}
          tooltip="Mã này dùng để code logic, ví dụ: 'vegetable', 'fruit'..."
        >
          <Input placeholder="Ví dụ: vegetable" />
        </Form.Item>

        <Form.Item label="Trạng thái" name="status" initialValue="active">
          <Select>
            <Option value="active">Hoạt động</Option>
            <Option value="inactive">Ngưng hoạt động</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CategoryWithSubModal;