import { useState, useCallback, useEffect, useMemo } from "react";

export const useNotificationLogic = (userId, navigate) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unified, setUnified] = useState([]);
  const [dropdownLoaded, setDropdownLoaded] = useState(false);
  const token = localStorage.getItem("token");

  // 1. Helper: Lấy thông báo từ LocalStorage
  const getLocalNotifications = () => {
    try {
      return JSON.parse(localStorage.getItem("notifications")) || [];
    } catch {
      return [];
    }
  };

  // 2. Fetch unread count (Gọi API Django)
  const fetchUnreadCount = useCallback(async () => {
    if (!userId || !token) return;
    try {
      const response = await fetch(`http://localhost:8000/api/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.results || [];
      setUnreadCount(list.filter((n) => !n.is_read).length);
    } catch (e) {
      setUnreadCount(0);
    }
  }, [userId, token]);

  // 3. Fetch Unified Notifications (Heavy) - Sửa để tương thích Django
  const fetchNotifications = useCallback(
    async (force = false) => {
      if (!userId || !token) return [];
      try {
        const response = await fetch(
          `http://localhost:8000/api/notifications/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();
        setUnreadCount(data.unread_count); // Backend trả về ví dụ: { "unread_count": 5 }
        const list = Array.isArray(data) ? data : data.results || [];

        // Đồng bộ hóa các field từ Django sang định dạng UI của bạn
        return list.map((n) => ({
          ...n,
          read: n.is_read, // Django dùng is_read
          time: n.created_at, // Django dùng created_at
        }));
      } catch (e) {
        console.error("Lỗi lấy số lượng thông báo:", e);
        return [];
      }
    },
    [userId, token]
  );

  // 4. Logic làm giàu dữ liệu (Giữ nguyên logic Order của bạn)
  const enrichTopNotifications = useCallback(async (notificationsList) => {
    if (!notificationsList?.length) return notificationsList;
    return notificationsList; // Giữ nguyên hàm fetch order của bạn ở đây
  }, []);

  // --- THAY THẾ SSE BẰNG WEBSOCKET TẠI ĐÂY ---
  useEffect(() => {
    const handleResetCount = () => {
      console.log("Đã nhận tín hiệu: Reset số lượng thông báo về 0");
      setUnreadCount(0);
      setUnified((prev) =>
        prev.map((n) => ({ ...n, read: true, is_read: true }))
      );
    };

    // Đăng ký lắng nghe sự kiện
    window.addEventListener("notificationsUpdated", handleResetCount);

    return () => {
      // Hủy lắng nghe khi component unmount
      window.removeEventListener("notificationsUpdated", handleResetCount);
    };
  }, []);
  const handleNotificationClick = useCallback(
    async (noti) => {
      // 1. Đánh dấu đã đọc cục bộ để UI mượt mà
      setUnified((prev) =>
        prev.map((n) =>
          n.id === noti.id ? { ...n, read: true, is_read: true } : n
        )
      );

      // 2. Logic điều hướng dựa trên metadata hoặc type
      const type = noti.type?.toUpperCase();
      const orderId = noti.metadata?.order_id || noti.order_id; // hỗ trợ cả 2 cách đặt tên

      if (type === "ORDER" && orderId) {
        navigate(`/orders/${orderId}`);
      } else if (type === "WALLET") {
        navigate("/profile/wallet");
      } else if (type === "VOUCHER") {
        navigate("/vouchers");
      }
      // Nếu là thông báo chung, có thể không navigate hoặc về trang thông báo
    },
    [navigate]
  );

  // 2. Cập nhật xử lý WebSocket để nhận diện thêm sự kiện từ Server (nếu có)
  useEffect(() => {
    if (!userId || !token) return;

    const ws = new WebSocket(
      `ws://localhost:8000/ws/updates/${userId}/?token=${token}`
    );

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.event === "new_notification") {
          // 1. Tăng số lượng tin nhắn chưa đọc ở chuông
          setUnreadCount((prev) => prev + 1);

          // 2. Thêm thông báo mới vào đầu danh sách (để hiện ở Dropdown/Page)
          const newNoti = {
            ...payload.data,
            read: false,
            time: payload.data.created_at,
          };
          setUnified((prev) => [newNoti, ...prev]);

          // 3. (Tùy chọn) Hiển thị thông báo trình duyệt hoặc Toast
          console.log("Thông báo mới tự động:", newNoti.title);
        }
      } catch (error) {
        console.error("Lỗi xử lý tin nhắn WS:", error);
      }
    };

    return () => ws.close();
  }, [userId, token]);
  // 5. Actions cho UI
  const handleHover = async () => {
    if (!dropdownLoaded) {
      const list = await fetchNotifications(true);
      const enriched = await enrichTopNotifications(list);
      setUnified(enriched);
      setDropdownLoaded(true);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await fetch(`http://localhost:8000/api/notifications/mark_all_as_read/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnified((prev) =>
        prev.map((n) => ({ ...n, read: true, is_read: true }))
      );
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
    navigate("/notifications");
  };

  const sortedNotifications = useMemo(() => {
    return [...unified].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
  }, [unified]);

  return {
    unreadCount,
    sortedNotifications,
    handleHover,
    handleMarkAllRead,
    handleNotificationClick,
  };
};
