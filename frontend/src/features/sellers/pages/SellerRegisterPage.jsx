import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  message,
  Result,
  Spin,
  Card,
  Steps,
} from "antd";
import {
  UploadOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../login_register/services/AuthContext";

const { Step } = Steps;

export default function SellerRegisterPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sellerStatus, setSellerStatus] = useState(null); // null, pending, approved, active, rejected
  const [fileList, setFileList] = useState([]);

  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

   const { setRole } = useAuth();

  useEffect(() => {
    async function fetchSeller() {
      if (!token) return setLoading(false);
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/sellers/me/`,
          { headers }
        );
        if (!res.ok) throw new Error("Không tìm thấy seller của bạn");
        const data = await res.json();
        setSellerStatus(data.status?.toLowerCase() || null);

        if (
          ["pending", "approved", "active", "rejected"].includes(
            data.status?.toLowerCase()
          )
        ) {
          form.setFieldsValue({
            store_name: data.store_name,
            bio: data.bio,
            address: data.address,
            phone: data.phone,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSeller();
  }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    const formData = new FormData();
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      formData.append("user", payload.user_id || payload.id);
    }
    Object.entries(values).forEach(([key, value]) => {
      if (key === "image" && fileList.length > 0) {
        formData.append("image", fileList[0].originFileObj);
      } else if (value) {
        formData.append(key, value);
      }
    });

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/sellers/register/`,
        {
          method: "POST",
          body: formData,
          headers,
        }
      );
      if (!res.ok) throw new Error("Đăng ký thất bại");
      await res.json();
      message.success("Gửi yêu cầu đăng ký thành công!");
      setSellerStatus("pending");
    } catch (err) {
      message.error(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenShop = async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/sellers/activate/`,
        {
          method: "POST",
          headers,
        }
      );
      if (!res.ok) throw new Error("Mở cửa hàng thất bại");

      message.success("Cửa hàng đã mở thành công!");
      setSellerStatus("active");

      // 🔥 Cập nhật role sang "seller" ngay
      setRole("seller");

      // Optionally: gọi lại /users/me/ để sync dữ liệu backend
      const userRes = await fetch(
        `${process.env.REACT_APP_API_URL}/users/me/`,
        { headers }
      );
      if (userRes.ok) {
        const userData = await userRes.json();
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (err) {
      message.error(err.message || "Có lỗi xảy ra");
    }
  };

  if (loading)
    return <Spin tip="Đang tải..." style={{ width: "100%", marginTop: 50 }} />;

  return (
    <div style={{ maxWidth: 650, margin: "20px auto" }}>
      <Card>
        <Steps
          current={
            sellerStatus === "pending"
              ? 1
              : sellerStatus === "approved"
                ? 2
                : sellerStatus === "active"
                  ? 3
                  : 0
          }
        >
          <Step title="Chưa đăng ký" icon={<ShopOutlined />} />
          <Step title="Chờ duyệt" icon={<ClockCircleOutlined />} />
          <Step title="Duyệt" icon={<CheckCircleOutlined />} />
          <Step title="Hoạt động" icon={<CheckCircleOutlined />} />
        </Steps>

        {sellerStatus === "pending" && (
          <Result
            status="info"
            title="Yêu cầu của bạn đang chờ duyệt"
            subTitle="Quản trị viên sẽ xem xét yêu cầu đăng ký cửa hàng của bạn."
          />
        )}

        {sellerStatus === "approved" && (
          <Result
            status="success"
            title="Cửa hàng đã được duyệt"
            extra={
              <Button type="primary" size="large" onClick={handleOpenShop}>
                Mở cửa hàng
              </Button>
            }
          />
        )}

        {sellerStatus === "active" && (
          <Result
            status="success"
            title="Cửa hàng của bạn đang hoạt động"
            subTitle="Bạn có thể thêm sản phẩm và bắt đầu bán hàng."
          />
        )}

        {sellerStatus === "rejected" && (
          <Result
            status="error"
            title="Yêu cầu đăng ký bị từ chối"
            subTitle="Bạn có thể chỉnh sửa thông tin và gửi lại."
          />
        )}

        {!sellerStatus && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ marginTop: 30 }}
          >
            <Form.Item
              name="store_name"
              label="Tên cửa hàng"
              rules={[{ required: true, message: "Nhập tên cửa hàng" }]}
            >
              <Input placeholder="Nhập tên cửa hàng" />
            </Form.Item>

            <Form.Item name="bio" label="Mô tả">
              <Input.TextArea
                rows={4}
                placeholder="Giới thiệu ngắn về cửa hàng, sản phẩm, dịch vụ..."
              />
            </Form.Item>

            <Form.Item name="address" label="Địa chỉ">
              <Input placeholder="Địa chỉ cửa hàng" />
            </Form.Item>

            <Form.Item name="phone" label="Số điện thoại">
              <Input placeholder="Số điện thoại liên hệ" />
            </Form.Item>

            <Form.Item name="image" label="Ảnh cửa hàng">
              <Upload
                beforeUpload={() => false}
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                listType="picture"
              >
                <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
              </Upload>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                block
                size="large"
              >
                Gửi yêu cầu đăng ký
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
}
