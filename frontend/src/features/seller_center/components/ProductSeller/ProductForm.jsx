import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Button,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";

const { Option } = Select;

const ProductForm = ({ visible, onCancel, onSubmit, initialValues }) => {
  const [form] = Form.useForm();
  const [availability, setAvailability] = useState("available");
  const [subcategories, setSubcategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);

  // 🟢 Lấy danh mục con từ backend
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/subcategories/")
      .then((res) => setSubcategories(res.data))
      .catch((err) => console.error("Lỗi tải subcategories:", err));
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/categories/")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Lỗi tải categories:", err));
  }, []);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    form.setFieldsValue({ subcategory: null });

    axios
      .get(`http://localhost:8000/api/subcategories/?category=${categoryId}`)
      .then((res) => setSubcategories(res.data))
      .catch((err) => console.error("Lỗi tải subcategories:", err));
  };
  // 🟢 Khi mở modal, fill dữ liệu hoặc reset
  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue({
          ...initialValues,
          availability_status: initialValues.availability_status || "available",
        });
        setAvailability(initialValues.availability_status || "available");
      } else {
        form.resetFields();
        form.setFieldsValue({ availability_status: "available" });
        setAvailability("available");
        setImageFile(null);
        setPreviewUrl(null);
      }
    }
  }, [visible, initialValues, form]);

  // 🟢 Xử lý chọn ảnh
  const handleImageChange = (info) => {
    const file = info.file?.originFileObj;

    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      // Nếu xóa ảnh hoặc không chọn file
      setImageFile(null);
      setPreviewUrl(null);
    }
  };

  // 🟢 Xử lý đổi trạng thái hàng hóa
  const handleAvailabilityChange = (value) => {
    setAvailability(value);
    form.setFieldsValue({ availability_status: value });
  };

  // 🟢 Gửi form
  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        if (!imageFile) {
          message.error("Vui lòng tải lên hình ảnh sản phẩm!");
          return;
        }

        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("description", values.description);
        formData.append("subcategory", values.subcategory);
        formData.append("price", values.price);
        formData.append("stock", values.stock);
        formData.append("availability_status", availability);
        formData.append("image", imageFile);

        if (availability === "coming_soon") {
          formData.append("season_start", values.season_start);
          formData.append("season_end", values.season_end);
          formData.append("estimated_quantity", values.estimated_quantity);
        }

        // Gửi formData sang backend
        onSubmit(formData);

        message.success("Đã gửi form thành công!");
        form.resetFields();
        setAvailability("available");
        setImageFile(null);
        setPreviewUrl(null);
      })
      .catch((info) => console.log("❌ Validate Failed:", info));
  };

  return (
    <Modal
      open={visible}
      title={initialValues ? "Sửa sản phẩm" : "Thêm sản phẩm"}
      okText={initialValues ? "Cập nhật" : "Thêm"}
      cancelText="Hủy"
      onCancel={onCancel}
      onOk={handleOk}
    >
      <Form form={form} layout="vertical" name="productForm">
        {/* 🟡 Trạng thái hàng hóa */}
        <Form.Item
          label="Trạng thái hàng hóa"
          name="availability_status"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          initialValue="available"
        >
          <Select onChange={handleAvailabilityChange}>
            <Option value="available">Có sẵn</Option>
            <Option value="coming_soon">Sắp có</Option>
          </Select>
        </Form.Item>

        {/* 🟡 Tên sản phẩm */}
        <Form.Item
          label="Tên sản phẩm"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}
        >
          <Input placeholder="Nhập tên sản phẩm" />
        </Form.Item>

        {/* 🟡 Mô tả */}
        <Form.Item
          label="Mô tả"
          name="description"
          rules={[{ required: true, message: "Vui lòng nhập mô tả sản phẩm" }]}
        >
          <Input.TextArea rows={3} placeholder="Nhập mô tả chi tiết..." />
        </Form.Item>

        {/* 🟡 Danh mục con */}
        <Form.Item
          label="Danh mục cha"
          name="category"
          rules={[{ required: true, message: "Vui lòng chọn danh mục cha" }]}
        >
          <Select placeholder="Chọn danh mục" onChange={handleCategoryChange}>
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.id}>
                {cat.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Danh mục con"
          name="subcategory"
          rules={[{ required: true, message: "Vui lòng chọn danh mục con" }]}
        >
          <Select placeholder="Chọn danh mục con" disabled={!selectedCategory}>
            {subcategories.map((sub) => (
              <Option key={sub.id} value={sub.id}>
                {sub.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 🟡 Giá */}
        <Form.Item
          label="Giá (VNĐ)"
          name="price"
          rules={[{ required: true, message: "Vui lòng nhập giá" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            placeholder="Nhập giá"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
          />
        </Form.Item>

        {/* 🟡 Tồn kho */}
        <Form.Item
          label="Tồn kho"
          name="stock"
          rules={[{ required: true, message: "Vui lòng nhập tồn kho" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            placeholder="Số lượng tồn"
          />
        </Form.Item>

        {/* 🟡 Hình ảnh sản phẩm */}
        {/* 🟡 Hình ảnh sản phẩm */}
        <Form.Item label="Hình ảnh" required>
          <Upload
            listType="picture"
            beforeUpload={() => false}
            onChange={handleImageChange}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>

          {previewUrl && (
            <img
              src={previewUrl}
              alt="preview"
              style={{
                width: "100%",
                marginTop: 10,
                borderRadius: 8,
                objectFit: "cover",
              }}
            />
          )}
        </Form.Item>

        {/* 🟢 Hiện thêm trường nếu sắp có */}
        {availability === "coming_soon" && (
          <>
            <Form.Item
              label="Thời gian bắt đầu mùa vụ"
              name="season_start"
              rules={[
                { required: true, message: "Vui lòng chọn ngày bắt đầu" },
              ]}
            >
              <Input type="date" />
            </Form.Item>

            <Form.Item
              label="Thời gian kết thúc mùa vụ"
              name="season_end"
              rules={[
                { required: true, message: "Vui lòng chọn ngày kết thúc" },
              ]}
            >
              <Input type="date" />
            </Form.Item>

            <Form.Item
              label="Sản lượng dự kiến"
              name="estimated_quantity"
              rules={[
                { required: true, message: "Vui lòng nhập sản lượng dự kiến" },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                placeholder="Nhập số lượng dự kiến"
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default ProductForm;
