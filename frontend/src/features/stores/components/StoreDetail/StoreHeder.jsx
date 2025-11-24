import React from "react";
import { Card, Button, Typography, Row, Col, Rate, Space, Tooltip } from "antd";
import { MessageOutlined, PlusOutlined } from "@ant-design/icons";
import { getInitial } from "./utils/utils";

const { Title, Text } = Typography;

const StoreHeader = ({
  store,
  isFollowing,
  followers,
  followingCount,
  ratingStats,
  onFollow,
  handleOpenChat,
}) => {
  return (
    <Card
      style={{
        borderRadius: 28,
        border: "1px solid #eef1f5",
        background: "#ffffff",
        padding: "32px 36px",
        marginBottom: 32,
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
      }}
      bodyStyle={{ padding: 0 }}
    >
      <Row gutter={[36, 36]} align="middle">
        {/* Left: Avatar + Name + Actions */}
        <Col xs={24} md={11}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {/* Avatar */}
            <div
              style={{
                width: 128,
                height: 128,
                borderRadius: "50%",
                overflow: "hidden",
                background: "linear-gradient(135deg,#f0f4ff,#f6f7fb)",
                border: "3px solid #fff",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                fontWeight: 700,
                color: "#94a3b8",
              }}
            >
              {store.image ? (
                <img
                  src={store.image}
                  alt={store.store_name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                getInitial(store.store_name)
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <Title
                level={4}
                style={{
                  marginBottom: 12,
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                {store.store_name}
              </Title>

              <Space wrap size={12}>
                <Button
                  size="middle"
                  type={isFollowing ? "primary" : "default"}
                  onClick={onFollow}
                  icon={!isFollowing ? <PlusOutlined /> : null}
                  style={{
                    borderRadius: 12,
                    padding: "0 20px",
                    height: 38,
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </Button>

                <Tooltip title="Nhắn tin với người bán">
                  <Button
                    size="middle"
                    icon={<MessageOutlined />}
                    onClick={handleOpenChat}
                    style={{
                      borderRadius: 12,
                      padding: "0 20px",
                      height: 38,
                      fontWeight: 600,
                      fontSize: 14,
                      borderColor: "#e2e8f0",
                      color: "#475569",
                      background: "#f8fafc",
                    }}
                  >
                    Nhắn tin
                  </Button>
                </Tooltip>
              </Space>
            </div>
          </div>
        </Col>

        {/* Right: Stats */}
        <Col xs={24} md={13}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 15 }}>
              <Text strong style={{ fontSize: 16 }}>
                {followingCount}
              </Text>{" "}
              <Text type="secondary">Đang theo dõi</Text>
            </div>

            <div style={{ fontSize: 15 }}>
              <Text strong style={{ fontSize: 16 }}>
                {followers}
              </Text>{" "}
              <Text type="secondary">Người theo dõi</Text>
            </div>

            <div style={{ fontSize: 15 }}>
              <Text type="secondary">Đánh giá:</Text>{" "}
              <Text strong style={{ fontSize: 16 }}>
                {(ratingStats?.avg ?? 0).toFixed(1)}
              </Text>{" "}
              <Text type="secondary">
                ({ratingStats?.total ?? 0} lượt đánh giá)
              </Text>
            </div>

            {store.bio && (
              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "#334155",
                  marginTop: 6,
                  maxWidth: 600,
                }}
              >
                {store.bio}
              </Text>
            )}
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default StoreHeader;
