export const toNumber = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};

export const formatVND = (value) => {
  const n = Math.round(toNumber(value));
  return n.toLocaleString("vi-VN") + " ₫";
};

export const computeFullRefundAmount = (rec) => {
  if (!rec) return 0;
  const q = toNumber(rec?.quantity || 1);
  const unit = toNumber(rec?.unit_price ?? rec?.discounted_price ?? rec?.product_price ?? 0);
  return q * unit;
};

export const isImageUrl = (url) => {
  if (!url) return false;
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return true;
  if (/\.(mp4|mov|avi|wmv|webm)$/i.test(url)) return false;
  return true;
};

export const pushNotification = (notif) => {
  try {
    const key = "notifications";
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    arr.unshift({ ...notif, id: Date.now(), created_at: new Date().toISOString(), read: false });
    localStorage.setItem(key, JSON.stringify(arr.slice(0, 50)));
    window.dispatchEvent(new Event("notifications_updated"));
  } catch {}
};