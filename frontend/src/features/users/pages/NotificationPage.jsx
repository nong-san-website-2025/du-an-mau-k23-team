import React, { useEffect, useMemo, useState } from "react";
import { BellOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Avatar, Badge, Card, List, Typography, Empty, theme } from "antd";
import useUserProfile from "../services/useUserProfile";
import axiosInstance from "../../admin/services/axiosInstance";
import { fetchUnifiedNotifications, annotateRead, markAllAsRead } from "../services/notificationService";

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
      if (!userId) {
        return;
      }
      try {
        const list = await fetchUnifiedNotifications(userId);

        // Mark all as read when viewing notification page (persist client-side and backend)
        await markAllAsRead(userId);

        let annotated = annotateRead(list, userId);

        // Enrich notifications with order info when available
        const enrichNotifications = async (notifications) => {
          if (!notifications || notifications.length === 0) return notifications;
          try {
            // Collect candidate order ids from metadata or notification id
            const ids = Array.from(
              new Set(
                notifications
                  .map((n) => (n.metadata && (n.metadata.order_id || n.metadata.id)) || n.order_id || n.id)
                  .filter(Boolean)
                  .map((v) => String(v).replace(/^db-/, ""))
              )
            );
            if (ids.length === 0) return notifications;

            // Try batch endpoint first
            let ordersById = {};
            try {
              const params = { params: { ids: ids.join(",") } };
              const res = await axiosInstance.get(`/orders/recent/`, params);
              if (res && res.data && Array.isArray(res.data)) {
                res.data.forEach((o) => {
                  ordersById[String(o.id)] = o;
                });
              }
            } catch (e) {
              // Fallback to individual requests
              for (const id of ids) {
                try {
                  const r = await axiosInstance.get(`/orders/${id}/`);
                  if (r && r.data) ordersById[String(id)] = r.data;
                } catch (_) {
                  // ignore
                }
              }
            }

            // Merge order data into notification metadata
            return notifications.map((n) => {
              const rawId = (n.metadata && (n.metadata.order_id || n.metadata.id)) || n.order_id || n.id || "";
              const nid = String(rawId).replace(/^db-/, "");
              if (nid && ordersById[nid]) {
                const o = ordersById[nid];
                const md = { ...(n.metadata || {}) };
                md.order_code = md.order_code || o.ghn_order_code || o.code || o.number || o.id;
                md.order_total = md.order_total || o.total_price || o.total || o.grand_total || o.amount || 0;
                md.shop_name = md.shop_name || (o.seller && (o.seller.store_name || o.seller.name)) || o.store_name || md.shop_name;
                return { ...n, metadata: md };
              }
              return n;
            });
          } catch (e) {
            return notifications;
          }
        };

        try {
          const enriched = await enrichNotifications(annotated);
          annotated = enriched;
        } catch (e) {
          // ignore enrichment errors
        }

        console.log('[NotificationPage] Annotated list:', annotated);
        if (mounted) setItems(annotated);
      } catch (e) {
        console.error('[NotificationPage] Error fetching notifications:', e);
        if (mounted) setItems([]);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const formatVND = (n) => {
    try {
      const num = Number(n);
      if (!Number.isFinite(num)) return null;
      return `${Math.round(num).toLocaleString("vi-VN")} VNĐ`;
    } catch {
      return null;
    }
  };

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
      className="mx-2 mx-md-5 my-3"
      style={{ maxWidth: "100%" }}
      title={
        <div className="d-flex align-items-center gap-2 gap-md-3">
          <BellOutlined style={{ fontSize: 20 }} className="text-primary" />
          <Title level={4} className="mb-0 fs-5 fs-md-4" style={{ color: token.colorTextHeading }}>
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
            className="px-2 px-md-3 py-3"
            style={{
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
                (() => {
                  const md = noti.metadata || {};
                  const isReply = (noti.type || "").toLowerCase() === 'review_reply' || md.reply_text;
                  const titleText = isReply ? (md.product_name ? `Phản hồi đánh giá` : "Phản hồi") : (noti.title || noti.message);
                  return (
                    <Text
                      strong={!noti.read}
                      style={{
                        color: noti.read ? token.colorTextSecondary : token.colorText,
                        fontSize: 15,
                      }}
                    >
                      {titleText}
                    </Text>
                  );
                })()
              }
              description={
                <div>
                  {/* Show noti.detail only when it's not a reply to avoid duplication */}
                  {!(noti.metadata && noti.metadata.reply_text) && noti.detail && (
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
                  {/* Order-specific display */}
                  {(() => {
                    const md = noti.metadata || {};
                    const orderCode = md.order_code || md.order_number || md.code || md.number || noti.order_code || null;
                    const shopName = md.shop_name || md.store_name || md.seller_name || null;
                    const price = formatVND(md.order_total || md.total || md.amount || noti.order_total);
                    if (orderCode || shopName || price) {
                      return (
                        <div className="mb-2 small text-muted">
                          <div className="row g-2">
                            {orderCode && (
                              <div className="col-12 col-md-4"><strong>Mã đơn:</strong> {orderCode}</div>
                            )}
                            {shopName && (
                              <div className="col-12 col-md-4"><strong>Cửa hàng:</strong> {shopName}</div>
                            )}
                            {price && (
                              <div className="col-12 col-md-4"><strong>Giá:</strong> {price}</div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {/* Review reply display */}
                  {(() => {
                    const md = noti.metadata || {};
                    if (md.reply_text || md.shop_name) {
                      return (
                        <div className="mb-2 small text-muted">
                          {md.shop_name && (<div><strong>Cửa hàng phản hồi:</strong> {md.shop_name}</div>)}
                          {md.reply_text && (<div><strong>Trả lời:</strong> {md.reply_text}</div>)}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div className="d-flex align-items-center justify-content-between mt-2">
                    {noti.thumbnail && (
                      <img
                        src={noti.thumbnail}
                        alt=""
                        className="me-3 rounded border"
                        style={{
                          width: 50,
                          height: 50,
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <Text type="secondary" className="small ms-auto">
                      {noti.time}
                    </Text>
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}