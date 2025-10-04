import React, { useEffect, useMemo, useState } from "react";
import { List, Badge, Button, Space, Tag, Typography, Empty, message } from "antd";

const { Text } = Typography;

// Local notifications helpers (shared contract with SellerComplaintsPage)
const STORAGE_KEY = "notifications"; // array of {id, type, title, message, created_at, read}
const EVENT_NAME = "notifications_updated";

function getNotifications() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function setNotifications(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT_NAME));
}

export default function NotificationsPage() {
  const [items, setItems] = useState([]);

  // Load on mount + subscribe to external updates
  useEffect(() => {
    const load = () => setItems(getNotifications());
    load();
    const onUpdate = () => load();
    window.addEventListener(EVENT_NAME, onUpdate);
    return () => window.removeEventListener(EVENT_NAME, onUpdate);
  }, []);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const markRead = (id) => {
    const next = items.map((n) => (n.id === id ? { ...n, read: true } : n));
    setItems(next);
    setNotifications(next);
  };
  const markAllRead = () => {
    if (!items.length) return;
    const next = items.map((n) => ({ ...n, read: true }));
    setItems(next);
    setNotifications(next);
  };
  const clearAll = () => {
    setItems([]);
    setNotifications([]);
    message.success("Đã xoá tất cả thông báo");
  };

  const typeToTag = (type) => {
    switch (type) {
      case "complaint":
        return <Tag color="blue">Khiếu nại</Tag>;
      default:
        return <Tag>Khác</Tag>;
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <Space>
          <h2 style={{ margin: 0 }}>Quản lý Thông báo & Hệ thống</h2>
          <Badge count={unreadCount} overflowCount={99} />
        </Space>
        <Space>
          <Button onClick={markAllRead} disabled={!items.length}>
            Đánh dấu tất cả đã đọc
          </Button>
          <Button danger onClick={clearAll} disabled={!items.length}>
            Xoá tất cả
          </Button>
        </Space>
      </div>

      {!items.length ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Empty description="Chưa có thông báo" />
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={items}
          renderItem={(item) => (
            <List.Item
              actions={[
                !item.read ? (
                  <Button key="read" type="link" onClick={() => markRead(item.id)}>
                    Đánh dấu đã đọc
                  </Button>
                ) : (
                  <Text key="readed" type="secondary">Đã đọc</Text>
                ),
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    {typeToTag(item.type)}
                    <Text strong>{item.title}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(item.created_at).toLocaleString("vi-VN")}
                    </Text>
                  </Space>
                }
                description={<Text>{item.message}</Text>}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}