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
  handleOpenChat,
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
                  onClick={handleOpenChat} // <-- Dùng hàm này
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
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <Text strong>{followingCount}</Text> Đang theo dõi
            </div>
            <div>
              <Text strong>{followers}</Text> Người theo dõi
            </div>
            {/* DÒNG ĐÃ ĐƯỢC SỬA LỖI */}
            <div>
              Đánh giá: <Text strong>{(ratingStats?.avg ?? 0).toFixed(1)}</Text>{" "}
              (<Text strong>{ratingStats?.total ?? 0}</Text>)
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
