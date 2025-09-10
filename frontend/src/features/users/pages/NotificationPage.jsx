import React, { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import useUserProfile from "../services/useUserProfile";
import axiosInstance from "../../admin/services/axiosInstance";
import axios from "axios";

export default function NotificationPage() {
  const profile = useUserProfile();
  const [complaints, setComplaints] = useState([]);
  const userId = profile?.id;

  // Fetch complaints from API and keep only current user's
  useEffect(() => {
    let mounted = true;
    const fetchComplaints = async () => {
      if (!userId) return;
      try {
        // Fetch all pages if paginated
        let all = [];
        let url = `/complaints/`;
        while (url) {
          const res = url.startsWith("http")
            ? await axios.get(url, { headers: axiosInstance.defaults.headers.common })
            : await axiosInstance.get(url);
          let pageData = [];
          if (Array.isArray(res.data)) {
            pageData = res.data;
            url = null; // not paginated
          } else if (res.data && Array.isArray(res.data.results)) {
            pageData = res.data.results;
            url = res.data.next || null; // absolute next URL
          } else {
            pageData = [];
            url = null;
          }
          all = all.concat(pageData);
        }

        const mine = all.filter(
          (c) => c.user === userId || c.user_id === userId || c.user?.id === userId
        );
        if (mounted) setComplaints(mine);
      } catch (e) {
        if (mounted) setComplaints([]);
      }
    };
    fetchComplaints();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Derive notifications from complaints status
  const myNotifications = useMemo(() => {
    if (!Array.isArray(complaints)) return [];
    return complaints
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

        let thumbnail = null;
        const media = c.media_urls || c.media || [];
        if (Array.isArray(media) && media.length > 0) {
          const img = media.find((url) => /\.(jpg|jpeg|png|gif)$/i.test(url));
          thumbnail = img || media[0];
        }

        return {
          id: c.id,
          message: status === "resolved" ? "Khiếu nại của bạn đã được xử lý!" : "Khiếu nại của bạn đã bị từ chối!",
          detail: detailLines.join("\n"),
          time: c.updated_at ? new Date(c.updated_at).toLocaleString() : new Date().toLocaleString(),
          read: false,
          userId,
          thumbnail,
        };
      });
  }, [complaints, userId]);

  const sortedNotifications = useMemo(() => {
    const getProduct = (noti) => {
      const match = noti.detail && noti.detail.match(/Khiếu nại sản phẩm: (.*?)(\.|\n)/);
      return match ? match[1] : "";
    };
    return [...myNotifications].sort((a, b) => {
      const prodA = getProduct(a).toLowerCase();
      const prodB = getProduct(b).toLowerCase();
      if (prodA < prodB) return -1;
      if (prodA > prodB) return 1;
      return (b.id || 0) - (a.id || 0);
    });
  }, [myNotifications]);

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 4px 20px rgba(22,163,74,0.08)",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "linear-gradient(90deg,#e0f7ef,#e6f4ea)",
          padding: "16px 24px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Bell size={26} color="#16a34a" />
        <h2
          style={{
            color: "#16a34a",
            fontWeight: 700,
            fontSize: 20,
            margin: 0,
          }}
        >
          Thông báo
        </h2>
      </div>

      {/* Danh sách thông báo */}
      <div style={{ padding: 20 }}>
        {sortedNotifications.length === 0 ? (
          <div
            style={{
              color: "#6b7280",
              textAlign: "center",
              padding: 32,
              fontSize: 15,
            }}
          >
            Không có thông báo nào.
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {sortedNotifications.map((noti) => (
              <li
                key={noti.id}
                style={{
                  background: noti.read ? "#f0fdf4" : "#e6f4ea",
                  color: "#166534",
                  borderRadius: 14,
                  marginBottom: 14,
                  padding: "16px 18px",
                  boxShadow: noti.read ? "none" : "0 2px 10px rgba(22,163,74,0.10)",
                  fontWeight: noti.read ? 400 : 600,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  border: "1px solid #bbf7d0",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#d1fae5")}
                onMouseOut={(e) => (e.currentTarget.style.background = noti.read ? "#f0fdf4" : "#e6f4ea")}
              >
                {/* Icon */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: noti.read ? "#e0f2fe" : "#bbf7d0",
                    flexShrink: 0,
                  }}
                >
                  {noti.read ? <CheckCircle2 size={20} color="#16a34a" /> : <Bell size={18} color="#16a34a" />}
                </div>

                {/* Nội dung */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: noti.read ? 500 : 700,
                      marginBottom: 4,
                      color: "#166534",
                    }}
                  >
                    {noti.message}
                  </div>
                  {noti.detail && (
                    <div
                      style={{
                        fontSize: 14,
                        color: "#166534",
                        marginBottom: 6,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {noti.detail}
                    </div>
                  )}
                  {noti.thumbnail && (
                    <img
                      src={noti.thumbnail}
                      alt="thumbnail"
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 8,
                        marginTop: 6,
                        marginBottom: 6,
                        border: "1px solid #bbf7d0",
                        background: "#fff",
                      }}
                    />
                  )}
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{noti.time}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}