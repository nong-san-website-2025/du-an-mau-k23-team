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
        const list = Array.isArray(data) ? data : data.results || [];

        // Đồng bộ hóa các field từ Django sang định dạng UI của bạn
        return list.map((n) => ({
          ...n,
          read: n.is_read, // Django dùng is_read
          time: n.created_at, // Django dùng created_at
        }));
      } catch (e) {
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
    if (!userId || !token) return;

    // Khởi tạo danh sách ban đầu
    fetchNotifications(true).then((list) => {
      setUnified(list);
      setUnreadCount(list.filter((n) => !n.read).length);
    });

    // Kết nối WebSocket
    const ws = new WebSocket(
      `ws://localhost:8000/ws/updates/${userId}/?token=${token}`
    );

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("🔔 Đã nhận thông báo mới:", payload);

        // Kiểm tra đúng tên event mà Django gửi qua
        if (payload.event === "new_notification") {
          // 1. Tăng số lượng chưa đọc trên chuông
          setUnreadCount((prev) => prev + 1);

          // 2. Thêm thông báo mới vào đầu danh sách hiển thị
          // 'payload.data' là object thông báo từ Serializer của Django
          setUnified((prev) => [payload.data, ...prev]);

          // 3. (Tùy chọn) Có thể phát âm thanh 'ting' ở đây
          // new Audio('/assets/notification-sound.mp3').play();
        }
      } catch (error) {
        console.error("Lỗi xử lý tin nhắn WS:", error);
      }
    };
    return () => ws.close();
  }, [userId, token, fetchNotifications, enrichTopNotifications]);

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

  return { unreadCount, sortedNotifications, handleHover, handleMarkAllRead };
};
