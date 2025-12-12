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
    <div className="container px-2 px-md-4 py-3">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between" style={{ marginBottom: 12 }}>
        <div className="d-flex align-items-center mb-3 mb-md-0">
          <h2 className="mb-0 me-2 fs-4 fs-md-3">Thông báo</h2>
          <Badge count={unreadCount} overflowCount={99} />
        </div>
        <div className="d-flex flex-column flex-md-row gap-2">
          <Button onClick={markAllRead} disabled={!items.length} block className="d-md-inline">
            Đánh dấu tất cả đã đọc
          </Button>
          <Button danger onClick={clearAll} disabled={!items.length} block className="d-md-inline">
            Xoá tất cả
          </Button>
        </div>
      </div>

      {!items.length ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
          <Empty description="Chưa có thông báo" />
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={items}
          renderItem={(item) => (
            <List.Item
              className="px-2 px-md-3"
              actions={[
                !item.read ? (
                  <Button
                    key="read"
                    type="link"
                    onClick={() => markRead(item.id)}
                    className="p-0 d-inline d-md-inline"
                  >
                    <span className="d-inline d-md-none">Đọc</span>
                    <span className="d-none d-md-inline">Đánh dấu đã đọc</span>
                  </Button>
                ) : (
                  <Text key="readed" type="secondary" className="d-inline d-md-inline">
                    <span className="d-inline d-md-none">✓</span>
                    <span className="d-none d-md-inline">Đã đọc</span>
                  </Text>
                ),
              ]}
            >
              <List.Item.Meta
                title={
                  <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2">
                    <div className="d-flex align-items-center gap-2">
                      {typeToTag(item.type)}
                      <Text strong className="mb-0">{item.title}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }} className="ms-md-auto">
                      {new Date(item.created_at).toLocaleString("vi-VN")}
                    </Text>
                  </div>
                }
                description={<Text className="mt-1">{item.message}</Text>}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}