import { useEffect, useMemo, useRef, useState } from "react"
import { Container, Row, Col, Card, Badge, ListGroup, Alert, Spinner } from "react-bootstrap"
import { TrendingUp, ShoppingCart, Bell, DollarSign, Calendar, Star } from "lucide-react"
import API from "../../login_register/services/api"

// --- Helpers ---
const formatCurrency = (amount) => {
  const n = Number(amount || 0)
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
}

const toRelativeTime = (dateStr) => {
  try {
    const now = new Date()
    const d = new Date(dateStr)
    const diffMs = now.getTime() - d.getTime()
    const sec = Math.max(0, Math.floor(diffMs / 1000))
    if (sec < 60) return "vừa xong"
    const min = Math.floor(sec / 60)
    if (min < 60) return `${min} phút trước`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr} giờ trước`
    const day = Math.floor(hr / 24)
    return `${day} ngày trước`
  } catch (e) {
    return ""
  }
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

const addDays = (d, days) => {
  const nd = new Date(d)
  nd.setDate(nd.getDate() + days)
  return nd
}

const startOfWeek = (d) => {
  // Week starts Monday
  const day = d.getDay() || 7 // Sunday -> 7
  const diff = day - 1
  const monday = addDays(startOfDay(d), -diff)
  return monday
}

const endOfWeek = (d) => addDays(startOfWeek(d), 6)

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1)
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)

const inRange = (dateStr, from, to) => {
  const t = new Date(dateStr).getTime()
  return t >= from.getTime() && t <= to.getTime()
}

const percentDelta = (current, previous) => {
  const c = Number(current || 0)
  const p = Number(previous || 0)
  if (p === 0) return c > 0 ? 100 : 0
  return ((c - p) / p) * 100
}

// Aggregate revenue and top products from orders (expects 'items' and 'created_at')
// If validProductIds is provided (Set of product IDs), only aggregate those items and
// compute revenue as the sum of item (price * quantity) for matched products.
const aggregateFromOrders = (orders, { from, to, validProductIds }) => {
  let revenue = 0
  const productMap = new Map() // key: product_name -> { sold, revenue }

  const filterByProduct = !!(validProductIds && typeof validProductIds.has === 'function' && validProductIds.size >= 0)

  for (const o of orders || []) {
    if (!o?.created_at || !inRange(o.created_at, from, to)) continue

    if (filterByProduct) {
      // Only sum items that belong to this seller
      for (const it of o.items || []) {
        if (!validProductIds.has(it.product)) continue
        const name = it.product_name || `SP#${it.product}`
        const qty = Number(it.quantity || 0)
        const price = Number(it.price || 0)
        revenue += qty * price
        const prev = productMap.get(name) || { sold: 0, revenue: 0 }
        productMap.set(name, { sold: prev.sold + qty, revenue: prev.revenue + qty * price })
      }
    } else {
      // Fallback: use order total and include all items for top products listing
      const total = Number(o.total_price || 0)
      revenue += total
      for (const it of o.items || []) {
        const name = it.product_name || `SP#${it.product}`
        const qty = Number(it.quantity || 0)
        const price = Number(it.price || 0)
        const prev = productMap.get(name) || { sold: 0, revenue: 0 }
        productMap.set(name, { sold: prev.sold + qty, revenue: prev.revenue + qty * price })
      }
    }
  }

  const products = [...productMap.entries()]
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => b.sold - a.sold || b.revenue - a.revenue)

  return { revenue, products }
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [pendingOrders, setPendingOrders] = useState([])
  const [processingOrders, setProcessingOrders] = useState([]) // shipping

  // Sales stats
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [yesterdayRevenue, setYesterdayRevenue] = useState(0)
  const [weekRevenue, setWeekRevenue] = useState(0)
  const [prevWeekRevenue, setPrevWeekRevenue] = useState(0)
  const [monthRevenue, setMonthRevenue] = useState(0)
  const [prevMonthRevenue, setPrevMonthRevenue] = useState(0)

  // Orders box
  const [orderNewCount, setOrderNewCount] = useState(0)
  const [orderProcessingCount, setOrderProcessingCount] = useState(0)

  // Top products (limit 4, based on recent 30 days of processing orders)
  const [topProducts, setTopProducts] = useState([])

  // Notifications
  const [notifications, setNotifications] = useState([])
  const [reviewActivities, setReviewActivities] = useState([])

  // Seller product IDs to scope revenue and top products to this seller only
  const [sellerProductIds, setSellerProductIds] = useState(new Set())

  const computeStats = (ordersArr, validIds) => {
    const now = new Date()

    // Today vs Yesterday
    const todayFrom = startOfDay(now)
    const todayTo = endOfDay(now)
    const yFrom = startOfDay(addDays(now, -1))
    const yTo = endOfDay(addDays(now, -1))

    const todayAgg = aggregateFromOrders(ordersArr, { from: todayFrom, to: todayTo, validProductIds: validIds })
    const yAgg = aggregateFromOrders(ordersArr, { from: yFrom, to: yTo, validProductIds: validIds })

    setTodayRevenue(todayAgg.revenue)
    setYesterdayRevenue(yAgg.revenue)

    // This week vs last week
    const thisWeekFrom = startOfWeek(now)
    const thisWeekTo = endOfWeek(now)
    const lastWeekFrom = addDays(thisWeekFrom, -7)
    const lastWeekTo = addDays(thisWeekTo, -7)

    const wAgg = aggregateFromOrders(ordersArr, { from: thisWeekFrom, to: thisWeekTo, validProductIds: validIds })
    const pwAgg = aggregateFromOrders(ordersArr, { from: lastWeekFrom, to: lastWeekTo, validProductIds: validIds })

    setWeekRevenue(wAgg.revenue)
    setPrevWeekRevenue(pwAgg.revenue)

    // This month vs last month
    const thisMonthFrom = startOfMonth(now)
    const thisMonthTo = endOfMonth(now)
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15)
    const lastMonthFrom = startOfMonth(lastMonthDate)
    const lastMonthTo = endOfMonth(lastMonthDate)

    const mAgg = aggregateFromOrders(ordersArr, { from: thisMonthFrom, to: thisMonthTo, validProductIds: validIds })
    const pmAgg = aggregateFromOrders(ordersArr, { from: lastMonthFrom, to: lastMonthTo, validProductIds: validIds })

    setMonthRevenue(mAgg.revenue)
    setPrevMonthRevenue(pmAgg.revenue)

    // Top products - last 30 days from shipping orders
    const recentFrom = addDays(now, -30)
    const recentAgg = aggregateFromOrders(ordersArr, { from: recentFrom, to: now, validProductIds: validIds })
    setTopProducts(recentAgg.products.slice(0, 4))
  }

  const loadData = async (opts = {}) => {
    const silent = !!opts.silent
    try {
      if (!silent) setLoading(true)
      const [pendingRes, processingRes, successRes, sellerProdsRes] = await Promise.all([
        API.get("orders/seller/pending/"),
        API.get("orders/seller/processing/"),
        API.get("orders/seller/complete/"),
        API.get("sellers/productseller/"),
      ])

      const pend = pendingRes?.data || []
      const ship = processingRes?.data || []
      const successOrders = successRes?.data || []
      const sellerProdList = sellerProdsRes?.data || []

      setPendingOrders(pend)
      setProcessingOrders(ship)

      setOrderNewCount(pend.length)
      setOrderProcessingCount(ship.length)

      // Save seller product IDs to scope revenue and top products
      const ids = new Set((sellerProdList || []).map(p => p.id))
      setSellerProductIds(ids)

      // Compute sales from COMPLETED orders to match Finance page semantics
      computeStats(successOrders, ids)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const loadReviewActivities = async () => {
    try {
      // Recent activities for notifications (reviews only)
      const actRes = await API.get("reviews/seller/reviews/recent-activities/?limit=5")
      const acts = actRes?.data?.results || []

      const mapped = acts.map((a) => ({
        type: "review",
        message: a.message,
        created_at: a.created_at,
      }))
      setReviewActivities(mapped)
    } catch (e) {
      // Silent fail for notifications
    }
  }

  // Build combined notifications: newest pending orders + recent review activities (max 5)
  useEffect(() => {
    const orderNewNotifs = (pendingOrders || [])
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3)
      .map((o) => ({
        type: "success",
        message: `Đơn hàng mới #${o.id} đã được tạo`,
        time: toRelativeTime(o.created_at),
        created_at: o.created_at,
      }))

    const deliveredNotifs = (processingOrders || [])
      .filter(o => o.status === 'success') // in case API returns mixed
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 2)
      .map(o => ({
        type: "success",
        message: `Đơn hàng #${o.id} đã giao thành công`,
        time: toRelativeTime(o.created_at),
        created_at: o.created_at,
      }))

    const reviewNotifs = (reviewActivities || [])
      .map((r) => ({ type: "info", message: r.message, time: toRelativeTime(r.created_at), created_at: r.created_at }))

    const merged = [...orderNewNotifs, ...deliveredNotifs, ...reviewNotifs]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)

    setNotifications(merged)
  }, [pendingOrders, reviewActivities])

  useEffect(() => {
    // Initial load
    loadData()
    loadReviewActivities()

    // Auto refresh every 10s, silent to avoid flicker
    const interval = setInterval(() => {
      loadData({ silent: true })
      loadReviewActivities()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const todayDelta = useMemo(() => percentDelta(todayRevenue, yesterdayRevenue), [todayRevenue, yesterdayRevenue])
  const weekDelta = useMemo(() => percentDelta(weekRevenue, prevWeekRevenue), [weekRevenue, prevWeekRevenue])
  const monthDelta = useMemo(() => percentDelta(monthRevenue, prevMonthRevenue), [monthRevenue, prevMonthRevenue])

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="p-2 rounded-circle" style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="mb-0 fw-bold text-balance">Tổng quan cửa hàng</h2>
              <p className="text-muted mb-0">Theo dõi hiệu suất kinh doanh của bạn</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Sales Overview */}
      <Row className="mb-4">
        <Col lg={4} md={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1 small">Doanh số hôm nay</p>
                  <h4 className="mb-0 fw-bold" style={{ color: "var(--color-primary)" }}>
                    {formatCurrency(todayRevenue)}
                  </h4>
                </div>
                <div className="p-3 rounded-circle" style={{ backgroundColor: "var(--color-primary)", opacity: 0.1 }}>
                  <DollarSign size={24} style={{ color: "var(--color-primary)" }} />
                </div>
              </div>
              <div className="mt-2">
                <Badge bg={todayDelta >= 0 ? "success" : "danger"} className="small">
                  {todayDelta >= 0 ? "+" : ""}{todayDelta.toFixed(1)}%
                </Badge>
                <span className="text-muted small ms-2">so với hôm qua</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} md={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1 small">Doanh số tuần</p>
                  <h4 className="mb-0 fw-bold" style={{ color: "var(--color-accent)" }}>
                    {formatCurrency(weekRevenue)}
                  </h4>
                </div>
                <div className="p-3 rounded-circle" style={{ backgroundColor: "var(--color-accent)", opacity: 0.1 }}>
                  <Calendar size={24} style={{ color: "var(--color-accent)" }} />
                </div>
              </div>
              <div className="mt-2">
                <Badge bg={weekDelta >= 0 ? "success" : "danger"} className="small">
                  {weekDelta >= 0 ? "+" : ""}{weekDelta.toFixed(1)}%
                </Badge>
                <span className="text-muted small ms-2">so với tuần trước</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} md={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1 small">Doanh số tháng</p>
                  <h4 className="mb-0 fw-bold" style={{ color: "var(--color-chart-4)" }}>
                    {formatCurrency(monthRevenue)}
                  </h4>
                </div>
                <div className="p-3 rounded-circle" style={{ backgroundColor: "var(--color-chart-4)", opacity: 0.1 }}>
                  <TrendingUp size={24} style={{ color: "var(--color-chart-4)" }} />
                </div>
              </div>
              <div className="mt-2">
                <Badge bg={monthDelta >= 0 ? "success" : "danger"} className="small">
                  {monthDelta >= 0 ? "+" : ""}{monthDelta.toFixed(1)}%
                </Badge>
                <span className="text-muted small ms-2">so với tháng trước</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Orders and Products */}
      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pb-0">
              <div className="d-flex align-items-center gap-2">
                <ShoppingCart size={20} style={{ color: "var(--color-primary)" }} />
                <h5 className="mb-0 fw-semibold">Đơn hàng</h5>
              </div>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-3"><Spinner animation="border" size="sm" /> Đang tải…</div>
              ) : (
                <Row>
                  <Col sm={6} className="mb-2">
                    <div className="text-center p-3 rounded" style={{ backgroundColor: "var(--color-muted)" }}>
                      <h3 className="mb-1 fw-bold" style={{ color: "var(--color-primary)" }}>
                        {orderNewCount}
                      </h3>
                      <p className="text-muted mb-0 small">Đơn hàng mới</p>
                    </div>
                  </Col>
                  <Col sm={6} className="mb-2">
                    <div className="text-center p-3 rounded" style={{ backgroundColor: "var(--color-muted)" }}>
                      <h3 className="mb-1 fw-bold" style={{ color: "var(--color-accent)" }}>
                        {orderProcessingCount}
                      </h3>
                      <p className="text-muted mb-0 small">Đang xử lý</p>
                    </div>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pb-0">
              <div className="d-flex align-items-center gap-2">
                <Star size={20} style={{ color: "var(--color-accent)" }} />
                <h5 className="mb-0 fw-semibold">Sản phẩm bán chạy</h5>
              </div>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-3"><Spinner animation="border" size="sm" /> Đang tải…</div>
              ) : (
                <ListGroup variant="flush">
                  {topProducts.length === 0 && (
                    <div className="text-muted small">Chưa có dữ liệu</div>
                  )}
                  {topProducts.map((product, index) => (
                    <ListGroup.Item key={product.name} className="px-0 py-2 border-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                            style={{ width: 32, height: 32, backgroundColor: index === 0 ? "var(--color-primary)" : "var(--color-muted-foreground)", fontSize: 14 }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="mb-0 fw-medium">{product.name}</p>
                            <small className="text-muted">Đã bán: {product.sold}</small>
                          </div>
                        </div>
                        <div className="text-end">
                          <p className="mb-0 fw-semibold" style={{ color: "var(--color-primary)" }}>
                            {formatCurrency(product.revenue)}
                          </p>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Notifications */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pb-0">
              <div className="d-flex align-items-center gap-2">
                <Bell size={20} style={{ color: "var(--color-primary)" }} />
                <h5 className="mb-0 fw-semibold">Thông báo hệ thống</h5>
              </div>
            </Card.Header>
            <Card.Body>
              {notifications.length === 0 && (
                <div className="text-muted small">Chưa có thông báo</div>
              )}
              {notifications.map((notification, index) => (
                <Alert key={index} variant={notification.type === "success" ? "success" : notification.type === "warning" ? "warning" : "info"} className="mb-2 py-2">
                  <div className="d-flex justify-content-between align-items-start">
                    <p className="mb-0 small">{notification.message}</p>
                    <small className="text-muted">{notification.time}</small>
                  </div>
                </Alert>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}