// src/features/stores/components/StoreDetail/StoreHeader.jsx
import React from "react";
import { Card, Button, Typography, Row, Col } from "antd";
import { MessageOutlined, UserOutlined } from "@ant-design/icons";
import { getInitial } from "./utils/utils";

const { Title, Text } = Typography;

const StoreHeader = ({
  store,
  isFollowing,
  followers,
  followingCount,
  ratingStats,
  onFollow,
  onOpenChat,
}) => {
  return (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        marginBottom: 24,
      }}
    >
      <Row gutter={[24, 24]} align="middle">
        {/* Avatar & Actions */}
        <Col xs={24} md={10}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Avatar */}
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                border: "4px solid #fff",
                boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                overflow: "hidden",
                background: "#f5f5f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                fontWeight: 700,
                color: "#8c8c8c",
                textTransform: "uppercase",
              }}
            >
              {store.image ? (
                <img
                  src={store.image}
                  alt={store.store_name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                getInitial(store.store_name)
              )}
            </div>

            {/* Store name & buttons */}
            <div>
              <Title level={4} style={{ margin: 0, marginBottom: 12 }}>
                {store.store_name}
              </Title>
              <div style={{ display: "flex", gap: 12 }}>
                <Button
                  type={isFollowing ? "primary" : "default"}
                  onClick={onFollow}
                >
                  {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </Button>
                <Button icon={<MessageOutlined />} onClick={onOpenChat}>
                  Nhắn tin
                </Button>
              </div>
            </div>
          </div>
        </Col>

        {/* Stats & Bio */}
        <Col xs={24} md={14}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <Text strong>{followingCount}</Text> Đang theo dõi
            </div>
            <div>
              <Text strong>{followers}</Text> Người theo dõi
            </div>
            <div>
              Đánh giá:{" "}
              <Text strong>{ratingStats.avg.toFixed(1)}</Text> (
              <Text strong>{ratingStats.total}</Text>)
            </div>
            {store.bio && (
              <Text type="secondary" style={{ maxWidth: 560, lineHeight: 1.5 }}>
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