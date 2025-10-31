// src/features/stores/components/StoreDetail/StoreHeader.jsx
import React from "react";
import { Card, Button, Typography, Row, Col, Rate } from "antd";
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
  onOpenChat,
}) => {
  return (
    <Card
      style={{
        borderRadius: 24,
        border: "none",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
        marginBottom: 32,
        overflow: "hidden",
        padding: "28px 32px",
      }}
    >
      <Row gutter={[28, 28]} align="middle">
        {/* Avatar & Info */}
        <Col xs={24} md={10}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {/* Avatar */}
            <div
              style={{
                position: "relative",
                width: 132,
                height: 132,
                borderRadius: "50%",
                border: "4px solid white",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.08)",
                overflow: "hidden",
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
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

            {/* Store name & actions */}
            <div>
              <Title
                level={4}
                style={{
                  margin: 0,
                  marginBottom: 14,
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#0f172a",
                  lineHeight: 1.2,
                }}
              >
                {store.store_name}
              </Title>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Button
                  size="middle"
                  type={isFollowing ? "primary" : "default"}
                  onClick={onFollow}
                  icon={!isFollowing ? <PlusOutlined /> : null}
                  style={{
                    borderRadius: 12,
                    fontWeight: 600,
                    padding: "0 18px",
                    height: 38,
                    fontSize: 14,
                  }}
                >
                  {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </Button>
                <Button
                  size="middle"
                  icon={<MessageOutlined />}
                  onClick={onOpenChat}
                  style={{
                    borderRadius: 12,
                    fontWeight: 600,
                    padding: "0 18px",
                    height: 38,
                    fontSize: 14,
                    borderColor: "#cbd5e1",
                    color: "#475569",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  Nhắn tin
                </Button>
              </div>
            </div>
          </div>
        </Col>

        {/* Stats & Bio */}
        <Col xs={24} md={14}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "flex",
                gap: 28,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {/* Following */}
              <div style={{ textAlign: "center" }}>
                <Text style={{ display: "block", color: "#64748b", fontSize: 13 }}>
                  Đang theo dõi
                </Text>
                <Text style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                  {followingCount}
                </Text>
              </div>

              {/* Followers */}
              <div style={{ textAlign: "center" }}>
                <Text style={{ display: "block", color: "#64748b", fontSize: 13 }}>
                  Lượt theo dõi
                </Text>
                <Text style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                  {followers}
                </Text>
              </div>

              {/* Rating */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Text style={{ color: "#64748b", fontSize: 13 }}>Đánh giá:</Text>
                <Rate
                  disabled
                  allowHalf
                  value={ratingStats.rating || 0}
                  style={{ fontSize: 14, color: "#f59e0b" }}
                />
                <Text style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                  {ratingStats.avg?.toFixed(1) || "0.0"}
                </Text>
                <Text style={{ color: "#64748b", fontSize: 13 }}>
                  ({ratingStats.total || 0})
                </Text>
              </div>
            </div>

            {/* Bio */}
            {store.bio && (
              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "#334155",
                  marginTop: 8,
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