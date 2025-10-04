import React, { useEffect, useMemo, useState } from "react";
import { BellOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Avatar, Badge, Card, List, Typography, Empty, theme } from "antd";
import useUserProfile from "../services/useUserProfile";
import { fetchUnifiedNotifications, annotateRead, markAsRead } from "../services/notificationService";

const { Title, Text } = Typography;

export default function NotificationPage() {
  const { token } = theme.useToken();
  const profile = useUserProfile();
  const [items, setItems] = useState([]);
  const userId = profile?.id;

  // Fetch unified notifications
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!userId) return;
      try {
        const list = await fetchUnifiedNotifications(userId);
        markAsRead(userId, list.map((n) => n.id));
        const annotated = annotateRead(list, userId);
        if (mounted) setItems(annotated);
      } catch (e) {
        if (mounted) setItems([]);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const sortedNotifications = useMemo(() => {
    const arr = [...(items || [])];
    arr.sort((a, b) => {
      const ta = Number.isFinite(a?.ts) ? a.ts : (a?.time ? new Date(a.time).getTime() : 0);
      const tb = Number.isFinite(b?.ts) ? b.ts : (b?.time ? new Date(b.time).getTime() : 0);
      if (tb !== ta) return tb - ta;
      return String(b?.id ?? '').localeCompare(String(a?.id ?? ''));
    });
    return arr;
  }, [items]);

  const renderIcon = (read) => {
    const color = read ? token.colorSuccess : token.colorPrimary;
    const Icon = read ? CheckCircleOutlined : BellOutlined;
    return <Icon style={{ fontSize: 20, color }} />;
  };

  return (
    <Card
      style={{ maxWidth: "100%", margin: "10px 190px" }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BellOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
          <Title level={4} style={{ margin: 0, color: token.colorTextHeading }}>
            Thông báo
          </Title>
        </div>
      }
    >
      <List
        dataSource={sortedNotifications}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Không có thông báo nào."
            />
          ),
        }}
        itemLayout="horizontal"
        renderItem={(noti) => (
          <List.Item
            style={{
              padding: "16px 0",
              borderBottom: `1px solid ${token.colorBorder}`,
            }}
          >
            <List.Item.Meta
              avatar={
                <Badge dot={!noti.read}>
                  <Avatar
                    shape="square"
                    size={40}
                    style={{
                      backgroundColor: noti.read
                        ? token.colorSuccessBg
                        : token.colorPrimaryBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {renderIcon(noti.read)}
                  </Avatar>
                </Badge>
              }
              title={
                <Text
                  strong={!noti.read}
                  style={{
                    color: noti.read ? token.colorTextSecondary : token.colorText,
                    fontSize: 15,
                  }}
                >
                  {noti.message}
                </Text>
              }
              description={
                <div>
                  {noti.detail && (
                    <Text
                      type={noti.read ? "secondary" : "success"}
                      style={{
                        fontSize: 14,
                        whiteSpace: "pre-line",
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      {noti.detail}
                    </Text>
                  )}
                  {noti.thumbnail && (
                    <img
                      src={noti.thumbnail}
                      alt=""
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: token.borderRadius,
                        border: `1px solid ${token.colorBorder}`,
                      }}
                    />
                  )}
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {noti.time}
                  </Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}