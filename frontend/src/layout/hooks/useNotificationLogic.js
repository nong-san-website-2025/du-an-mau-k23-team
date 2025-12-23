import { useState, useCallback, useEffect, useMemo } from "react";
import { API_CONFIG } from "../../constants/apiConstants";
import { notification } from "antd"; // Import để hiện thông báo

export const useNotificationLogic = (userId, navigate) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unified, setUnified] = useState([]);
  const [dropdownLoaded, setDropdownLoaded] = useState(false);
  const token = localStorage.getItem("token");

  // --- 1. GỌI API LẤY DANH SÁCH ---
  const fetchNotifications = useCallback(async (force = false) => {
    if (!userId || !token) return [];
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Kiểm tra HTTP Status trước khi parse JSON
      if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // Xử lý dữ liệu trả về từ Django Pagination (results) hoặc List
      const list = Array.isArray(data) ? data : data.results || [];
      
      // Update count từ backend hoặc tự đếm
      if (data.unread_count !== undefined) {
          setUnreadCount(data.unread_count);
      } else {
          setUnreadCount(list.filter((n) => !n.is_read).length);
      }

      // Map field cho UI
      const mappedList = list.map((n) => ({
        ...n,
        read: n.is_read, 
        time: n.created_at,
        // Fallback title/message nếu thiếu
        title: n.title || "Thông báo mới",
        message: n.message || "",
      }));

      return mappedList;
    } catch (e) {
      console.error("Lỗi lấy thông báo:", e);
      return [];
    }
  }, [userId, token]);

  // --- 2. XỬ LÝ WEBSOCKET ---
  useEffect(() => {
    if (!userId || !token) return;

    // Load dữ liệu ban đầu
    fetchNotifications(true).then((list) => {
      setUnified(list);
    });

    const wsProtocol = API_CONFIG.SERVER_URL.startsWith("https") ? "wss" : "ws";
    const wsBaseUrl = API_CONFIG.SERVER_URL.replace(/^https?:\/\//, "");
    
    // Đảm bảo URL này khớp với routing.py
    const wsUrl = `${wsProtocol}://${wsBaseUrl}/ws/updates/${userId}/?token=${token}`;
    
    console.log("Đang kết nối WS:", wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log("✅ WebSocket Connected!");
    
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("📩 WS Message:", payload);

        // Trường hợp 1: Có thông báo mới
        if (payload.event === "new_notification") {
          setUnreadCount((prev) => prev + 1);
          
          const newNoti = {
            ...payload.data,
            read: false,
            is_read: false,
            time: payload.data.created_at,
          };
          
          setUnified((prev) => [newNoti, ...prev]);
          
          // Hiện popup góc màn hình (Optional)
          notification.info({
              message: newNoti.title,
              description: newNoti.message,
              placement: 'bottomRight',
              duration: 3
          });
        }
        
        // Trường hợp 2: Đã đọc tất cả (từ thiết bị khác hoặc tab khác)
        else if (payload.event === "mark_all_read") {
            setUnreadCount(0);
            setUnified((prev) => prev.map(n => ({...n, read: true, is_read: true})));
        }

      } catch (error) {
        console.error("Lỗi xử lý tin nhắn WS:", error);
      }
    };

    ws.onerror = (e) => console.error("WS Error:", e);

    return () => ws.close();
  }, [userId, token, fetchNotifications]); // Thêm fetchNotifications vào deps

  // --- 3. CÁC HÀM ACTION ---
  const handleHover = async () => {
    if (!dropdownLoaded) {
      const list = await fetchNotifications(true);
      setUnified(list);
      setDropdownLoaded(true);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    // Optimistic Update (Cập nhật UI trước cho mượt)
    setUnreadCount(0);
    setUnified((prev) => prev.map((n) => ({ ...n, read: true, is_read: true })));

    try {
      await fetch(`${API_CONFIG.BASE_URL}/notifications/mark_all_as_read/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error("Lỗi mark all read:", e);
      // Rollback nếu cần (nhưng thường ít khi lỗi này quan trọng)
    }
    // navigate("/notifications"); // Tùy chọn: có muốn chuyển trang ko
  };

  const handleNotificationClick = useCallback(async (noti) => {
      // Đánh dấu đã đọc cục bộ
      setUnified((prev) =>
        prev.map((n) =>
          n.id === noti.id ? { ...n, read: true, is_read: true } : n
        )
      );
      
      // Gọi API đánh dấu đã đọc (lầm thầm)
      if (!noti.is_read) {
          fetch(`${API_CONFIG.BASE_URL}/notifications/${noti.id}/mark_as_read/`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
          }).catch(console.error);
      }

      // Điều hướng
      const type = noti.type?.toUpperCase();
      const orderId = noti.metadata?.order_id || noti.order_id;

      if (type === "ORDER" && orderId) {
        navigate(`/user/purchase/order/${orderId}`); // Check lại đường dẫn đơn hàng của bạn
      } else if (type === "WALLET") {
        navigate("/profile/wallet");
      } else {
        navigate("/notifications");
      }
    },
    [navigate, token]
  );

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