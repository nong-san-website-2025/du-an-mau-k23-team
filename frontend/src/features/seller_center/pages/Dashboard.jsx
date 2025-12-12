import { useEffect, useMemo, useRef, useState } from "react";
import {
  Row,
  Col,
  Card,
  List,
  Alert,
  Typography,
  Space,
  Avatar,
  Empty,
  Badge,
  Tag
} from "antd";
import {
  DollarOutlined,
  CalendarOutlined,
  RiseOutlined,
  ShoppingOutlined,
  SyncOutlined,
  TrophyOutlined,
  BellFilled,
  ShopOutlined
} from "@ant-design/icons";
import API from "../../login_register/services/api";
import StatsSection from "../../admin/components/common/StatsSection"; // Đảm bảo đường dẫn đúng
import "../styles/Dashboard.css";
import { intcomma } from '../../../utils/format';

const { Title, Text } = Typography;


const toRelativeTime = (dStr) => {
  try {
    const now = new Date();
    const d = new Date(dStr);
    const diff = (now - d) / 1000;
    if (diff < 60) return "vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  } catch {
    return "";
  }
};

// ... Các hàm xử lý ngày tháng giữ nguyên như cũ để tính toán logic ...
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
const addDays = (d, days) => { const nd = new Date(d); nd.setDate(nd.getDate() + days); return nd; };
const startOfWeek = (d) => { const day = d.getDay() === 0 ? 7 : d.getDay(); return addDays(startOfDay(d), -(day - 1)); };
const endOfWeek = (d) => addDays(startOfWeek(d), 6);
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
const inRange = (dateStr, from, to) => { const t = new Date(dateStr).getTime(); return t >= from && t <= to; };
const percentDelta = (current, prev) => {
  const c = Number(current || 0);
  const p = Number(prev || 0);
  if (p === 0) return c > 0 ? 100 : 0;
  return ((c - p) / p) * 100;
};

const aggregateFromOrders = (orders, { from, to, validProductIds }) => {
  let revenue = 0;
  const productMap = new Map();
  const filter = validProductIds && validProductIds.size >= 0;

  for (const o of orders || []) {
    if (!o?.created_at || !inRange(o.created_at, from, to)) continue;

    const items = o.items || [];
    // Tính revenue
    if (filter) {
        for (const it of items) {
            if (!validProductIds.has(it.product)) continue;
            revenue += Number(it.quantity || 0) * Number(it.price || 0);
        }
    } else {
        revenue += Number(o.total_price || 0);
    }
    
    // Tính sản phẩm bán chạy (chỉ tính item hợp lệ nếu có filter)
    for (const it of items) {
        if (filter && !validProductIds.has(it.product)) continue;
        const name = it.product_name;
        const qty = Number(it.quantity || 0);
        const price = Number(it.price || 0);
        const prev = productMap.get(name) || { sold: 0, revenue: 0 };
        productMap.set(name, { sold: prev.sold + qty, revenue: prev.revenue + qty * price });
    }
  }

  const products = [...productMap.entries()]
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => b.sold - a.sold);

  return { revenue, products };
};

/* ========= MAIN COMPONENT ========= */
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [processingOrders, setProcessingOrders] = useState([]);

  // Stats State
  const [stats, setStats] = useState({
    today: 0, yesterday: 0,
    week: 0, prevWeek: 0,
    month: 0, prevMonth: 0
  });

  const [topProducts, setTopProducts] = useState([]);
  const [reviewActivities, setReviewActivities] = useState([]);
  const intervalRef = useRef(null);
  const isNarrowPhone = typeof window !== 'undefined' && window.matchMedia('(max-width: 450px)').matches;

  /* ===== DATA LOADING ===== */
  const loadData = async (opts = {}) => {
    try {
      if (!opts.silent) setLoading(true);
      const [pend, proc, success, sellerProds] = await Promise.all([
        API.get("orders/seller/pending/"),
        API.get("orders/seller/processing/"),
        API.get("orders/seller/complete/"),
        API.get("sellers/productseller/"),
      ]);

      const pendingList = pend.data || [];
      const processingList = proc.data || [];
      const successList = success.data || [];
      const sellerProdList = sellerProds.data || [];
      
      setPendingOrders(pendingList);
      setProcessingOrders(processingList);

      const ids = new Set(sellerProdList.map((p) => p.id));
      computeStats(successList, ids);
    } catch (err) {
      if (err?.response?.status === 403) {
        setAccessDenied(true);
        clearInterval(intervalRef.current);
      }
    } finally {
      if (!opts.silent) setLoading(false);
    }
  };

  const loadReviewActivities = async () => {
    try {
      const res = await API.get("reviews/seller/reviews/recent-activities/?limit=5");
      setReviewActivities((res.data.results || []).map((a) => ({
        message: a.message,
        created_at: a.created_at,
        type: 'review'
      })));
    } catch {}
  };

  const computeStats = (orders, validIds) => {
    const now = new Date();
    
    // Helpers wrapper
    const getRev = (from, to) => aggregateFromOrders(orders, { from, to, validProductIds: validIds }).revenue;

    const todayRev = getRev(startOfDay(now), endOfDay(now));
    const yestRev = getRev(startOfDay(addDays(now, -1)), endOfDay(addDays(now, -1)));
    
    const weekRev = getRev(startOfWeek(now), endOfWeek(now));
    const prevWeekRev = getRev(addDays(startOfWeek(now), -7), addDays(endOfWeek(now), -7));

    const monthRev = getRev(startOfMonth(now), endOfMonth(now));
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const prevMonthRev = getRev(startOfMonth(prevMonthDate), endOfMonth(prevMonthDate));

    setStats({
        today: todayRev, yesterday: yestRev,
        week: weekRev, prevWeek: prevWeekRev,
        month: monthRev, prevMonth: prevMonthRev
    });

    const last30 = aggregateFromOrders(orders, {
      from: addDays(now, -30),
      to: now,
      validProductIds: validIds,
    });
    setTopProducts(last30.products.slice(0, 5)); // Lấy top 5 cho đẹp
  };

  useEffect(() => {
    loadData();
    loadReviewActivities();
    intervalRef.current = setInterval(() => {
      loadData({ silent: true });
      loadReviewActivities();
    }, 15000); // Tăng lên 15s để giảm tải server
    return () => clearInterval(intervalRef.current);
  }, []);

  /* ===== PREPARE DATA FOR UI ===== */
  
  // 1. Prepare Stats Items for StatsSection
  const statsItems = useMemo(() => {
    const todayDelta = percentDelta(stats.today, stats.yesterday);
    const weekDelta = percentDelta(stats.week, stats.prevWeek);
    const monthDelta = percentDelta(stats.month, stats.prevMonth);

    return [
        {
            title: "Hôm nay",
            value: intcomma(stats.today),
            trend: Number(todayDelta.toFixed(1)),
            icon: <DollarOutlined />,
            color: "#1890ff", // Blue
        },
        {
            title: "Tuần này",
            value: intcomma(stats.week),
            trend: Number(weekDelta.toFixed(1)),
            icon: <CalendarOutlined />,
            color: "#722ed1", // Purple
        },
        {
            title: "Tháng này",
            value: intcomma(stats.month),
            trend: Number(monthDelta.toFixed(1)),
            icon: <RiseOutlined />,
            color: "#52c41a", // Green
        }
    ];
  }, [stats]);

  // 2. Prepare Notifications
  const notifications = useMemo(() => {
    const notif = [];
    pendingOrders.slice(0, 3).forEach((o) =>
      notif.push({
        id: `ord-${o.id}`,
        message: `Đơn hàng mới #${o.id}`,
        sub: `Tổng tiền: ${intcomma(o.total_price)}`,
        time: toRelativeTime(o.created_at),
        created_at: o.created_at,
        type: 'order',
        icon: <ShoppingOutlined style={{ color: '#1890ff' }} />
      })
    );
    reviewActivities.forEach((r, idx) =>
      notif.push({
        id: `rev-${idx}`,
        message: "Đánh giá mới",
        sub: r.message,
        time: toRelativeTime(r.created_at),
        created_at: r.created_at,
        type: 'review',
        icon: <TrophyOutlined style={{ color: '#faad14' }} />
      })
    );
    return notif.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
  }, [pendingOrders, reviewActivities]);


  /* ========= RENDER ========= */
  return (
    <div className="dashboard-container" style={{ padding: "24px", minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      {accessDenied && (
        <Alert
          type="error"
          message="Truy cập bị từ chối"
          description="Bạn không có quyền truy cập dashboard của người bán."
          className="mb-4"
          showIcon
        />
      )}

      {/* HEADER */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space align="center">
            <Avatar size={48} icon={<ShopOutlined />} style={{ backgroundColor: '#fff', color: '#1890ff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            <div>
                <Title level={3} style={{ margin: 0 }}>TỔNG QUAN CỬA HÀNG</Title>
                <Text type="secondary">Chào mừng trở lại, chúc bạn một ngày buôn bán đắt khách!</Text>
            </div>
        </Space>
        {/* Có thể thêm nút Quick Actions ở đây nếu cần */}
      </div>

      {/* STATS SECTION */}
      <StatsSection items={statsItems} loading={loading} />

      <Row gutter={[24, 24]} className="mt-4">
        {/* LEFT COLUMN: ORDERS & PRODUCTS */}
        <Col xs={24} lg={16}>
            <Row gutter={[24, 24]}>
                {/* 1. ORDER STATUS WIDGETS */}
                <Col span={12}>
                   <Card bordered={false} hoverable className="dashboard-card action-card">
                       <Space align="start">
                           <Avatar shape="square" size={48} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} icon={<ShoppingOutlined />} />
                           <div>
                         {!isNarrowPhone && <Text type="secondary">Đơn mới chờ duyệt</Text>}
                               <Title level={2} style={{ margin: '4px 0' }}>{pendingOrders.length}</Title>
                               {pendingOrders.length > 0 && <Tag color="blue">Cần xử lý ngay</Tag>}
                           </div>
                       </Space>
                   </Card>
                </Col>
                <Col span={12}>
                    <Card bordered={false} hoverable className="dashboard-card action-card">
                       <Space align="start">
                           <Avatar shape="square" size={48} style={{ backgroundColor: '#fff7e6', color: '#fa8c16' }} icon={<SyncOutlined />} />
                           <div>
                         {!isNarrowPhone && <Text type="secondary">Đang xử lý/Giao</Text>}
                               <Title level={2} style={{ margin: '4px 0' }}>{processingOrders.length}</Title>
                         {!isNarrowPhone && <Text type="secondary" style={{ fontSize: 12 }}>Đơn hàng đang vận hành</Text>}
                           </div>
                       </Space>
                   </Card>
                </Col>

                {/* 2. TOP SELLING PRODUCTS */}
                <Col span={24}>
                    <Card 
                        title={<Space><TrophyOutlined style={{ color: '#faad14'}} /><span>Top sản phẩm (30 ngày)</span></Space>}
                        bordered={false}
                        className="dashboard-card"
                    >
                        {topProducts.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu bán hàng" /> : (
                            <List
                                itemLayout="horizontal"
                                dataSource={topProducts}
                                renderItem={(item, index) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={
                                                <Badge count={`#${index + 1}`} style={{ backgroundColor: index < 3 ? '#faad14' : '#d9d9d9' }}>
                                                    <Avatar shape="square" size="large" src={item.image || null} icon={<ShopOutlined />} />
                                                </Badge>
                                            }
                                            title={<Text strong>{item.name}</Text>}
                                            description={<Text type="secondary">Đã bán: {item.sold}</Text>}
                                        />
                                        <div>
                                            <Title level={5} style={{ margin: 0, color: '#52c41a' }}>
                                                {intcomma(item.revenue)}
                                            </Title>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </Col>
            </Row>
        </Col>

        {/* RIGHT COLUMN: NOTIFICATIONS */}
        <Col xs={24} lg={8}>
            <Card 
                title={<Space><BellFilled style={{ color: '#ff4d4f' }} /><span>Hoạt động gần đây</span></Space>}
                bordered={false}
                className="dashboard-card h-100"
                bodyStyle={{ padding: '0 24px 24px' }}
            >
                <List
                    itemLayout="horizontal"
                    dataSource={notifications}
                    split={false}
                    renderItem={(item) => (
                        <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                            <List.Item.Meta
                                avatar={<Avatar style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0' }} icon={item.icon} />}
                                title={<Space><Text strong>{item.message}</Text> <Text type="secondary" style={{ fontSize: 11 }}>{item.time}</Text></Space>}
                                description={
                                    <div style={{ marginTop: 4 }}>
                                        <Text type="secondary" style={{ fontSize: 13 }} ellipsis={{ tooltip: item.sub }}>{item.sub}</Text>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
                {notifications.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có thông báo mới" />}
            </Card>
        </Col>
      </Row>
    </div>
  );
}