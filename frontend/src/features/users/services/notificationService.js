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
export function markAsRead(userId, ids) {
  try {
    const set = getReadIds(userId);
    (ids || []).forEach((id) => id && set.add(String(id)));
    localStorage.setItem(READ_KEY(userId), JSON.stringify([...set]));
  } catch {}
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

// Orders -> notifications (based on current status)
async function fetchOrderNotifications() {
  try {
    // Try to fetch recent orders; frontend API auto-scopes to current user
    const res = await API.get("orders/?ordering=-created_at");
    const orders = Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : [];
    return orders
      .filter((o) => ["pending", "shipping", "success", "completed", "cancelled", "delivered", "out_for_delivery"].includes((o.status || "").toLowerCase()))
      .map((o) => {
        const status = (o.status || "").toLowerCase();
        const map = {
          pending: "Chờ xác nhận",
          shipping: "Chờ nhận hàng",
          success: "Đã thanh toán",
          completed: "Đã nhận hàng",
          delivered: "Đã giao hàng",
          out_for_delivery: "Đang giao",
          cancelled: "Đã huỷ",
        };
        const label = map[status] || status;
        const firstItem = (o.items || [])[0] || {};
        const message = `Đơn hàng #${o.id} chuyển sang trạng thái: ${label}`;
        const detail = [
          `Tổng tiền: ${formatVND(o.total_price)}`,
        ]
          .filter(Boolean)
          .join("\n");
        let thumbnail = null;
        if (firstItem.product_image) {
          thumbnail = firstItem.product_image.startsWith("http")
            ? firstItem.product_image
            : `http://localhost:8000${firstItem.product_image.startsWith("/") ? "" : "/media/"}${firstItem.product_image}`;
        }
        return {
          id: `order-${o.id}-${status}`,
          type: "order",
          message,
          detail,
          time: safeToDateString(o.updated_at || o.created_at),
          ts: (() => { try { const t = new Date(o.updated_at || o.created_at).getTime(); return Number.isFinite(t) ? t : 0; } catch { return 0; } })(),
          read: false,
          userId: o.user || undefined,
          thumbnail,
        };
      });
  } catch {
    return [];
  }
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
      };
    });
  } catch {
    return [];
  }
}

export async function fetchUnifiedNotifications(userId) {
  const cacheKey = `notifications_${userId || 'guest'}`;
  const now = Date.now();

  // Check cache
  if (notificationCache.has(cacheKey)) {
    const cached = notificationCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  // Fetch fresh data
  const [complaint, orders, wallet, vouchers, reviewReplies] = await Promise.all([
    fetchComplaintNotifications(userId),
    fetchOrderNotifications(),
    // fetchWalletNotifications(),
    fetchVoucherNotifications(),
    fetchReviewReplyNotifications(userId),
  ]);

  const all = [...complaint, ...orders, ...wallet, ...vouchers, ...reviewReplies];
  // Sort by numeric timestamp desc; fallback to parsed time; then id
  const sortedNotifications = all.sort((a, b) => {
    const ta = Number.isFinite(a?.ts) ? a.ts : (a?.time ? new Date(a.time).getTime() : 0);
    const tb = Number.isFinite(b?.ts) ? b.ts : (b?.time ? new Date(b.time).getTime() : 0);
    if (tb !== ta) return tb - ta;
    return String(b?.id ?? '').localeCompare(String(a?.id ?? ''));
  });

  // Cache the result
  notificationCache.set(cacheKey, {
    data: sortedNotifications,
    timestamp: now,
  });

  return sortedNotifications;
}

export default {
  fetchUnifiedNotifications,
};