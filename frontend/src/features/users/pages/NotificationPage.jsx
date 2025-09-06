import React from "react";
import { Bell, CheckCircle2 } from "lucide-react";

const getNotifications = () => {
  let notis = [];
  try {
    notis = JSON.parse(localStorage.getItem("notifications")) || [];
  } catch {
    notis = [];
  }
  return notis;
};

export default function NotificationPage() {
  const notifications = getNotifications();

  const sortedNotifications = [...notifications].sort((a, b) => {
    const getProduct = (noti) => {
      const match =
        noti.detail &&
        noti.detail.match(/Khiếu nại sản phẩm: (.*?)(\.|\n)/);
      return match ? match[1] : "";
    };
    const prodA = getProduct(a).toLowerCase();
    const prodB = getProduct(b).toLowerCase();
    if (prodA < prodB) return -1;
    if (prodA > prodB) return 1;
    return b.id - a.id;
  });

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
                  boxShadow: noti.read
                    ? "none"
                    : "0 2px 10px rgba(22,163,74,0.10)",
                  fontWeight: noti.read ? 400 : 600,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  border: "1px solid #bbf7d0",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#d1fae5")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = noti.read
                    ? "#f0fdf4"
                    : "#e6f4ea")
                }
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
                  {noti.read ? (
                    <CheckCircle2 size={20} color="#16a34a" />
                  ) : (
                    <Bell size={18} color="#16a34a" />
                  )}
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
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {noti.time}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
