import React, { useEffect, useState, useMemo,  useRef, useCallback } from "react";
import { Input, message } from "antd";
import {
  CheckCircleOutlined,
  LockOutlined,
  RiseOutlined,
  ShopOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from "react-i18next";

// Components
import AdminPageLayout from "../../components/AdminPageLayout";
import SellerTable from "../../components/SellerAdmin/SellerTable";
import SellerDetailModal from "../../components/SellerAdmin/SellerDetailModal";
import StatsSection from "../../components/common/StatsSection";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

const ActiveLockedSellersPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [filterType, setFilterType] = useState("all");

  // --- 1. LOGIC REAL-TIME (WEBSOCKET) ---
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const wsHost = process.env.REACT_APP_WS_URL || "localhost:8000";
    const wsUrl = `ws://${wsHost}/ws/sellers/business/?token=${token}`;

    // Chỉ khởi tạo nếu socket chưa tồn tại hoặc đã đóng hoàn toàn
    if (
      !socketRef.current ||
      socketRef.current.readyState === WebSocket.CLOSED
    ) {
      console.log("🚀 Khởi tạo kết nối Business WS...");
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("✅ Business WebSocket Connected");
      };

      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const { action, data: sellerData } = msg;

        setData((prevData) => {
          // Logic xử lý cập nhật (giữ nguyên logic của bạn nhưng bọc trong functional update)
          switch (action) {
            case "CREATED":
              if (["active", "locked"].includes(sellerData.status)) {
                return [{ ...sellerData, isNew: true }, ...prevData];
              }
              return prevData;
            case "UPDATED":
              if (!["active", "locked"].includes(sellerData.status)) {
                return prevData.filter((s) => s.id !== sellerData.id);
              }
              return prevData.map((s) =>
                s.id === sellerData.id ? { ...s, ...sellerData } : s
              );
            case "DELETED":
              return prevData.filter((s) => s.id !== sellerData.id);
            default:
              return prevData;
          }
        });
      };

      socket.onerror = (err) => {
        console.error("❌ Business WebSocket Error:", err);
      };

      socket.onclose = (e) => {
        console.log("ℹ️ Business WebSocket disconnected. Code:", e.code);
      };

      socketRef.current = socket;
    }

    // 2. Cẩn thận với hàm cleanup
    return () => {
      // Chỉ đóng socket khi component thực sự bị hủy bỏ (Unmount)
      // Nếu bạn thấy vẫn bị đóng/mở liên tục do StrictMode, có thể tạm comment dòng dưới
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.close();
      }
    };
  }, []);

  // --- 2. LOGIC TÍNH TOÁN STATS (Tự động cập nhật khi data thay đổi) ---
  const statsItems = useMemo(() => {
    const totalSellers = data.length;
    const activeSellers = data.filter(
      (item) => item.status === "active"
    ).length;
    const lockedSellers = data.filter(
      (item) => item.status === "locked"
    ).length;

    const newSellersThisMonth = data.filter((item) => {
      if (!item.created_at) return false;
      const createdDate = new Date(item.created_at);
      const now = new Date();
      return (
        createdDate.getMonth() === now.getMonth() &&
        createdDate.getFullYear() === now.getFullYear()
      );
    }).length;

    return [
      {
        title: t("Tổng cửa hàng"),
        value: totalSellers,
        icon: <ShopOutlined />,
        color: "#1890ff",
        onClick: () => setFilterType("all"),
        style: {
          cursor: "pointer",
          border:
            filterType === "all"
              ? "2px solid #1890ff"
              : "2px solid transparent",
        },
      },
      {
        title: t("Đang hoạt động"),
        value: activeSellers,
        icon: <CheckCircleOutlined />,
        color: "#52c41a",
        onClick: () => setFilterType("active"),
        style: {
          cursor: "pointer",
          border:
            filterType === "active"
              ? "2px solid #52c41a"
              : "2px solid transparent",
        },
      },
      {
        title: t("Tạm ngưng"),
        value: lockedSellers,
        icon: <LockOutlined />,
        color: "#faad14",
        onClick: () => setFilterType("locked"),
        style: {
          cursor: "pointer",
          border:
            filterType === "locked"
              ? "2px solid #faad14"
              : "2px solid transparent",
        },
      },
      {
        title: t("Mới tháng này"),
        value: newSellersThisMonth,
        icon: <RiseOutlined />,
        color: "#722ed1",
        onClick: () => setFilterType("new_month"),
        style: {
          cursor: "pointer",
          border:
            filterType === "new_month"
              ? "2px solid #722ed1"
              : "2px solid transparent",
        },
      },
    ];
  }, [data, t, filterType]);

  // --- 3. FETCH DATA BAN ĐẦU ---
  const fetchSellers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sellers/group/business", {
        headers: getAuthHeaders(),
      });
      const filtered = res.data.filter((item) =>
        ["active", "locked"].includes(item.status)
      );
      setData(
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      );
    } catch (err) {
      message.error(t("Không thể tải danh sách cửa hàng"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  // --- 4. FILTER DATA (Search + Stats Click) ---
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user_email?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesType = true;
      if (filterType === "active") matchesType = item.status === "active";
      else if (filterType === "locked") matchesType = item.status === "locked";
      else if (filterType === "new_month") {
        const createdDate = new Date(item.created_at);
        const now = new Date();
        matchesType =
          createdDate.getMonth() === now.getMonth() &&
          createdDate.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesType;
    });
  }, [data, searchTerm, filterType]);

  // --- 5. HANDLERS (Manual actions) ---
  const handleLock = async (record) => {
    try {
      const res = await api.post(
        `/sellers/${record.id}/toggle-lock/`,
        {},
        { headers: getAuthHeaders() }
      );
      // Cập nhật State cục bộ ngay lập tức (Real-time sẽ update lại nếu cần)
      setData((prev) =>
        prev.map((s) =>
          s.id === record.id ? { ...s, status: res.data.status } : s
        )
      );
      message.success(t("Cập nhật trạng thái thành công"));
    } catch (err) {
      message.error(t("Thao tác thất bại"));
    }
  };

  const handleBulkLock = async (ids) => {
    try {
      setLoading(true);
      await api.post(
        `/sellers/bulk-lock/`,
        { ids },
        { headers: getAuthHeaders() }
      );
      fetchSellers(); // Load lại để đồng bộ chính xác nhất
      message.success(t("Đã cập nhật hàng loạt"));
    } catch (error) {
      message.error(t("Lỗi khóa hàng loạt"));
    } finally {
      setLoading(false);
    }
  };

  const toolbar = (
    <Input
      placeholder={t("Tìm kiếm tên cửa hàng, email...")}
      prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      style={{ width: 300, borderRadius: 6 }}
      allowClear
    />
  );

  return (
    <AdminPageLayout title={t("QUẢN LÝ CỬA HÀNG")} extra={toolbar}>
      <StatsSection items={statsItems} loading={loading} />

      <div style={{ marginTop: 16 }}>
        <SellerTable
          data={filteredData}
          loading={loading}
          onView={(record) => {
            setSelectedSeller(record);
            setModalVisible(true);
          }}
          onLock={handleLock}
          onBulkLock={handleBulkLock}
          onRow={(record) => ({
            onClick: () => {
              setSelectedSeller(record);
              setModalVisible(true);
            },
          })}
        />
      </div>

      {selectedSeller && (
        <SellerDetailModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          seller={selectedSeller}
          onLock={handleLock}
        />
      )}
    </AdminPageLayout>
  );
};

export default ActiveLockedSellersPage;
