// Tab 1: Thông tin cơ bản
import React from "react";
import { Descriptions, Avatar, Tag, Row, Col, Card, Skeleton } from "antd";
import { Mail, Phone, Shield, Home, Calendar } from "lucide-react";

export default function BasicInfoTab({ user, loading }) {
  if (loading) return <Skeleton active />;
  if (!user) return <div>Không có dữ liệu</div>;

  return (
    <div style={{ padding: "20px" }}>
      <Row gutter={[16, 16]}>
        {/* Avatar & Status */}
        <Col xs={24} sm={12} md={8}>
          <Card style={{ textAlign: "center" }}>
            <Avatar size={120} src={user.avatar} style={{ marginBottom: "16px" }} />
            <h3>{user.full_name || user.username}</h3>
            <Tag color={user.is_active ? "green" : "red"}>
              {user.is_active ? "Đang hoạt động" : "Ngừng hoạt động"}
            </Tag>
          </Card>
        </Col>

        {/* Basic Info */}
        <Col xs={24} sm={12} md={16}>
          <Card>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={<Mail size={16} />} labelStyle={{ marginRight: "8px" }}>
                {user.email || "Chưa có"}
              </Descriptions.Item>
              <Descriptions.Item label={<Phone size={16} />} labelStyle={{ marginRight: "8px" }}>
                {user.phone || "Chưa có"}
              </Descriptions.Item>
              <Descriptions.Item label={<Shield size={16} />} labelStyle={{ marginRight: "8px" }}>
                {user.role?.name || "Chưa xác định"}
              </Descriptions.Item>
              <Descriptions.Item label={<Home size={16} />} labelStyle={{ marginRight: "8px" }}>
                {user.address || "Chưa có"}
              </Descriptions.Item>
              <Descriptions.Item label={<Calendar size={16} />} labelStyle={{ marginRight: "8px" }}>
                {user.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "Chưa có"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Additional Info */}
      <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
        <Col xs={24}>
          <Card title="Thông tin bổ sung">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Tên tài khoản">
                {user.username || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Loại tài khoản">
                {user.account_type || "Khách hàng"}
              </Descriptions.Item>
              <Descriptions.Item label="Quốc gia">
                {user.country || "Việt Nam"}
              </Descriptions.Item>
              <Descriptions.Item label="Thành phố">
                {user.city || "Chưa cập nhật"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
