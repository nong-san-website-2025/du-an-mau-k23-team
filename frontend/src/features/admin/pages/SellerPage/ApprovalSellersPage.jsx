import React, { useEffect, useState, useMemo, useRef } from "react";
import { Input, Select, message, Space, Button, Tooltip, Badge } from "antd";
import {
  SearchOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShopOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from "react-i18next";

// Components
import AdminPageLayout from "../../components/AdminPageLayout";
import SellerTable from "../../components/SellerAdmin/SellerTable";
import SellerDetailModal from "../../components/SellerAdmin/SellerDetailModal";
import StatsSection from "../../components/common/StatsSection";

const { Option } = Select;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

// --- LOGIC PHÁT HIỆN SPAM ---
const SPAM_KEYWORDS = [
  "test",
  "demo",
  "admin",
  "123",
  "abc",
  "xyz",
  "spam",
  "fake",
];
const checkIsSpam = (item) => {
  const name = item.store_name ? item.store_name.toLowerCase() : "";
  const email = item.user_email ? item.user_email.toLowerCase() : "";
  if (name.length < 3) return true;
  return SPAM_KEYWORDS.some((key) => name.includes(key) || email.includes(key));
};

const ApprovalSellersPage = () => {
  const { t } = useTranslation();

  // --- State ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showSpamOnly, setShowSpamOnly] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  // --- 1. REF QUẢN LÝ WEBSOCKET (NGĂN CHẶN RE-CONNECT VÔ TỘI VẠ) ---
  const socketRef = useRef(null);

  // --- 2. FETCH DATA BAN ĐẦU (CHẠY 1 LẦN DUY NHẤT) ---
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        setLoading(true);
        const res = await api.get("/sellers/", { headers: getAuthHeaders() });
        const filtered = res.data
          .filter((item) =>
            ["pending", "approved", "rejected"].includes(item.status)
          )
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setData(filtered);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, []); // Mảng rỗng đảm bảo chỉ chạy khi mount trang

  // --- 3. LOGIC WEBSOCKET (CHẠY 1 LẦN DUY NHẤT) ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    let wsHost = process.env.REACT_APP_WS_URL || "localhost:8000";
    wsHost = wsHost.replace(/^https?:\/\//, "");

    const wsUrl = `${protocol}://${wsHost}/ws/sellers/approval/?token=${token}`;

    if (
      !socketRef.current ||
      socketRef.current.readyState === WebSocket.CLOSED
    ) {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => console.log("✅ Approval WebSocket Connected");

      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const { action, data: sellerData } = msg;

        setData((prevData) => {
          switch (action) {
            case "CREATED":
              if (
                ["pending", "approved", "rejected"].includes(sellerData.status)
              ) {
                const newItem = { ...sellerData, isNew: true };
                setTimeout(() => {
                  setData((current) =>
                    current.map((item) =>
                      item.id === sellerData.id
                        ? { ...item, isNew: false }
                        : item
                    )
                  );
                }, 8000);
                return [newItem, ...prevData];
              }
              return prevData;
            case "UPDATED":
              return prevData.map((item) =>
                item.id === sellerData.id ? { ...item, ...sellerData } : item
              );
            case "DELETED":
              return prevData.filter((item) => item.id !== sellerData.id);
            default:
              return prevData;
          }
        });
      };

      socket.onclose = () => console.log("ℹ️ WebSocket Disconnected");
      socketRef.current = socket;
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  // --- 4. TỐI ƯU HÓA TÍNH TOÁN (DÙNG USEMEMO) ---
  const statsItems = useMemo(() => {
    const pending = data.filter((i) => i.status === "pending").length;
    const approved = data.filter((i) => i.status === "approved").length;
    const rejected = data.filter((i) => i.status === "rejected").length;

    return [
      {
        title: t("Tổng hồ sơ"),
        value: data.length,
        icon: <ShopOutlined />,
        color: "#1890ff",
        onClick: () => {
          setStatusFilter("");
          setShowSpamOnly(false);
        },
      },
      {
        title: t("Đang chờ duyệt"),
        value: pending,
        icon: <ClockCircleOutlined />,
        color: "#faad14",
        onClick: () => {
          setStatusFilter("pending");
          setShowSpamOnly(false);
        },
      },
      {
        title: t("Đã phê duyệt"),
        value: approved,
        icon: <CheckCircleOutlined />,
        color: "#52c41a",
        onClick: () => {
          setStatusFilter("approved");
          setShowSpamOnly(false);
        },
      },
      {
        title: t("Đã từ chối"),
        value: rejected,
        icon: <CloseCircleOutlined />,
        color: "#ff4d4f",
        onClick: () => {
          setStatusFilter("rejected");
          setShowSpamOnly(false);
        },
      },
    ];
  }, [data, t]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = (item.store_name + item.user_email)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter ? item.status === statusFilter : true;
      const matchesSpam = showSpamOnly ? checkIsSpam(item) : true;
      return matchesSearch && matchesStatus && matchesSpam;
    });
  }, [data, searchTerm, statusFilter, showSpamOnly]);

  const spamCount = useMemo(
    () => data.filter((i) => checkIsSpam(i)).length,
    [data]
  );

  // --- 5. ACTIONS ---
  const handleApprove = async (record) => {
    try {
      await api.post(
        `/sellers/${record.id}/approve/`,
        {},
        { headers: getAuthHeaders() }
      );
      message.success(`Đã duyệt: ${record.store_name}`);
    } catch (err) {
      message.error("Lỗi duyệt hồ sơ");
    }
  };

  const handleReject = async (record) => {
    try {
      await api.post(
        `/sellers/${record.id}/reject/`,
        {},
        { headers: getAuthHeaders() }
      );
      message.success(t("Đã từ chối cửa hàng"));
    } catch (err) {
      message.error(t("Thao tác thất bại"));
    }
  };

  // --- TOOLBAR UI ---
  const toolbar = (
    <Space>
      <Tooltip
        title={showSpamOnly ? "Tắt lọc rác" : "Hiện các cửa hàng nghi ngờ spam"}
      >
        <Badge count={showSpamOnly ? 0 : spamCount} offset={[-5, 5]}>
          <Button
            type={showSpamOnly ? "primary" : "default"}
            danger={showSpamOnly}
            icon={
              showSpamOnly ? <WarningOutlined /> : <SafetyCertificateOutlined />
            }
            onClick={() => setShowSpamOnly(!showSpamOnly)}
          >
            {showSpamOnly ? "Đang lọc rác" : "Lọc rác/Spam"}
          </Button>
        </Badge>
      </Tooltip>
      <Input
        placeholder={t("Tìm kiếm...")}
        prefix={<SearchOutlined />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: 250 }}
        allowClear
      />
      <Select
        placeholder={t("Trạng thái")}
        value={statusFilter || undefined}
        onChange={(v) => setStatusFilter(v || "")}
        style={{ width: 150 }}
        allowClear
      >
        <Option value="pending">{t("Chờ duyệt")}</Option>
        <Option value="approved">{t("Đã phê duyệt")}</Option>
        <Option value="rejected">{t("Từ chối")}</Option>
      </Select>
    </Space>
  );

  return (
    <AdminPageLayout title={t("DUYỆT CỬA HÀNG")} extra={toolbar}>
      <StatsSection items={statsItems} loading={loading} />

      {showSpamOnly && (
        <div
          style={{
            marginTop: 16,
            padding: "8px 12px",
            background: "#fff1f0",
            border: "1px solid #ffa39e",
            borderRadius: 4,
            color: "#cf1322",
          }}
        >
          <WarningOutlined style={{ marginRight: 8 }} />
          <b>Chế độ lọc rác:</b> Hệ thống đang hiển thị các cửa hàng nghi ngờ
          dựa trên từ khóa.
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <SellerTable
          data={filteredData}
          loading={loading}
          onApprove={handleApprove}
          onReject={handleReject}
          onView={(record) => {
            setSelectedSeller(record);
            setDetailVisible(true);
          }}
        />
      </div>

      {selectedSeller && (
        <SellerDetailModal
          visible={detailVisible}
          onClose={() => setDetailVisible(false)}
          seller={selectedSeller}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </AdminPageLayout>
  );
};

export default ApprovalSellersPage;
