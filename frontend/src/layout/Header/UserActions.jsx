import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Bell } from "lucide-react";
import "../../styles/layouts/header/UserActions.css";
import { Avatar, Button, Dropdown, Menu } from "antd";
import sseManager from "../../utils/sseService";

export default function UserActions({
  greenText,
  cartCount,
  cartItems,
  showCartDropdown,
  setShowCartDropdown,
  userProfile,
  showProfileDropdown,
  setShowProfileDropdown,
  handleLogout,
  notifications,
  showNotificationDropdown,
  setShowNotificationDropdown,
  hoveredDropdown,
  setHoveredDropdown,
  storeName,
  sellerStatus,
}) {
  const navigate = useNavigate();

  const isUserLoggedIn = !!localStorage.getItem("token");

  // Lấy thông báo từ localStorage và sắp xếp giống NotificationPage
  const getNotifications = () => {
    let notis = [];
    try {
      notis = JSON.parse(localStorage.getItem("notifications")) || [];
    } catch {
      notis = [];
    }
    return notis;
  };
  const [unreadCount, setUnreadCount] = useState(0);
  const [unified, setUnified] = useState([]);
  const [dropdownLoaded, setDropdownLoaded] = useState(false);
  const userId = userProfile?.id;

  // Lightweight: Only fetch unread count for icon badge
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { fetchUnreadCount } = await import(
        "../../features/users/services/notificationService"
      );
      const count = await fetchUnreadCount();
      setUnreadCount(count);
    } catch (e) {
      setUnreadCount(0);
    }
  }, [userId]);

  // Derive unread from cached unified notifications when possible to avoid UI flash
  const deriveUnreadFromCache = useCallback(async () => {
    if (!userId) return;
    try {
      // Fast path: read notifications from localStorage (written by notification service) to avoid network
      const localList = getNotifications() || [];
      // getReadIds is synchronous and fast from notificationService
      const svc = await import(
        "../../features/users/services/notificationService"
      );
      const { getReadIds } = svc;
      const readSet = getReadIds(userId);
      const unread = (localList || []).filter(
        (n) => !readSet.has(String(n.id))
      ).length;
      setUnreadCount(unread);
    } catch (e) {
      // ignore, leave current unreadCount
    }
  }, [userId]);

  // Fetch unified notifications and return annotated list (don't set state here so caller can enrich first)
  const fetchNotifications = useCallback(
    async (force = false) => {
      // Allow fetching even if userId is not yet available; server uses token to scope results
      try {
        const { fetchUnifiedNotifications, annotateRead } = await import(
          "../../features/users/services/notificationService"
        );
        const list = await fetchUnifiedNotifications(userId, force);
        const annotated = annotateRead(list, userId);
        return annotated;
      } catch (e) {
        return [];
      }
    },
    [userId]
  );

  // Compute unread directly from unified notifications (server + generated), so icon matches dropdown/page
  const computeUnreadFromUnified = useCallback(
    async (force = false) => {
      try {
        const list = await fetchNotifications(force);
        // list are annotated (annotateRead sets `read` using local read-set) but
        // also fall back to DB-provided read flags. Treat a notification as read
        // if either annotated `n.read` is true or the local read set contains it.
        const svc = await import(
          "../../features/users/services/notificationService"
        );
        const { getReadIds } = svc;
        const readSet = getReadIds(userId);
        const unread = (list || []).filter((n) => {
          const id = String(n.id);
          const serverMarkedRead = !!n.read; // annotateRead should set this
          const locallyMarked = readSet.has(id);
          return !(serverMarkedRead || locallyMarked);
        }).length;
        setUnreadCount(unread);
        return list;
      } catch (e) {
        // fallback to lightweight unread endpoint
        try {
          await fetchUnreadCount();
        } catch {}
        return [];
      }
    },
    [userId, fetchNotifications]
  );

  // Fast synchronous initialization from localStorage so badge shows immediately without waiting
  useEffect(() => {
    try {
      const localList = getNotifications() || [];
      // Read read-ids directly from localStorage (browser-safe)
      const raw = localStorage.getItem(`notif_read_${userId || "guest"}`);
      let arr = [];
      try {
        arr = raw ? JSON.parse(raw) : [];
      } catch {
        arr = [];
      }
      const readSet = new Set(Array.isArray(arr) ? arr.map(String) : []);
      const unread = (localList || []).filter(
        (n) => !readSet.has(String(n.id))
      ).length;
      setUnreadCount(unread);
    } catch (e) {
      // ignore
    }
  }, [userId]);

  // Heavy: Fetch full notifications only when dropdown is opened
  // If metadata missing, fetch from orders API and merge into notifications state.
  const enrichTopNotifications = useCallback(async (notificationsList) => {
    if (!notificationsList || notificationsList.length === 0)
      return notificationsList;
    try {
      const axiosModule = await import(
        "../../features/admin/services/axiosInstance"
      );
      const axiosInstance = axiosModule.default;

      const top = notificationsList.slice(0, 3);
      // Collect order ids or codes from notifications (normalize 'db-123' -> '123')
      const ids = top
        .map(
          (n) =>
            (n.metadata && (n.metadata.order_id || n.metadata.id)) ||
            n.order_id ||
            n.id
        )
        .filter(Boolean)
        .map((v) => String(v).replace(/^db-/, ""));

      if (ids.length === 0) return notificationsList;

      // Try batch endpoint: /orders/recent/?ids=1,2,3 or fallback to single fetch
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
        // fallback: fetch each individually
        for (const id of ids) {
          try {
            const r = await axiosInstance.get(`/orders/${id}/`);
            if (r && r.data) ordersById[String(id)] = r.data;
          } catch (_) {
            // ignore individual failures
          }
        }
      }

      // Merge found order info into notifications
      const merged = notificationsList.map((n) => {
        const rawId =
          (n.metadata && (n.metadata.order_id || n.metadata.id)) ||
          n.order_id ||
          n.id ||
          "";
        const nid = String(rawId).replace(/^db-/, "");
        if (nid && ordersById[nid]) {
          const o = ordersById[nid];
          const md = { ...(n.metadata || {}) };
          md.order_code =
            md.order_code || o.ghn_order_code || o.code || o.number || o.id;
          md.order_total =
            md.order_total ||
            o.total_price ||
            o.total ||
            o.grand_total ||
            o.amount ||
            0;
          md.shop_name =
            md.shop_name ||
            (o.seller && (o.seller.store_name || o.seller.name)) ||
            o.store_name ||
            md.shop_name;
          return { ...n, metadata: md };
        }
        return n;
      });

      return merged;
    } catch (e) {
      return notificationsList;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Initial load - derive unread from cache first to avoid flashing old number, then fetch unified to compute exact unread
    deriveUnreadFromCache().then(() => computeUnreadFromUnified(false));

    // SSE connection for real-time updates
    let sseCleanup = null;
    if (userId) {
      sseManager.connect(userId);

      const handleSSEUpdate = (data) => {
        if (!mounted) return;
        // On SSE update: recompute unread from unified (force) and update dropdown if open
        (async () => {
          try {
            const list = await computeUnreadFromUnified(true);
            if (dropdownLoaded) {
              const enriched = await enrichTopNotifications(list);
              setUnified(enriched);
            }
          } catch (e) {
            console.error("Error handling SSE update:", e);
            fetchUnreadCount();
          }
        })();
      };

      sseManager.addListener(handleSSEUpdate);

      sseCleanup = () => {
        sseManager.removeListener(handleSSEUpdate);
        sseManager.disconnect();
      };
    }

    // Refresh when window regains focus (fallback, less frequent)
    const onFocus = () => {
      if (mounted) fetchUnreadCount();
    };
    window.addEventListener("focus", onFocus);

    // Polling: ensure unread count updates at least every 5 seconds
    const POLL_MS = 5000;
    let pollId = setInterval(() => {
      if (!mounted) return;
      fetchUnreadCount();
      if (dropdownLoaded) {
        // refresh dropdown contents in background (force to bypass cache)
        (async () => {
          const list = await fetchNotifications(true);
          const enriched = await enrichTopNotifications(list);
          setUnified(enriched);
        })();
      }
    }, POLL_MS);

    // Keep in sync across tabs when read-state changes
    const onStorage = (e) => {
      if (e?.key && String(e.key).startsWith("notif_read_") && mounted) {
        fetchUnreadCount();
        if (dropdownLoaded) {
          fetchNotifications();
        }
      }
    };
    window.addEventListener("storage", onStorage);

    // Same-tab notification read changes (dispatched by notificationService)
    const onNotifReadChanged = () => {
      if (!mounted) return;
      deriveUnreadFromCache();
      if (dropdownLoaded) fetchNotifications();
    };
    window.addEventListener("notif_read_changed", onNotifReadChanged);

    return () => {
      mounted = false;
      if (sseCleanup) sseCleanup();
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("notif_read_changed", onNotifReadChanged);
      try {
        clearInterval(pollId);
      } catch (e) {}
    };
  }, [userId, fetchUnreadCount, fetchNotifications, dropdownLoaded]);

  const sortedNotifications = useMemo(() => {
    const arr = [...(unified || [])];
    arr.sort((a, b) => {
      const ta = Number.isFinite(a?.ts)
        ? a.ts
        : a?.time
          ? new Date(a.time).getTime()
          : 0;
      const tb = Number.isFinite(b?.ts)
        ? b.ts
        : b?.time
          ? new Date(b.time).getTime()
          : 0;
      if (tb !== ta) return tb - ta; // newest first by numeric timestamp
      return String(b?.id ?? "").localeCompare(String(a?.id ?? ""));
    });
    return arr;
  }, [unified]);

  // Ensure badge reflects the current unified notifications list.
  // Some flows update `unified` directly (hover enrichment, SSE updates) without
  // immediately recomputing unreadCount; keep the badge in-sync here.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const svc = await import(
          "../../features/users/services/notificationService"
        );
        const { getReadIds } = svc;
        const readSet = getReadIds(userId);
        const unread = (unified || []).filter((n) => {
          const id = String(n.id);
          const serverMarkedRead = !!n.read;
          const locallyMarked = readSet.has(id);
          return !(serverMarkedRead || locallyMarked);
        }).length;
        if (mounted) setUnreadCount(unread);
      } catch (e) {
        // ignore and keep existing unreadCount
      }
    })();
    return () => {
      mounted = false;
    };
  }, [unified, userId]);

  // Helpers to extract order info from a notification object
  const formatVND = (n) => {
    try {
      const num = Number(n);
      if (!Number.isFinite(num)) return null;
      return `${Math.round(num).toLocaleString("vi-VN")} VNĐ`;
    } catch {
      return null;
    }
  };

  const getOrderInfo = (noti) => {
    if (!noti) return {};
    const md = noti.metadata || {};
    // common fields for order code
    const orderCode =
      md.order_code ||
      md.order_number ||
      md.code ||
      md.number ||
      noti.order_code ||
      noti.order_number ||
      null;
    // shop / seller name
    const shopName =
      md.seller_store_name ||
      md.store_name ||
      md.shop_name ||
      md.seller_name ||
      noti.seller_store_name ||
      noti.store_name ||
      null;
    // price / total
    const priceRaw =
      md.order_total ||
      md.total ||
      md.amount ||
      md.grand_total ||
      md.price ||
      noti.order_total ||
      noti.total ||
      null;
    const price = formatVND(priceRaw);
    return { orderCode, shopName, price };
  };

  return (
    <div
      className="d-flex align-items-center ms-3 mb-2 "
      style={{ flexShrink: 0, flexWrap: "nowrap" }}
    >

      <Link
        to="/wishlist"
        className=" me-2 p-2 d-none d-sm-inline-block"
        style={{ flexShrink: 0 }}
      >
        <Heart size={22} className="text-white" />
      </Link>

      {/* Notification icon */}
      <div
        style={{ position: "relative", display: "inline-block" }}
        onMouseEnter={() => {
          setShowNotificationDropdown && setShowNotificationDropdown(true);
          // Load full notifications when hovering (lazy load)
          if (!dropdownLoaded) {
            (async () => {
              const list = await fetchNotifications(true);
              try {
                console.debug(
                  "[UserActions] hover fetched notifications ids:",
                  (list || []).map((n) => n.id)
                );
              } catch (e) {}
              try {
                const enriched = await enrichTopNotifications(list);
                try {
                  console.debug(
                    "[UserActions] hover enriched ids:",
                    (enriched || []).map((n) => ({
                      id: n.id,
                      metadata: n.metadata,
                    }))
                  );
                } catch (e) {}
                setUnified(enriched);
                setDropdownLoaded(true);
              } catch (e) {
                setUnified(list);
                setDropdownLoaded(true);
              }
            })();
          }
        }}
        onMouseLeave={() =>
          setShowNotificationDropdown && setShowNotificationDropdown(false)
        }
      >
        <button
          className="notification-btn"
          style={{
            flexShrink: 0,
            position: "relative",
            border: "none",
            boxShadow: "none",
            borderRadius: "50%",
            padding: 8,
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          aria-label="Thông báo"
          onClick={async () => {
            // Mark all as read and reset count
            try {
              const svc = await import(
                "../../features/users/services/notificationService"
              );
              await svc.markAllAsRead(userId);
              // Annotate read according to local storage
              const { annotateRead } = svc;
              setUnified((prev) => annotateRead(prev || [], userId));
              setUnreadCount(0); // Reset count immediately
            } catch (error) {
              console.error("Failed to mark all as read:", error);
            }
            navigate("/notifications");
          }}
        >
          <Bell size={22} className="bell-icon" />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                minWidth: 16,
                height: 16,
                background: "#c62828", // đỏ
                color: "#fff",
                borderRadius: "50%",
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                zIndex: 10,
                boxShadow: "0 1px 4px #0002",
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {showNotificationDropdown && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "110%",
              minWidth: 340,
              maxWidth: 400,
              background: "#fff",
              boxShadow: "0 4px 24px #16a34a22",
              borderRadius: 16,
              zIndex: 2000,
              padding: "12px 0",
              color: "#166534",
              border: "1px solid #bbf7d0",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 17,
                padding: "0 18px 10px 18px",
                color: "#16a34a",
              }}
            >
              Thông báo
            </div>
            {!sortedNotifications || sortedNotifications.length === 0 ? (
              <div style={{ padding: "12px 18px", color: "#6b7280" }}>
                Không có thông báo mới
              </div>
            ) : (
              <>
                {sortedNotifications.slice(0, 3).map((noti, idx) => (
                  <div
                    key={noti.id || idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: noti.read ? "#f0fdf4" : "#e6f4ea",
                      borderRadius: 10,
                      border: "1px solid #bbf7d0",
                      padding: "12px 16px",
                      margin: "0 12px 10px 12px",
                      color: "#166534",
                      fontWeight: noti.read ? 400 : 600,
                      boxShadow: noti.read ? "none" : "0 2px 10px #16a34a22",
                      transition: "background 0.2s, box-shadow 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#d1fae5";
                      e.currentTarget.style.boxShadow = noti.read
                        ? "none"
                        : "0 4px 16px #16a34a33";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = noti.read
                        ? "#f0fdf4"
                        : "#e6f4ea";
                      e.currentTarget.style.boxShadow = noti.read
                        ? "none"
                        : "0 2px 10px #16a34a22";
                    }}
                  >
                    {noti.thumbnail && (
                      <img
                        src={noti.thumbnail}
                        alt="thumb"
                        style={{
                          width: 32,
                          height: 32,
                          objectFit: "cover",
                          borderRadius: 6,
                          marginRight: 10,
                          border: "1px solid #bbf7d0",
                          background: "#fff",
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      {(() => {
                        const md = noti.metadata || {};
                        const isReply =
                          (noti.type || "").toLowerCase() === "review_reply" ||
                          md.reply_text;
                        // For reply notifications we skip showing the verbose title/message
                        // (e.g. "Phản hồi từ thamvo1:") and instead show structured fields below.
                        const titleText = isReply
                          ? md.product_name
                            ? `Phản hồi đánh giá`
                            : "Phản hồi"
                          : noti.title || noti.message;
                        return (
                          <>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "#166534",
                                fontSize: 15,
                              }}
                            >
                              {titleText}
                            </div>

                            {/* Order-specific and reply details */}
                            {(() => {
                              const { orderCode, shopName, price } =
                                getOrderInfo(noti);
                              const showPrice = !isReply && price; // hide price for replies
                              if (
                                orderCode ||
                                shopName ||
                                showPrice ||
                                isReply
                              ) {
                                return (
                                  <div
                                    style={{
                                      marginTop: 6,
                                      fontSize: 13,
                                      color: "#14532d",
                                    }}
                                  >
                                    {orderCode && (
                                      <div>
                                        <strong>Mã đơn:</strong> {orderCode}
                                      </div>
                                    )}
                                    {shopName && (
                                      <div>
                                        <strong>Cửa hàng:</strong> {shopName}
                                      </div>
                                    )}
                                    {showPrice && (
                                      <div>
                                        <strong>Giá:</strong> {price}
                                      </div>
                                    )}

                                    {/* Review reply display: prefer metadata fields and do not
                                        duplicate content already present in noti.detail */}
                                    {isReply && (
                                      <div style={{ marginTop: 6 }}>
                                        {md.replier_name && (
                                          <div>
                                            <strong>Người phản hồi:</strong>{" "}
                                            {md.replier_name}
                                          </div>
                                        )}
                                        {md.product_name && (
                                          <div>
                                            <strong>Sản phẩm:</strong>{" "}
                                            {md.product_name}
                                          </div>
                                        )}
                                        {md.shop_name && (
                                          <div>
                                            <strong>Cửa hàng phản hồi:</strong>{" "}
                                            {md.shop_name}
                                          </div>
                                        )}
                                        {md.reply_text && (
                                          <div>
                                            <strong>Trả lời:</strong>{" "}
                                            {md.reply_text}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </>
                        );
                      })()}
                      {/* Show noti.detail only when it's not a reply (to avoid duplicate reply text) */}
                      {!(noti.metadata && noti.metadata.reply_text) &&
                        noti.detail && (
                          <div
                            style={{
                              fontSize: 13,
                              color: "#166534",
                              marginTop: 2,
                            }}
                          >
                            {noti.detail}
                          </div>
                        )}
                      {noti.time && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            marginTop: 4,
                          }}
                        >
                          {typeof noti.time === "string"
                            ? noti.time
                            : noti.time && noti.time.toLocaleString
                              ? noti.time.toLocaleString()
                              : ""}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div style={{ textAlign: "center", padding: "10px 0 0 0" }}>
                  <button
                    className="btn btn-link"
                    style={{ color: "#16a34a", fontWeight: 600, fontSize: 15 }}
                    onClick={async () => {
                      try {
                        const svc = await import(
                          "../../features/users/services/notificationService"
                        );
                        await svc.markAllAsRead(userId);
                        const { annotateRead } = svc;
                        setUnified((prev) => annotateRead(prev || [], userId));
                        setUnreadCount(0);
                      } catch (error) {
                        console.error("Failed to mark all as read:", error);
                      }
                      navigate("/notifications");
                    }}
                  >
                    Xem tất cả thông báo
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {/* Cart icon + dropdown */}
      <div
        style={{ position: "relative" }}
        onMouseEnter={() => setShowCartDropdown(true)}
        onMouseLeave={() => setShowCartDropdown(false)}
      >
        <button
          className="me-2 p-2 position-relative cart-button"
          style={{
            flexShrink: 0,
            position: "relative",
            border: "none",
            boxShadow: "none",
          }}
          aria-label="Giỏ hàng"
          onClick={() => navigate("/cart")}
        >
          <ShoppingCart size={22} className="cart-icon" />
          {cartCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                minWidth: 18,
                height: 18,
                background: "#faad14  ",
                color: "#fff",
                borderRadius: "50%",
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 5px",
                zIndex: 10,
                boxShadow: "0 1px 4px #0002",
              }}
            >
              {cartCount}
            </span>
          )}
        </button>

        {showCartDropdown && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "100%",
              minWidth: 320,
              maxWidth: 400,
              background: "#fff",
              boxShadow: "0 4px 16px #0002",
              borderRadius: 10,
              zIndex: 2000,
              padding: "12px 0",
            }}
          >
            <div
              style={{
                fontWeight: 500,
                fontSize: 14,
                padding: "0 18px 8px 18px",
                color: "#16a34a",
              }}
            >
              Sản phẩm trong giỏ hàng
            </div>
            {cartItems.length === 0 ? (
              <div style={{ padding: "12px 18px", color: "#888" }}>
                Giỏ hàng trống
              </div>
            ) : (
              <>
                {cartItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id || item.product_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 18px",
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                      fontSize: 15,
                      color: "#333",
                      transition: "background 0.2s",
                    }}
                    onClick={() => {
                      setShowCartDropdown(false);
                      navigate(`/cart`);
                    }}
                  >
                    <img
                      src={item.product?.image || "/media/products/default.png"}
                      alt="thumb"
                      style={{
                        width: 38,
                        height: 38,
                        objectFit: "cover",
                        borderRadius: 8,
                        marginRight: 8,
                        background: "#f0fdf4",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <span
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        wordBreak: "break-word",
                        flex: 1,
                        lineHeight: 1.4,
                      }}
                    >
                      {item.product?.name || "Sản phẩm"}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        color: "#16a34a",
                        fontWeight: 600,
                      }}
                    >
                      x{item.quantity}
                    </span>
                  </div>
                ))}
                <div style={{ textAlign: "center", padding: "10px 0 0 0" }}>
                  <button
                    className="btn btn-link"
                    style={{ color: "#16a34a", fontWeight: 600, fontSize: 15 }}
                    onClick={() => {
                      setShowCartDropdown(false);
                      navigate("/cart");
                    }}
                  >
                    Xem giỏ hàng
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* User profile or login button */}
      {isUserLoggedIn ? (
        <Dropdown
          overlay={
            <Menu
              style={{
                borderRadius: 6,
                overflow: "hidden",
                minWidth: 220,
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              }}
            >
              {/* Header thông tin người dùng */}
              <Menu.Item
                key="profile-header"
                disabled
                style={{ padding: 12, background: "#f0fdf4" }}
              >
                <div style={{ textAlign: "center" }}>
                  {userProfile?.avatar ? (
                    <Avatar
                      src={userProfile?.avatar}
                      size={48}
                      style={{
                        border: "2px solid #22C55E",
                        boxShadow: "0 2px 8px #22c55e22",
                      }}
                    />
                  ) : (
                    <Avatar
                      size={48}
                      style={{
                        backgroundColor: "#22C55E",
                        boxShadow: "0 2px 8px #22c55e22",
                        fontWeight: "bold",
                      }}
                    >
                      {localStorage.getItem("username")?.[0]?.toUpperCase() ||
                        ""}
                    </Avatar>
                  )}
                  <div
                    style={{
                      marginTop: 8,
                      fontWeight: 700,
                      fontSize: 18,
                      color: "#16a34a",
                    }}
                  >
                    {userProfile?.full_name || "___"}
                  </div>
                  <Button
                    type="default"
                    size="small"
                    style={{ marginTop: 8, borderRadius: 4, fontSize: 15 }}
                    onClick={() => navigate("/profile")}
                  >
                    Xem hồ sơ
                  </Button>
                </div>
              </Menu.Item>

              <Menu.Divider />

              {/* Đơn hàng */}
              <Menu.Item key="orders">
                <Link style={{ textDecoration: "none" }} to="/orders">
                  Đơn hàng của tôi
                </Link>
              </Menu.Item>

              <Menu.Item key="preorders">
                <Link style={{ textDecoration: "none" }} to="/preorders">
                  Đặt trước
                </Link>
              </Menu.Item>

              {/* Cửa hàng */}
              <Menu.Item
                key="seller"
                style={{
                  background:
                    hoveredDropdown === "register" ? "#16a34a" : "#22C55E",
                  color: "#fff",
                  transition: "0.2s",
                }}
                onMouseEnter={() => setHoveredDropdown("register")}
                onMouseLeave={() => setHoveredDropdown(null)}
              >
                <Link
                  to={(sellerStatus === "approved" || sellerStatus === "active") ? "/seller-center" : "/register-seller"}
                  style={{ color: "#fff", textDecoration: "none" }}
                >
                  {(sellerStatus === "approved" || sellerStatus === "active")
                    ? "Cửa hàng của tôi"
                    : sellerStatus === "pending"
                      ? "Đang chờ duyệt"
                      : "Đăng ký bán hàng"}
                </Link>
              </Menu.Item>

              <Menu.Divider />

              {/* Đăng xuất */}
              <Menu.Item
                key="logout"
                style={{
                  color: hoveredDropdown === "logout" ? "#b91c1c" : "#dc2626",
                  background:
                    hoveredDropdown === "logout" ? "#fee2e2" : "transparent",
                  transition: "0.2s",
                }}
                onMouseEnter={() => setHoveredDropdown("logout")}
                onMouseLeave={() => setHoveredDropdown(null)}
                onClick={handleLogout}
              >
                Đăng xuất
              </Menu.Item>
            </Menu>
          }
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            shape="circle"
            style={{
              background: "transparent",
              border: "none",
              boxShadow: "none",
              padding: 0,
            }}
          >
            {userProfile?.avatar ? (
              <Avatar
                src={userProfile?.avatar}
                size={32}
                style={{ border: "2px solid #eee" }}
              />
            ) : (
              // Trong phần hiển thị avatar
              <Avatar
                style={{ backgroundColor: "#eee", fontWeight: "bold" }}
                size={32}
              ></Avatar>
            )}
          </Button>
        </Dropdown>
      ) : (
        <Link
          to="/login"
          className="p-2"
          style={{
            flexShrink: 0,
            position: "relative",
            background: "transparent",
            border: "none",
            boxShadow: "none",
            textDecoration: "none",
          }}
        >
          <User size={22} className="text-white" />
        </Link>
      )}
    </div>
  );
}
