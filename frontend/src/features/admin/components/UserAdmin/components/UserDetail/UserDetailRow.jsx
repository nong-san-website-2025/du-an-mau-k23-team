// components/UserAdmin/UserDetailRow/UserDetailRow.jsx
import React, { useState, useEffect, useCallback } from "react";
import { 
  Drawer, Tabs, Button, Space, Skeleton, message, 
  Tooltip, Popconfirm, Avatar, Tag, Row, Col, Card, 
  Typography, Divider, Badge, Descriptions 
} from "antd";
import { 
  X, Edit, Lock, Unlock, Mail, Phone, MapPin, 
  ShoppingBag, Award, DollarSign, Star, User 
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL, getHeaders } from "../../api/config";
import { useUserData } from "../../hooks/useUserData";

// Import components con (giữ nguyên logic của bạn)
import UserEditForm from "../../UserEditForm";
import OrdersTab from "./tabs/OrdersTab";
import { intcomma } from "../../../../../../utils/format";
// import ActivityTab from "./tabs/ActivityTab"; 

const { Text, Title } = Typography;

// --- SUB-COMPONENT: STATS CARD ---
const StatCard = ({ title, value, icon, color, subValue }) => (
  <Card bodyStyle={{ padding: "12px 16px" }} bordered={false} style={{ background: "#f9f9f9", borderRadius: 8 }}>
    <Space align="start" size={12}>
      <div style={{ 
        background: color, color: "#fff", 
        padding: 10, borderRadius: 8, display: "flex" 
      }}>
        {icon}
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>{title}</Text>
        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>{value}</div>
        {subValue && <div style={{ fontSize: 11, color: "#8c8c8c" }}>{subValue}</div>}
      </div>
    </Space>
  </Card>
);

export default function UserDetailRow({ visible, onClose, user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Custom hook fetching data
  const { orders, loadingOrders, fetchOrdersData } = useUserData(user?.id, visible);

  // --- FETCHING LOGIC (Giữ nguyên logic robust của bạn) ---
  useEffect(() => {
    let mounted = true;
    const fetchUserDetail = async () => {
      if (!user?.id) return;
      setDetailLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/users/management/${user.id}/`, { headers: getHeaders() });
        if (mounted) setUserDetail(response.data);
      } catch (error) {
        // Fallback nhẹ nhàng hơn
        if (mounted) setUserDetail(user);
      } finally {
        if (mounted) setDetailLoading(false);
      }
    };

    if (visible && user?.id) {
      fetchUserDetail();
    } else if (!visible) {
      setUserDetail(null);
      setActiveTab("1"); // Reset tab về 1 khi đóng
    }
    return () => { mounted = false; };
  }, [visible, user]);

  const memoFetchOrders = useCallback(() => fetchOrdersData(), [fetchOrdersData]);

  // --- HANDLERS ---
  const handleToggleStatus = async () => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/users/toggle-active/${user.id}/`,
        {},
        { headers: getHeaders() }
      );
      setUserDetail(prev => ({ ...prev, is_active: response.data.is_active }));
      message.success(response.data.is_active ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
    } catch (error) {
      message.error("Lỗi thao tác trạng thái");
    }
  };

  const displayUser = userDetail || user || {};

  // --- RENDER CONTENT: TAB TỔNG QUAN (CUSTOMER 360) ---
  const renderOverviewTab = () => (
    <div style={{ padding: "0 8px" }}>
      {/* 1. KEY METRICS SECTION */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24} md={8}>
          <StatCard 
            title="Hạng thành viên"
            value={displayUser.tier_name || "Thành viên"}
            subValue={`${displayUser.points?.toLocaleString() || 0} điểm tích lũy`}
            icon={<Award size={20} />}
            color={displayUser.tier_color === 'gold' ? '#faad14' : displayUser.tier_color === 'cyan' ? '#13c2c2' : '#1890ff'}
          />
        </Col>
        <Col span={12} md={8}>
          <StatCard 
            title="Tổng chi tiêu (LTV)"
            value={intcomma(displayUser.total_spent)}
            icon={<DollarSign size={20} />}
            color="#52c41a"
          />
        </Col>
        <Col span={12} md={8}>
          <StatCard 
            title="Tổng đơn hàng"
            value={displayUser.orders_count || 0}
            subValue="Đơn thành công"
            icon={<ShoppingBag size={20} />}
            color="#722ed1"
          />
        </Col>
      </Row>

      <Row gutter={24}>
        {/* 2. LEFT COLUMN: CONTACT INFO */}
        <Col span={24} lg={12}>
          <Title level={5} style={{ marginBottom: 16 }}>Thông tin cá nhân</Title>
          <Descriptions column={1} bordered size="small" labelStyle={{ width: 130 }}>
            <Descriptions.Item label={<Space><User size={14}/> Username</Space>}>
              <Text copyable>{displayUser.username}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={<Space><Mail size={14}/> Email</Space>}>
              <a href={`mailto:${displayUser.email}`}>{displayUser.email}</a>
            </Descriptions.Item>
            <Descriptions.Item label={<Space><Phone size={14}/> Hotline</Space>}>
              {displayUser.phone ? <a href={`tel:${displayUser.phone}`}>{displayUser.phone}</a> : <Text type="secondary" italic>Chưa cập nhật</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tham gia">
              {displayUser.created_at ? new Date(displayUser.created_at).toLocaleDateString('vi-VN') : '—'}
            </Descriptions.Item>
          </Descriptions>
        </Col>

        {/* 3. RIGHT COLUMN: ADDRESS BOOK */}
        <Col span={24} lg={12}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
             <Title level={5} style={{ margin: 0 }}>Sổ địa chỉ</Title>
             <Badge count={displayUser.addresses?.length || 0} style={{ backgroundColor: '#108ee9' }} />
          </div>
          
          <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayUser.addresses && displayUser.addresses.length > 0 ? (
              displayUser.addresses.map((addr) => (
                <Card 
                  key={addr.id} 
                  size="small" 
                  bordered={!addr.is_default}
                  style={addr.is_default ? { border: '1px solid #1890ff', background: '#e6f7ff' } : {}}
                >
                  <Space align="start">
                    <MapPin size={16} style={{ marginTop: 4, color: addr.is_default ? '#1890ff' : '#8c8c8c' }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {addr.recipient_name} <Text type="secondary">| {addr.phone}</Text>
                        {addr.is_default && <Tag color="blue" style={{ marginLeft: 8 }}>Mặc định</Tag>}
                      </div>
                      <div style={{ fontSize: 13, color: '#595959', marginTop: 4 }}>
                        {addr.location}
                      </div>
                    </div>
                  </Space>
                </Card>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: 20, background: '#f5f5f5', borderRadius: 8, color: '#999' }}>
                Chưa có địa chỉ giao hàng
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );

  // --- DRAWER RENDER ---
  return (
    <>
      <Drawer
        // HEADER TÙY CHỈNH: Avatar to + Tên + Badge Status
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 0" }}>
            <Avatar 
              size={56} 
              src={displayUser.avatar} 
              icon={<User size={32}/>}
              style={{ backgroundColor: displayUser.is_active ? '#1890ff' : '#f5f5f5', filter: displayUser.is_active ? 'none' : 'grayscale(100%)' }} 
            />
            <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {displayUser.full_name || displayUser.username}
                  </Title>
                  {displayUser.role?.name === 'admin' && <Tag color="red">ADMIN</Tag>}
                  {displayUser.role?.name === 'seller' && <Tag color="purple">SELLER</Tag>}
               </div>
               <div style={{ marginTop: 4 }}>
                  <Badge 
                    status={displayUser.is_active ? "success" : "error"} 
                    text={<Text type="secondary">{displayUser.is_active ? "Đang hoạt động" : "Đang bị khóa"}</Text>} 
                  />
               </div>
            </div>
          </div>
        }
        placement="right"
        onClose={onClose}
        open={visible}
        width={Math.min(900, window.innerWidth)} // Rộng hơn chút để hiển thị dashboard đẹp
        closable={false}
        extra={
          <Space>
             {/* ACTIONS GROUP */}
             {displayUser.is_active ? (
                <Popconfirm
                  title="Khóa tài khoản?"
                  description="Người dùng này sẽ bị đăng xuất ngay lập tức."
                  onConfirm={handleToggleStatus}
                  okText="Khóa" cancelText="Hủy" okButtonProps={{ danger: true }}
                >
                  <Button danger type="dashed" icon={<Lock size={16} />}>Khóa</Button>
                </Popconfirm>
             ) : (
                <Button type="primary" ghost icon={<Unlock size={16} />} onClick={handleToggleStatus} style={{ borderColor: '#52c41a', color: '#52c41a' }}>
                   Mở khóa
                </Button>
             )}

             <Tooltip title="Chỉnh sửa thông tin">
                <Button type="default" icon={<Edit size={16} />} onClick={() => setIsEditing(true)}>Sửa</Button>
             </Tooltip>
             
             <Divider type="vertical" />
             
             <Button type="text" icon={<X size={20} />} onClick={onClose} style={{ color: '#8c8c8c' }}/>
          </Space>
        }
      >
        {/* NỘI DUNG CHÍNH */}
        {detailLoading ? (
          <div style={{ padding: 24 }}><Skeleton active avatar paragraph={{ rows: 4 }} /></div>
        ) : (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "1",
                label: "Hồ sơ khách hàng",
                icon: <User size={16} />,
                children: renderOverviewTab(),
              },
              {
                key: "2",
                label: `Lịch sử đơn hàng (${displayUser.orders_count || 0})`,
                icon: <ShoppingBag size={16} />,
                children: (
                  <div style={{ padding: "0 8px" }}>
                     <OrdersTab userId={user?.id} onLoad={memoFetchOrders} loading={loadingOrders} data={orders} />
                  </div>
                ),
              },
            ]}
            tabBarStyle={{ padding: "0 16px" }}
          />
        )}
      </Drawer>

      {/* DRAWER CHỈNH SỬA (Giữ nguyên logic edit của bạn) */}
      {isEditing && (
        <Drawer
          title={`Chỉnh sửa: ${displayUser.username}`}
          width={600}
          onClose={() => setIsEditing(false)}
          open={true}
          closable={false}
          extra={<Button type="text" icon={<X size={20}/>} onClick={() => setIsEditing(false)}/>}
        >
          <UserEditForm 
            editUser={displayUser} 
            onCancel={() => setIsEditing(false)} 
            onSave={(u) => { setIsEditing(false); setUserDetail(u); }} 
          />
        </Drawer>
      )}
    </>
  );
}