import { useEffect, useMemo, useRef, useState } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Badge,
  List,
  Alert,
  Spin,
  Typography,
  Tag,
  Space,
} from "antd";
import {
  RiseOutlined,
  ShoppingCartOutlined,
  BellOutlined,
  DollarOutlined,
  CalendarOutlined,
  StarOutlined,
} from "@ant-design/icons";
import API from "../../login_register/services/api";

import "../styles/Dashboard.css";

const { Title, Text } = Typography;

/* ========= HELPERS ========= */
const formatCurrency = (amount) => {
  const n = Number(amount || 0);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
};

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

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

const addDays = (d, days) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
};

const startOfWeek = (d) => {
  const day = d.getDay() === 0 ? 7 : d.getDay();
  return addDays(startOfDay(d), -(day - 1));
};

const endOfWeek = (d) => addDays(startOfWeek(d), 6);
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

const inRange = (dateStr, from, to) => {
  const t = new Date(dateStr).getTime();
  return t >= from && t <= to;
};

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

    if (filter) {
      for (const it of o.items || []) {
        if (!validProductIds.has(it.product)) continue;
        const name = it.product_name;
        const qty = Number(it.quantity || 0);
        const price = Number(it.price || 0);

        revenue += qty * price;

        const prev = productMap.get(name) || { sold: 0, revenue: 0 };
        productMap.set(name, {
          sold: prev.sold + qty,
          revenue: prev.revenue + qty * price,
        });
      }
    } else {
      const total = Number(o.total_price || 0);
      revenue += total;

      for (const it of o.items || []) {
        const name = it.product_name;
        const qty = Number(it.quantity || 0);
        const price = Number(it.price || 0);

        const prev = productMap.get(name) || { sold: 0, revenue: 0 };
        productMap.set(name, {
          sold: prev.sold + qty,
          revenue: prev.revenue + qty * price,
        });
      }
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

  const [todayRevenue, setTodayRevenue] = useState(0);
  const [yesterdayRevenue, setYesterdayRevenue] = useState(0);
  const [weekRevenue, setWeekRevenue] = useState(0);
  const [prevWeekRevenue, setPrevWeekRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [prevMonthRevenue, setPrevMonthRevenue] = useState(0);

  const [orderNewCount, setOrderNewCount] = useState(0);
  const [orderProcessingCount, setOrderProcessingCount] = useState(0);

  const [topProducts, setTopProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [reviewActivities, setReviewActivities] = useState([]);
  const [sellerProductIds, setSellerProductIds] = useState(new Set());

  const intervalRef = useRef(null);

  /* ===== LOADERS (giữ nguyên logic cũ) ===== */
  const loadData = async (opts = {}) => {
    try {
      if (!opts.silent) setLoading(true);

      const [pend, proc, success, sellerProds] = await Promise.all([
        API.get("orders/seller/pending/"),
        API.get("orders/seller/processing/"),
        API.get("orders/seller/complete/"),
        API.get("sellers/productseller/"),
      ]);

      setPendingOrders(pend.data || []);
      setProcessingOrders(proc.data || []);
      setOrderNewCount((pend.data || []).length);
      setOrderProcessingCount((proc.data || []).length);

      const ids = new Set((sellerProds.data || []).map((p) => p.id));
      setSellerProductIds(ids);

      computeStats(success.data || [], ids);
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
      const res = await API.get(
        "reviews/seller/reviews/recent-activities/?limit=5"
      );
      setReviewActivities(
        (res.data.results || []).map((a) => ({
          message: a.message,
          created_at: a.created_at,
        }))
      );
    } catch {}
  };

  const computeStats = (orders, validIds) => {
    const now = new Date();

    const today = aggregateFromOrders(orders, {
      from: startOfDay(now),
      to: endOfDay(now),
      validProductIds: validIds,
    });

    const yesterday = aggregateFromOrders(orders, {
      from: startOfDay(addDays(now, -1)),
      to: endOfDay(addDays(now, -1)),
      validProductIds: validIds,
    });

    setTodayRevenue(today.revenue);
    setYesterdayRevenue(yesterday.revenue);

    const week = aggregateFromOrders(orders, {
      from: startOfWeek(now),
      to: endOfWeek(now),
      validProductIds: validIds,
    });

    const prevWeek = aggregateFromOrders(orders, {
      from: addDays(startOfWeek(now), -7),
      to: addDays(endOfWeek(now), -7),
      validProductIds: validIds,
    });

    setWeekRevenue(week.revenue);
    setPrevWeekRevenue(prevWeek.revenue);

    const month = aggregateFromOrders(orders, {
      from: startOfMonth(now),
      to: endOfMonth(now),
      validProductIds: validIds,
    });

    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const pm = aggregateFromOrders(orders, {
      from: startOfMonth(prevMonthDate),
      to: endOfMonth(prevMonthDate),
      validProductIds: validIds,
    });

    setMonthRevenue(month.revenue);
    setPrevMonthRevenue(pm.revenue);

    const last30 = aggregateFromOrders(orders, {
      from: addDays(now, -30),
      to: now,
      validProductIds: validIds,
    });

    setTopProducts(last30.products.slice(0, 4));
  };

  /* ===== EFFECT ===== */
  useEffect(() => {
    loadData();
    loadReviewActivities();

    intervalRef.current = setInterval(() => {
      loadData({ silent: true });
      loadReviewActivities();
    }, 10000);

    return () => clearInterval(intervalRef.current);
  }, []);

  /* ===== DELTAS ===== */
  const todayDelta = percentDelta(todayRevenue, yesterdayRevenue);
  const weekDelta = percentDelta(weekRevenue, prevWeekRevenue);
  const monthDelta = percentDelta(monthRevenue, prevMonthRevenue);

  /* ===== MERGED NOTIFICATIONS ===== */
  useEffect(() => {
    const notif = [];

    pendingOrders.slice(0, 3).forEach((o) =>
      notif.push({
        message: `Đơn hàng mới #${o.id}`,
        time: toRelativeTime(o.created_at),
        created_at: o.created_at,
      })
    );

    reviewActivities.forEach((r) =>
      notif.push({
        message: r.message,
        time: toRelativeTime(r.created_at),
        created_at: r.created_at,
      })
    );

    setNotifications(
      notif.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
    );
  }, [pendingOrders, reviewActivities]);

  /* ========= RENDER ========= */
  return (
    <div style={{ padding: "24px" }}>
      {accessDenied && (
        <Alert
          type="warning"
          message="Bạn không có quyền truy cập trang người bán."
          className="mb-4"
        />
      )}

      <Space align="center" className="mb-4">
        <RiseOutlined style={{ fontSize: 32, color: "#1890ff" }} />
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Tổng quan cửa hàng
          </Title>
          <Text type="secondary">Theo dõi hiệu suất kinh doanh theo thời gian thực</Text>
        </div>
      </Space>

      {/* SALES OVERVIEW */}
      <Row gutter={[16, 16]}>
        {/* TODAY */}
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Doanh số hôm nay"
              value={todayRevenue}
              formatter={formatCurrency}
              prefix={<DollarOutlined />}
            />

            <Tag color={todayDelta >= 0 ? "green" : "red"} className="mt-2">
              {todayDelta >= 0 ? "+" : ""}
              {todayDelta.toFixed(1)}%
            </Tag>
            <Text type="secondary" className="ms-2">
              so với hôm qua
            </Text>
          </Card>
        </Col>

        {/* WEEK */}
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Doanh số tuần"
              value={weekRevenue}
              formatter={formatCurrency}
              prefix={<CalendarOutlined />}
            />
            <Tag color={weekDelta >= 0 ? "green" : "red"} className="mt-2">
              {weekDelta >= 0 ? "+" : ""}
              {weekDelta.toFixed(1)}%
            </Tag>
            <Text type="secondary" className="ms-2">
              so với tuần trước
            </Text>
          </Card>
        </Col>

        {/* MONTH */}
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Doanh số tháng"
              value={monthRevenue}
              formatter={formatCurrency}
              prefix={<RiseOutlined />}
            />

            <Tag color={monthDelta >= 0 ? "green" : "red"} className="mt-2">
              {monthDelta >= 0 ? "+" : ""}
              {monthDelta.toFixed(1)}%
            </Tag>
            <Text type="secondary" className="ms-2">
              so với tháng trước
            </Text>
          </Card>
        </Col>
      </Row>

      {/* ORDERS + TOP PRODUCTS */}
      <Row gutter={[16, 16]} className="mt-4">
        {/* ORDERS */}
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <ShoppingCartOutlined />
                <span>Đơn hàng</span>
              </Space>
            }
          >
            {loading ? (
              <Spin />
            ) : (
              <Row gutter={16}>
                <Col span={12}>
                  <Card bordered style={{ textAlign: "center" }}>
                    <Title level={3}>{orderNewCount}</Title>
                    <Text>Đơn hàng mới</Text>
                  </Card>
                </Col>

                <Col span={12}>
                  <Card bordered style={{ textAlign: "center" }}>
                    <Title level={3}>{orderProcessingCount}</Title>
                    <Text>Đang xử lý</Text>
                  </Card>
                </Col>
              </Row>
            )}
          </Card>
        </Col>

        {/* TOP PRODUCTS */}
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <StarOutlined />
                <span>Sản phẩm bán chạy</span>
              </Space>
            }
          >
            {topProducts.length === 0 ? (
              <Text type="secondary">Không có dữ liệu</Text>
            ) : (
              <List
                dataSource={topProducts}
                renderItem={(item) => (
                  <List.Item>
                    <Space direction="vertical">
                      <Text strong>{item.name}</Text>
                      <Text type="secondary">{item.sold} đã bán</Text>
                    </Space>
                    <div>{formatCurrency(item.revenue)}</div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* NOTIFICATIONS */}
      <Card
        className="mt-4"
        title={
          <Space>
            <BellOutlined />
            <span>Thông báo gần đây</span>
          </Space>
        }
      >
        {notifications.length === 0 ? (
          <Text type="secondary">Không có thông báo</Text>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(n) => (
              <Alert
                message={n.message}
                description={<Text type="secondary">{n.time}</Text>}
                type="info"
                showIcon
                className="mb-2"
              />
            )}
          />
        )}
      </Card>
    </div>
  );
}
