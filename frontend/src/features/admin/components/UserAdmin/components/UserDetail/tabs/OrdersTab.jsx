import React, { useEffect, useState, useMemo } from "react";
import { 
  Table, Tag, Empty, Skeleton, Card, Statistic, Row, Col, 
  Space, Button, Tooltip, Tabs, Typography, Badge 
} from "antd";
import { 
  ShoppingCart, TrendingUp, DollarSign, Package, 
  Eye, Filter, Clock, CheckCircle, XCircle, Truck 
} from "lucide-react";
import dayjs from "dayjs";
import { intcomma } from "../../../../../../../utils/format";

const { Text } = Typography;

// Cấu hình hiển thị trạng thái (Màu sắc & Label & Icon)
const getStatusConfig = (status) => {
  const s = (status || "").toLowerCase();
  const map = {
    pending: { color: "orange", label: "Chờ xác nhận", icon: <Clock size={14}/> },
    confirmed: { color: "blue", label: "Đã xác nhận", icon: <CheckCircle size={14}/> },
    preparing: { color: "geekblue", label: "Đang chuẩn bị", icon: <Package size={14}/> },
    shipping: { color: "cyan", label: "Đang giao", icon: <Truck size={14}/> },
    delivered: { color: "green", label: "Đã giao", icon: <CheckCircle size={14}/> },
    completed: { color: "green", label: "Thành công", icon: <CheckCircle size={14}/> },
    cancelled: { color: "red", label: "Đã hủy", icon: <XCircle size={14}/> },
    failed: { color: "red", label: "Thất bại", icon: <XCircle size={14}/> },
    ready_for_pickup: { color: "purple", label: "Chờ lấy hàng", icon: <Package size={14}/> },
  };
  return map[s] || { color: "default", label: status, icon: null };
};

export default function OrdersTab({ userId, onLoad, loading, data = [] }) {
  const [activeStatus, setActiveStatus] = useState("all");

  useEffect(() => {
    if (onLoad && userId) onLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // --- LOGIC LỌC DỮ LIỆU ---
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (activeStatus === "all") return data;
    
    // Nhóm các trạng thái vào các Tab logic
    if (activeStatus === "processing") {
      return data.filter(o => ["pending", "confirmed", "preparing", "ready_for_pickup"].includes(o.status?.toLowerCase()));
    }
    if (activeStatus === "shipping") {
      return data.filter(o => ["shipping"].includes(o.status?.toLowerCase()));
    }
    if (activeStatus === "completed") {
      return data.filter(o => ["success", "delivered"].includes(o.status?.toLowerCase()));
    }
    if (activeStatus === "cancelled") {
      return data.filter(o => ["cancelled", "failed"].includes(o.status?.toLowerCase()));
    }
    return data;
  }, [data, activeStatus]);

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    const totalOrders = data?.length || 0;
    const totalSpent = data?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0;
    const successOrders = data?.filter(o => ["success", "delivered"].includes(o.status?.toLowerCase())).length || 0;
    const successRate = totalOrders > 0 ? ((successOrders / totalOrders) * 100).toFixed(0) : 0;
    
    return { totalOrders, totalSpent, successOrders, successRate };
  }, [data]);

  // --- LOADING STATE ---
  if (loading) return <div style={{ padding: 24 }}><Skeleton active paragraph={{ rows: 6 }} /></div>;

  // --- COLUMNS ---
  const columns = [
    {
      title: "Mã đơn hàng",
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (text) => (
        <Space direction="vertical" size={0}>
          <Text strong copyable style={{ color: "#1890ff", fontFamily: "monospace" }}>#{text}</Text>
          {/* Ví dụ: Nếu có phương thức thanh toán thì hiện ở đây */}
          <Text type="secondary" style={{ fontSize: 11 }}>COD</Text>
        </Space>
      ),
    },
    {
      title: "Ngày đặt",
      dataIndex: "created_at",
      key: "created_at",
      width: 140,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => (
        <div>
          <div>{dayjs(date).format("DD/MM/YYYY")}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(date).format("HH:mm")}</Text>
        </div>
      ),
    },
    {
      title: "Giá trị đơn",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 140,
      align: "right",
      sorter: (a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount),
      render: (amount) => (
        <Text strong style={{ color: "#389e0d" }}>
          {intcomma(amount)}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (status) => {
        const conf = getStatusConfig(status);
        return (
          <Tag color={conf.color} style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 4 }}>
            {conf.icon} {conf.label}
          </Tag>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 60,
      fixed: "right",
      render: (_, record) => (
        <Tooltip title="Xem chi tiết đơn hàng">
          <Button 
            type="text" 
            icon={<Eye size={18} style={{ color: "#595959" }}/>} 
            onClick={() => {
              // TODO: Gọi hàm mở Modal chi tiết đơn hàng hoặc navigate
              console.log("View order detail:", record.id); 
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: "0 8px" }}>
      {/* 1. SECTION THỐNG KÊ (STATS) */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card size="small" bordered={false} style={{ background: "#e6f7ff", borderRadius: 8 }}>
            <Statistic 
              title={<span style={{ fontSize: 13, color: "#0050b3" }}>Tổng chi tiêu</span>}
              value={stats.totalSpent}
              formatter={(val) => intcomma(val)}
              valueStyle={{ fontWeight: 700, color: "#0050b3", fontSize: 20 }}
              prefix={<DollarSign size={18} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" bordered={false} style={{ background: "#f6ffed", borderRadius: 8 }}>
            <Statistic 
              title={<span style={{ fontSize: 13, color: "#389e0d" }}>Đơn thành công</span>}
              value={stats.successOrders}
              suffix={`/ ${stats.totalOrders}`}
              valueStyle={{ fontWeight: 700, color: "#389e0d", fontSize: 20 }}
              prefix={<CheckCircle size={18} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" bordered={false} style={{ background: "#fff7e6", borderRadius: 8 }}>
            <Statistic 
              title={<span style={{ fontSize: 13, color: "#d46b08" }}>Tỉ lệ nhận hàng</span>}
              value={stats.successRate}
              suffix="%"
              valueStyle={{ fontWeight: 700, color: "#d46b08", fontSize: 20 }}
              prefix={<TrendingUp size={18} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 2. SECTION BỘ LỌC & BẢNG */}
      <Card 
        bordered={false} 
        bodyStyle={{ padding: "0" }}
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
      >
        <Tabs 
          activeKey={activeStatus} 
          onChange={setActiveStatus}
          type="card"
          tabBarStyle={{ marginBottom: 0, background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}
          items={[
            { key: "all", label: "Tất cả", icon: <Filter size={14}/> },
            { key: "processing", label: "Đang xử lý", icon: <Clock size={14}/> },
            { key: "delivered", label: "Đang giao", icon: <Truck size={14}/> },
            { key: "completed", label: "Hoàn thành", icon: <CheckCircle size={14}/> },
            { key: "cancelled", label: "Đã hủy", icon: <XCircle size={14}/> },
          ]}
        />
        
        {filteredData.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredData.map((item, idx) => ({ ...item, key: item.id || idx }))}
            pagination={{ pageSize: 5, showSizeChanger: true }}
            scroll={{ x: 700 }}
            size="middle"
            bordered={false} // Bỏ border dọc cho thoáng
            rowClassName="editable-row"
          />
        ) : (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description="Không tìm thấy đơn hàng nào theo bộ lọc này" 
            style={{ padding: 40 }}
          />
        )}
      </Card>
    </div>
  );
}