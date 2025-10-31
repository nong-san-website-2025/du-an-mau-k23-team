"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  Card,
  Form,
  Input,
  Upload,
  Button,
  Row,
  Col,
  Typography,
  message,
  Spin,
  Divider,
  Avatar,
  Space,
  Tag,
} from "antd"
import {
  ShopOutlined,
  UploadOutlined,
  SaveOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons"
import sellerService from "../services/api/sellerService"

const { Title, Text } = Typography
const { TextArea } = Input

export default function StoreManagement() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sellerId, setSellerId] = useState(null)

  const [form, setForm] = useState({
    store_name: "",
    bio: "",
    address: "",
    phone: "",
    image: null,
  })
  const [imageFile, setImageFile] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const me = await sellerService.getMe()
        if (!mounted) return
        setSellerId(me.id)
        setForm({
          store_name: me.store_name || "",
          bio: me.bio || "",
          address: me.address || "",
          phone: me.phone || "",
          image: me.image || null,
        })
      } catch (e) {
        console.error(e)
        message.error("Không thể tải thông tin cửa hàng")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const previewUrl = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile)
    if (form.image) return form.image
    return null
  }, [imageFile, form.image])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!sellerId) return
    try {
      setSaving(true)
      let payload
      if (imageFile) {
        payload = new FormData()
        payload.append("store_name", form.store_name)
        payload.append("bio", form.bio)
        payload.append("address", form.address)
        payload.append("phone", form.phone)
        payload.append("image", imageFile)
      } else {
        payload = {
          store_name: form.store_name,
          bio: form.bio,
          address: form.address,
          phone: form.phone,
        }
      }
      const updated = await sellerService.update(sellerId, payload)
      setForm((prev) => ({
        ...prev,
        ...updated,
      }))
      setImageFile(null)
      message.success("Đã lưu thay đổi thành công 🎉")
    } catch (e) {
      console.error(e)
      message.error("Lưu thất bại, vui lòng thử lại!")
    } finally {
      setSaving(false)
    }
  }

  const uploadProps = {
    beforeUpload: (file) => {
      setImageFile(file)
      return false
    },
    showUploadList: false,
  }

  if (loading)
    return (
      <div className="flex justify-center items-center py-10">
        <Spin tip="Đang tải dữ liệu..." />
      </div>
    )

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <Space align="center" style={{ marginBottom: 24 }}>
        <ShopOutlined style={{ fontSize: 32, color: "#1677ff" }} />
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Cài đặt Cửa hàng
          </Title>
          <Text type="secondary">
            Quản lý thông tin & hình ảnh hiển thị công khai trên trang cửa hàng
          </Text>
        </div>
      </Space>

      <Row gutter={24}>
        {/* Bên trái: Thông tin tổng quan */}
        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <Avatar
                size={120}
                src={previewUrl}
                icon={<ShopOutlined />}
                style={{
                  marginBottom: 16,
                  border: "2px solid #f0f0f0",
                  backgroundColor: "#fafafa",
                }}
              />
              <Upload {...uploadProps} accept="image/*">
                <Button icon={<UploadOutlined />}>Đổi logo</Button>
              </Upload>
            </div>

            <Divider />

            <Title level={5} style={{ marginBottom: 8, textAlign: "center" }}>
              {form.store_name || "Tên cửa hàng"}
            </Title>

            <Text type="secondary" style={{ display: "block", textAlign: "center" }}>
              {form.bio || "Chưa có mô tả"}
            </Text>

            <Divider />

            <div style={{ lineHeight: 1.8 }}>
              <p>
                <EnvironmentOutlined className="me-2" />{" "}
                {form.address || <Text type="secondary">Chưa có địa chỉ</Text>}
              </p>
              <p>
                <PhoneOutlined className="me-2" />{" "}
                {form.phone || <Text type="secondary">Chưa có SĐT</Text>}
              </p>
            </div>

            <div style={{ textAlign: "center", marginTop: 12 }}>
              <Tag color="blue">Cửa hàng đang hoạt động</Tag>
            </div>
          </Card>
        </Col>

        {/* Bên phải: Form chỉnh sửa */}
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
            title={
              <Space>
                <InfoCircleOutlined />
                <span>Chỉnh sửa thông tin</span>
              </Space>
            }
          >
            <Form layout="vertical">
              <Form.Item
                label="Tên cửa hàng"
                required
                tooltip="Tên hiển thị công khai trên trang cửa hàng"
              >
                <Input
                  name="store_name"
                  value={form.store_name}
                  onChange={handleChange}
                  placeholder="VD: Nông Sản Xanh Đà Lạt"
                />
              </Form.Item>

              <Form.Item label="Mô tả cửa hàng">
                <TextArea
                  name="bio"
                  rows={3}
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Giới thiệu ngắn gọn về cửa hàng"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item label="Địa chỉ">
                    <Input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Nhập địa chỉ cụ thể"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Số điện thoại"
                    rules={[{ pattern: /^[0-9]{9,11}$/, message: "SĐT không hợp lệ" }]}
                  >
                    <Input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="VD: 098xxxxxxx"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Form.Item>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={saving}
                  size="large"
                  style={{ float: "right", minWidth: 150 }}
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
