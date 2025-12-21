import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  List, Avatar, Tag, Button, Tabs, Card, 
  Empty, Spin, Modal, message, Badge, Tooltip 
} from "antd";
import { 
  BellOutlined, 
  ShoppingCartOutlined, 
  MessageOutlined, 
  SyncOutlined, 
  CheckCircleOutlined,
  ReloadOutlined
} from "@ant-design/icons";
// IMPORT TỪ USER SERVICE (Theo cấu trúc bạn đã gửi)
import { fetchUnifiedNotifications, markAllAsRead } from "../../users/services/notificationService";

const NotificationsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [selectedNoti, setSelectedNoti] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Tải dữ liệu thông báo
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUnifiedNotifications();
      setItems(data);
    } catch (error) {
      message.error("Không thể tải thông báo người bán");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // WebSocket lắng nghe thông báo mới dành cho Seller
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/notifications/`);
    socket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      if (response.event === "new_notification") {
        loadData(); // Tự động cập nhật danh sách
      }
    };
    return () => socket.close();
  }, [loadData]);

  // 2. Định dạng giao diện theo loại thông báo của Seller
  const getNotiConfig = (type) => {
    switch (type) {
      case "Đơn hàng mới":
        return { icon: <ShoppingCartOutlined />, color: "#1890ff", label: "Đơn hàng" };
      case "Cập nhật đơn hàng":
        return { icon: <SyncOutlined />, color: "#52c41a", label: "Cập nhật" };
      case "Tin nhắn":
        return { icon: <MessageOutlined />, color: "#722ed1", label: "Chat" };
      default: // Hệ thống / Khiếu nại
        return { icon: <BellOutlined />, color: "#faad14", label: "Hệ thống" };
    }
  };

  // 3. Lọc theo Tab
  const filteredItems = useMemo(() => {
    if (activeTab === "Tất cả") return items;
    return items.filter(item => item.type === activeTab);
  }, [items, activeTab]);

  // 4. Đọc chi tiết và Đánh dấu tất cả
  const handleOpenDetail = (noti) => {
    setSelectedNoti(noti);
    setIsModalOpen(true);
    // Cập nhật trạng thái đọc trong state nội bộ để UI phản hồi ngay
    setItems(prev => prev.map(item => 
      item.id === noti.id ? { ...item, read: true } : item
    ));
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setItems(prev => prev.map(item => ({ ...item, read: true })));
      message.success("Đã đánh dấu tất cả thông báo là đã đọc");
    } catch (e) {
      message.error("Thao tác thất bại");
    }
  };

  return (
    <div className="seller-notification-container p-6">
      <Card 
        bordered={false}
        className="shadow-sm"
        title={
          <div className="flex items-center gap-2">
            <BellOutlined className="text-blue-600" />
            <span className="text-lg font-bold">Trung tâm thông báo Người bán</span>
          </div>
        }
        extra={
          <div className="flex gap-2">
            <Tooltip title="Tải lại">
              <Button icon={<ReloadOutlined />} onClick={loadData} />
            </Tooltip>
            <Button 
              type="primary" 
              ghost
              icon={<CheckCircleOutlined />} 
              onClick={handleMarkAllRead}
            >
              Đọc tất cả
            </Button>
          </div>
        }
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="mb-4"
          items={[
            { key: "Tất cả", label: `Tất cả (${items.length})` },
            { key: "Đơn hàng mới", label: "Đơn hàng" },
            { key: "Tin nhắn", label: "Tin nhắn khách" },
            { key: "Hệ thống", label: "Hệ thống" },
          ]}
        />

        <Spin spinning={loading}>
          <List
            itemLayout="horizontal"
            dataSource={filteredItems}
            locale={{ emptyText: <Empty description="Bạn chưa có thông báo nào" /> }}
            renderItem={(item) => {
              const config = getNotiConfig(item.type);
              return (
                <List.Item
                  className={`px-4 rounded-lg mb-2 transition-all hover:bg-gray-50 cursor-pointer ${!item.read ? 'bg-blue-50/40 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                  onClick={() => handleOpenDetail(item)}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge dot={!item.read} color="red" offset={[-2, 32]}>
                        <Avatar 
                          size="large"
                          style={{ backgroundColor: config.color }} 
                          icon={config.icon} 
                        />
                      </Badge>
                    }
                    title={
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`text-base ${!item.read ? 'font-bold text-blue-900' : 'font-medium text-gray-700'}`}>
                            {item.title}
                          </span>
                          <Tag color={config.color}>{config.label}</Tag>
                        </div>
                        <span className="text-gray-400 text-xs font-normal">{item.time}</span>
                      </div>
                    }
                    description={
                      <div className={`mt-1 line-clamp-1 ${!item.read ? 'text-gray-800' : 'text-gray-500'}`}>
                        {item.message}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Spin>
      </Card>

      {/* Modal Xem chi tiết */}
      <Modal
        title={<div className="pr-8">{selectedNoti?.title}</div>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>Đóng</Button>,
          <Button key="action" type="primary" onClick={() => setIsModalOpen(false)}>Xác nhận</Button>
        ]}
      >
        <div className="py-2">
          <div className="flex items-center gap-2 mb-4">
             <Tag color={getNotiConfig(selectedNoti?.type).color}>{selectedNoti?.type}</Tag>
             <span className="text-gray-400 text-sm">{selectedNoti?.time}</span>
          </div>
          <p className="text-base text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
            {selectedNoti?.message}
          </p>
          {selectedNoti?.detail && (
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-100 text-blue-800 text-sm">
              <strong>Chi tiết:</strong> {selectedNoti.detail}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default NotificationsPage;