// Tab 1: Thông tin cơ bản
import React from "react";
import { Descriptions, Avatar, Tag, Row, Col, Card, Skeleton, Statistic, Space, Divider, List, Typography } from "antd";
import { Mail, Phone, Shield, Calendar, ShoppingCart, DollarSign } from "lucide-react";

export default function BasicInfoTab({ user, loading }) {
  if (loading) return <Skeleton active />;
  if (!user) return <div>Không có dữ liệu</div>;

  const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "N/A";
  const lastLoginDate = user.last_login ? new Date(user.last_login).toLocaleDateString("vi-VN") : "Chưa đăng nhập";

  // Map role name to Vietnamese label and color
  const rawRole = user.role?.name ?? "";
  const roleKey = rawRole.toString().toLowerCase();
  const displayRole =
    roleKey === "seller"
      ? "Người bán"
      : roleKey === "customer"
      ? "Khách hàng"
      : rawRole || "—";
  const roleColor = roleKey === "seller" ? "orange" : roleKey === "customer" ? "blue" : "default";

  return (
    <div style={{ padding: "12px", background: "#f5f5f5", minHeight: "100vh" }}>
      {/* Header Card - Avatar & Status */}
      <Card 
        style={{ marginBottom: "24px", borderRadius: "8px" }}
        bodyStyle={{ padding: "24px", textAlign: "center" }}
      >
        <Avatar 
          size={100} 
          src={user.avatar} 
          style={{ marginBottom: "16px", border: "3px solid #1890ff" }} 
        />
        <h2 style={{ margin: "8px 0", color: "#262626" }}>
          {user.full_name || user.username}
        </h2>
        <p style={{ color: "#8c8c8c", marginBottom: "12px" }}>@{user.username}</p>
        <Space size="middle">
          <Tag 
            color={user.is_active ? "blue" : "red"}
            style={{ fontSize: "12px", padding: "4px 12px" }}
          >
            {user.is_active ? "Đang hoạt động" : "Ngừng hoạt động"}
          </Tag>
        </Space>
      </Card>

      {/* Statistics Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card bodyStyle={{ padding: "16px", textAlign: "center" }}>
            <Statistic
              title="Tổng đơn hàng"
              value={user.orders_count || 0}
              prefix={<ShoppingCart size={16} style={{ marginRight: "8px" }} />}
              valueStyle={{ color: "#1890ff", fontSize: "20px", fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bodyStyle={{ padding: "16px", textAlign: "center" }}>
            <Statistic
              title="Số dư ví"
              value={user.wallet_balance || 0}
              formatter={(value) =>
                new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                }).format(value)
              }
              prefix={<DollarSign size={16} style={{ marginRight: "8px" }} />}
              valueStyle={{ color: "#52c41a", fontSize: "20px", fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bodyStyle={{ padding: "16px", textAlign: "center" }}>
            <Statistic
              title="Điểm"
              value={user.points || 0}
              valueStyle={{ color: "#fa8c16", fontSize: "20px", fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bodyStyle={{ padding: "16px", textAlign: "center" }}>
            <Statistic
              title="Thành viên từ"
              value={createdDate}
              valueStyle={{ fontSize: "18px", fontWeight: 500 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Contact Information */}
      <Card title="Thông tin liên hệ" style={{ marginBottom: "24px" }}>
        <Descriptions column={1} size="middle">
          <Descriptions.Item 
            label={<span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Mail size={16} /> Email</span>}
          >
            {user.email ? (
              <a
                href={`mailto:${user.email}`}
                style={{
                  display: "inline-block",
                  maxWidth: "100%",
                  color: "inherit",
                  wordBreak: "break-all",
                  overflowWrap: "anywhere",
                }}
                title={user.email}
              >
                {user.email}
              </a>
            ) : (
              "N/A"
            )}
          </Descriptions.Item>
          <Descriptions.Item 
            label={<span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Phone size={16} /> Điện thoại</span>}
          >
            {user.phone ? (
              <a href={`tel:${user.phone}`}>{user.phone}</a>
            ) : (
              <span style={{ color: "#8c8c8c" }}>Chưa cập nhật</span>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Account Details */}
      <Card title="Chi tiết tài khoản" style={{ marginBottom: "24px" }}>
        <Descriptions column={{ xxl: 2, xl: 2, lg: 1, md: 1, sm: 1, xs: 1 }} size="middle">
          <Descriptions.Item label="Tên tài khoản">
            <strong>{user.username}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            <Tag color={roleColor}>
              {displayRole}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tên đầy đủ">
            {user.full_name || "Chưa cập nhật"}
          </Descriptions.Item>

        </Descriptions>
      </Card>

      {/* Addresses */}
      <Card title="Địa chỉ" style={{ marginBottom: "24px" }}>
        {user.addresses && user.addresses.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={user.addresses}
            renderItem={(addr) => (
              <List.Item key={addr.id}>
                <List.Item.Meta
                  title={<span style={{ fontWeight: 600 }}>{addr.recipient_name} {addr.is_default ? <Tag color="blue">Mặc định</Tag> : null}</span>}
                  description={addr.phone}
                />
                <Typography.Text>{addr.location}</Typography.Text>
              </List.Item>
            )}
          />
        ) : user.default_address ? (
          <div>{user.default_address}</div>
        ) : (
          <div style={{ color: "#8c8c8c" }}>Chưa có địa chỉ</div>
        )}
      </Card>

      {/* Important Dates */}
      <Card title="Lịch sử tài khoản">
        <Descriptions column={1} size="middle">
          <Descriptions.Item 
            label={<span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Calendar size={16} /> Ngày tạo</span>}
          >
            {createdDate}
          </Descriptions.Item>
          <Descriptions.Item 
            label={<span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Calendar size={16} /> Lần đăng nhập cuối</span>}
          >
            {lastLoginDate}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
