// Unified notification service for user-related events
// - Complaints (resolved/rejected)
// - Orders status changes
// - Wallet top-up approvals/rejections
// - Vouchers claimed and expiring soon

import axiosInstance from "../../admin/services/axiosInstance";
import API from "../../login_register/services/api";

// Cache for notifications to prevent continuous fetching
const notificationCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helpers
const safeToDateString = (v) => {
  try {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "" : d.toLocaleString("vi-VN");
  } catch {
    return "";
  }
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const formatVND = (n) => `${Math.round(Number(n) || 0).toLocaleString("vi-VN")} VNĐ`;

// Client-side read/unread helpers (per-user)
const READ_KEY = (userId) => `notif_read_${userId || 'guest'}`;
export function getReadIds(userId) {
  try {
    const raw = localStorage.getItem(READ_KEY(userId));
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}
export async function markAsRead(userId, ids) {
  try {
    // Mark in localStorage for immediate UI update
    const set = getReadIds(userId);
    (ids || []).forEach((id) => id && set.add(String(id)));
    localStorage.setItem(READ_KEY(userId), JSON.stringify([...set]));
    // Notify same-window listeners that read state changed
    try {
      window.dispatchEvent(new Event('notif_read_changed'));
    } catch (e) {
      // ignore in non-browser environments
    }
    
    // Mark in backend database
    // Extract database notification IDs (format: "db-123" -> 123)
    const dbIds = (ids || [])
      .filter(id => String(id).startsWith('db-'))
      .map(id => String(id).replace('db-', ''));
    
    if (dbIds.length > 0) {
      // Mark each notification as read in backend
      await Promise.all(
        dbIds.map(id => 
          API.post(`/users/notifications/${id}/mark_read/`).catch(err => {
            console.error(`Failed to mark notification ${id} as read:`, err);
          })
        )
      );
    }
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
  }
}
export function annotateRead(list, userId) {
  const set = getReadIds(userId);
  return (list || []).map((n) => ({ ...n, read: set.has(String(n.id)) }));
}

// Fetch all pages from a paginated endpoint that may return {results,next} or array
async function fetchAllPages(initialUrl) {
  let all = [];
  let url = initialUrl;
  // Prefer axiosInstance; if absolute URL, fall back to axiosInstance with headers
  while (url) {
    // If next is absolute, use API (same headers as axiosInstance)
    const isAbs = /^https?:\/\//i.test(url);
    const res = isAbs
      ? await API.get(url)
      : await axiosInstance.get(url);
    let pageData = [];
    if (Array.isArray(res.data)) {
      pageData = res.data;
      url = null;
    } else if (res.data && Array.isArray(res.data.results)) {
      pageData = res.data.results;
      url = res.data.next || null;
    } else {
      pageData = [];
      url = null;
    }
    all = all.concat(pageData);
  }
  return all;
}

// Complaints -> notifications
async function fetchComplaintNotifications(userId) {
  try {
    const complaints = await fetchAllPages("/complaints/");
    const mine = complaints.filter(
      (c) => c.user === userId || c.user_id === userId || c.user?.id === userId
    );
    return (mine || [])
      .filter((c) => ["resolved", "rejected"].includes((c.status || "").toLowerCase()))
      .map((c) => {
        const status = (c.status || "").toLowerCase();
        const productName = c.product_name || c.product?.name || "";
        const detailLines = [
          `Khiếu nại sản phẩm: ${productName}.`,
          `Lý do: ${c.reason || ""}.`,
        ];
        if (status === "resolved") {
          const rtCode = (c.resolution_type || c.resolution || "").toLowerCase();
          let vnLabel = "";
          switch (rtCode) {
            case "refund_full":
              vnLabel = "Hoàn tiền toàn bộ";
              break;
            case "refund_partial":
              vnLabel = "Hoàn tiền một phần";
              break;
            case "replace":
              vnLabel = "Đổi sản phẩm";
              break;
            case "voucher":
              vnLabel = "Tặng voucher/điểm thưởng";
              break;
            case "reject":
              vnLabel = "Từ chối khiếu nại";
              break;
            default:
              vnLabel = "Đã xử lý";
          }
          detailLines.push(`Hình thức xử lý: ${vnLabel}`);
        } else if (status === "rejected") {
          detailLines.push(`Hình thức xử lý: Từ chối khiếu nại`);
        }

        // Prefer showing refund amount when available
        let messageText = status === "resolved" ? "Khiếu nại của bạn đã được xử lý!" : "Khiếu nại của bạn đã bị từ chối!";
        if (status === "resolved") {
          const rtMsgCode = (c.resolution_type || c.resolution || "").toLowerCase();
          if (rtMsgCode === "refund_full") {
            const unit = toNumber(c.unit_price ?? c.product_price ?? c.product?.price);
            const qty = toNumber(c.quantity) ?? 1;
            if (unit != null) messageText = `Bạn đã được hoàn tiền ${formatVND(unit * qty)}`;
          } else if (rtMsgCode === "refund_partial") {
            const pAmt = toNumber(c.refund_amount ?? c.amount);
            if (pAmt != null) messageText = `Bạn đã được hoàn tiền ${formatVND(pAmt)}`;
          }
        }

        let thumbnail = null;
        const media = c.media_urls || c.media || [];
        if (Array.isArray(media) && media.length > 0) {
          const img = media.find((url) => /\.(jpg|jpeg|png|gif)$/i.test(url));
          thumbnail = img || media[0];
        }

        return {
          id: `complaint-${c.id}`,
          type: "complaint",
          message: messageText,
          detail: detailLines.join("\n"),
          time: safeToDateString(c.updated_at || c.created_at),
          ts: (() => { try { const t = new Date(c.updated_at || c.created_at).getTime(); return Number.isFinite(t) ? t : 0; } catch { return 0; } })(),
          read: false,
          userId,
          thumbnail,
        };
      });
  } catch {
    return [];
  }
}

// Fetch notifications from database (NEW - replaces old order/review fetching)
async function fetchDatabaseNotifications() {
  try {
    console.log('[NotificationService] Fetching from /users/notifications/...');
    const res = await API.get("/users/notifications/");
    console.log('[NotificationService] Response:', res.data);
    const notifications = Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : [];
    console.log('[NotificationService] Parsed notifications:', notifications.length);
    
    const mapped = notifications.map((n) => {
      const metadata = n.metadata || {};
      let thumbnail = null;
      
      // Try to get thumbnail from metadata
      if (metadata.product_image) {
        thumbnail = metadata.product_image.startsWith("http")
          ? metadata.product_image
          : `http://localhost:8000${metadata.product_image.startsWith("/") ? "" : "/media/"}${metadata.product_image}`;
      }
      
      return {
        id: `db-${n.id}`,
        type: n.type,
        title: n.title,
        message: n.message,
        detail: n.detail,
        time: safeToDateString(n.created_at),
        ts: (() => { 
          try { 
            const t = new Date(n.created_at).getTime(); 
            return Number.isFinite(t) ? t : 0; 
          } catch { 
            return 0; 
          } 
        })(),
        read: n.is_read,
        userId: undefined,
        thumbnail,
        metadata: metadata,
      };
    });
    
    console.log('[NotificationService] Mapped notifications:', mapped);
    return mapped;
  } catch (error) {
    console.error("[NotificationService] Failed to fetch database notifications:", error);
    if (error.response) {
      console.error("[NotificationService] Error response:", error.response.status, error.response.data);
    }
    return [];
  }
}

// Orders -> notifications (based on current status) - DEPRECATED, kept for backward compatibility
async function fetchOrderNotifications() {
  // This function is now deprecated - notifications come from database
  // Kept for backward compatibility only
  return [];
}

// Wallet top-up -> notifications
// async function fetchWalletNotifications() {
//   try {
//     const res = await API.get("/wallet/my-topup-requests/");
//     const list = Array.isArray(res.data) ? res.data : [];
//     return list
//       .filter((r) => ["approved", "rejected"].includes((r.status || "").toLowerCase()))
//       .map((r) => {
//         const status = (r.status || "").toLowerCase();
//         const approved = status === "approved";
//         return {
//           id: `wallet-${r.id}`,
//           type: "wallet",
//           message: approved
//             ? `Yêu cầu nạp ${formatVND(r.amount)} đã được duyệt`
//             : `Yêu cầu nạp ${formatVND(r.amount)} đã bị từ chối`,
//           detail: approved ? "Số dư ví đã được cộng." : "Vui lòng kiểm tra lại thông tin hoặc liên hệ hỗ trợ.",
//           time: safeToDateString(r.processed_at || r.updated_at || r.created_at),
//           ts: (() => { try { const t = new Date(r.processed_at || r.updated_at || r.created_at).getTime(); return Number.isFinite(t) ? t : 0; } catch { return 0; } })(),
//           read: false,
//           userId: r.user || undefined,
//           thumbnail: null,
//         };
//       });
//   } catch {
//     return [];
//   }
// }

// Vouchers -> notifications (claimed, and expiring within 3 days)
async function fetchVoucherNotifications() {
  try {
    const res = await axiosInstance.get("/promotions/vouchers/my_vouchers/");
    const list = Array.isArray(res.data) ? res.data : [];
    const out = [];
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    list.forEach((uv) => {
      const v = uv?.voucher || uv; // backend may nest
      const code = v?.code || "Voucher";
      const createdAt = uv.created_at || v?.created_at;
      const endAt = v?.end_at;
      if (createdAt) {
        out.push({
          id: `voucher-claim-${uv.id || code}`,
          type: "voucher",
          message: `Bạn đã nhận voucher ${code}`,
          detail: v?.discount_type ? `Loại: ${v.discount_type}` : "",
          time: safeToDateString(createdAt),
          ts: (() => { try { const t = new Date(createdAt).getTime(); return Number.isFinite(t) ? t : 0; } catch { return 0; } })(),
          read: false,
          userId: uv.user || undefined,
          thumbnail: null,
        });
      }
      if (endAt) {
        const endMs = new Date(endAt).getTime();
        if (!isNaN(endMs) && endMs - now <= threeDays && endMs > now) {
          out.push({
            id: `voucher-expire-${uv.id || code}`,
            type: "voucher",
            message: `Voucher ${code} sắp hết hạn`,
            detail: `Hạn dùng: ${safeToDateString(endAt)}`,
            time: safeToDateString(new Date(endMs - threeDays)),
            ts: endMs - threeDays,
            read: false,
            userId: uv.user || undefined,
            thumbnail: null,
          });
        }
      }
    });
    return out;
  } catch {
    return [];
  }
}

async function fetchReviewReplyNotifications(userId) {
  try {
    // Fetch all reviews and keep only mine
    const reviews = await fetchAllPages("/reviews/reviews/");
    const myReviews = (reviews || [])
      .filter((r) => r.user === userId || r.user_id === userId || r.user?.id === userId);
    const myReviewIds = myReviews.map((r) => r.id);
    if (myReviewIds.length === 0) return [];

    // Build a map reviewId -> store name for later use in replies
    const reviewToStore = {};
    myReviews.forEach((r) => {
      const storeName = r.seller_store_name
        || r.product?.seller?.store_name
        || r.product?.seller_store_name
        || r.product?.seller_name
        || "cửa hàng";
      if (r?.id != null) reviewToStore[r.id] = storeName;
    });

    // Fetch replies and keep those that reply to my reviews
    const replies = await fetchAllPages("/reviews/review-replies/");
    const mine = (replies || []).filter((rp) => myReviewIds.includes(rp.review));

    return mine.map((rp) => {
      const createdAt = rp.created_at;
      const storeName = reviewToStore[rp.review] || "cửa hàng";
      // try to infer replier name from common fields
      const replier = rp.user_name || rp.user?.username || rp.user?.full_name || rp.user?.email || rp.replier_name || rp.author || (rp.user && typeof rp.user === 'string' ? rp.user : null) || "người bán";
      const productName = rp.product_name || rp.product?.name || null;
      return {
        id: `review-reply-${rp.id}`,
        type: "review_reply",
        message: `Phản hồi từ ${storeName}:`,
        detail: rp.reply_text || "",
        time: safeToDateString(createdAt),
        ts: (() => { try { const t = new Date(createdAt).getTime(); return Number.isFinite(t) ? t : 0; } catch { return 0; } })(),
        read: false,
        userId,
        thumbnail: null,
        metadata: {
          shop_name: storeName,
          reply_text: rp.reply_text || "",
          replier_name: replier,
          product_name: productName,
        },
      };
    });
  } catch {
    return [];
  }
}

export async function fetchUnifiedNotifications(userId, force = false) {
  console.log('[fetchUnifiedNotifications] Called with userId:', userId, 'force:', force);
  const cacheKey = `notifications_${userId || 'guest'}`;
  const now = Date.now();

  // Check cache unless forced
  if (!force && notificationCache.has(cacheKey)) {
    const cached = notificationCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL) {
      console.log('[fetchUnifiedNotifications] Returning cached data:', cached.data.length, 'items');
      return cached.data;
    }
  }

  // Fetch fresh data - now primarily from database
  console.log('[fetchUnifiedNotifications] Fetching fresh data...');
  const [dbNotifications, reviewReplies, complaint, vouchers] = await Promise.all([
    fetchDatabaseNotifications(), // Fetch database notifications (may include generic review replies)
    fetchReviewReplyNotifications(userId), // Fetch only replies to this user's reviews
    fetchComplaintNotifications(userId),
    fetchVoucherNotifications(),
  ]);

  console.log('[fetchUnifiedNotifications] Fetched:', {
    dbNotifications: dbNotifications.length,
    complaint: complaint.length,
    vouchers: vouchers.length
  });

  // Remove generic db-sourced review_reply items only when we will replace them with
  // per-user replies fetched by fetchReviewReplyNotifications(userId).
  // If userId is not provided (or reviewReplies fetch failed/empty) we should keep
  // dbNotifications of type 'review_reply' so shop replies stored in DB still surface
  // in the unified list and increment the unread badge.
  const dbFiltered = (dbNotifications || []).filter((n) => {
    const t = (n.type || '').toLowerCase();
    if (t !== 'review_reply') return true;
    // If we have a userId and will include fetchReviewReplyNotifications, prefer to
    // remove generic db items to avoid duplicates. If userId is falsy, keep the db item.
    return !userId;
  });

  // Combine all notifications (use reviewReplies from fetchReviewReplyNotifications)
  const all = [...dbFiltered, ...(reviewReplies || []), ...complaint, ...vouchers];
  
  // Sort by numeric timestamp desc; fallback to parsed time; then id
  const sortedNotifications = all.sort((a, b) => {
    const ta = Number.isFinite(a?.ts) ? a.ts : (a?.time ? new Date(a.time).getTime() : 0);
    const tb = Number.isFinite(b?.ts) ? b.ts : (b?.time ? new Date(b.time).getTime() : 0);
    if (tb !== ta) return tb - ta;
    return String(b?.id ?? '').localeCompare(String(a?.id ?? ''));
  });

  console.log('[fetchUnifiedNotifications] Total sorted notifications:', sortedNotifications.length);

  // Cache the result
  notificationCache.set(cacheKey, {
    data: sortedNotifications,
    timestamp: now,
  });

  return sortedNotifications;
}

// Lightweight function to fetch only unread count (for header icon)
export async function fetchUnreadCount() {
  try {
    const res = await API.get("/users/notifications/unread_count/");
    return res.data?.unread_count || 0;
  } catch (error) {
    console.error("[NotificationService] Failed to fetch unread count:", error);
    return 0;
  }
}

// Mark all notifications as read
export async function markAllAsRead(userId) {
  try {
    // Persist client-side read state so UI remembers reads across reloads
    try {
      const cacheKey = `notifications_${userId || 'guest'}`;
      const cached = notificationCache.get(cacheKey);
      const ids = (cached && Array.isArray(cached.data) ? cached.data : [])
        .map((n) => String(n.id)).filter(Boolean);
      // Merge into existing read set
      const set = getReadIds(userId);
      ids.forEach((id) => set.add(String(id)));
      localStorage.setItem(READ_KEY(userId), JSON.stringify([...set]));
      // Invalidate cache so future fetches will be fresh (and backend read flags will be used)
      notificationCache.delete(cacheKey);
      // Notify same-window listeners that read state changed
      try {
        window.dispatchEvent(new Event('notif_read_changed'));
      } catch (e) {
        // ignore
      }
    } catch (e) {
      console.warn('[NotificationService] markAllAsRead local persistence failed', e);
    }

    const res = await API.post("/users/notifications/mark_all_read/");
    console.log("[NotificationService] Marked all as read:", res.data);
    return res.data?.marked_read || 0;
  } catch (error) {
    console.error("[NotificationService] Failed to mark all as read:", error);
    return 0;
  }
}

export default {
  fetchUnifiedNotifications,
  fetchUnreadCount,
  markAllAsRead,
};