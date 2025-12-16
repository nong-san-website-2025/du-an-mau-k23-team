import React, { useEffect, useState, useMemo } from "react";
import { Input, Select, message, Space, Button, Tooltip, Badge } from "antd"; // Thêm Button, Tooltip, Badge
import {
  SearchOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShopOutlined,
  WarningOutlined, // Icon cảnh báo cho Spam
  SafetyCertificateOutlined, // Icon an toàn
} from "@ant-design/icons";
import axios from "axios";
import { useLocation } from "react-router-dom";
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

// --- LOGIC PHÁT HIỆN SPAM (Bạn có thể tùy chỉnh thêm keyword) ---
const SPAM_KEYWORDS = [
  "test",
  "demo",
  "admin",
  "123",
  "abc",
  "xyz",
  "spam",
  "fake",
  "null",
  "undefined",
];
const checkIsSpam = (item) => {
  const name = item.store_name ? item.store_name.toLowerCase() : "";
  const email = item.user_email ? item.user_email.toLowerCase() : "";

  // 1. Check tên cửa hàng quá ngắn
  if (name.length < 3) return true;

  // 2. Check chứa từ khóa rác trong Tên hoặc Email
  const hasSpamKeyword = SPAM_KEYWORDS.some(
    (key) => name.includes(key) || email.includes(key)
  );
  if (hasSpamKeyword) return true;

  // 3. Check email đuôi lạ (Ví dụ logic) - Tùy chọn
  // if (email.endsWith("@tempmail.com")) return true;

  // 4. Check số điện thoại (nếu có field phone)
  // if (item.phone && (item.phone === "0000000000" || item.phone.length < 9)) return true;

  return false;
};

const ApprovalSellersPage = () => {
  const { t } = useTranslation();
  const location = useLocation();

  // --- State ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // State mới cho chế độ lọc Spam
  const [showSpamOnly, setShowSpamOnly] = useState(false);

  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  // --- 1. Logic Stats ---
  const statsItems = useMemo(() => {
    const total = data.length;
    const pending = data.filter((item) => item.status === "pending").length;
    const approved = data.filter((item) => item.status === "approved").length;
    const rejected = data.filter((item) => item.status === "rejected").length;

    return [
      {
        title: t("Tổng hồ sơ"),
        value: total,
        icon: <ShopOutlined />,
        color: "#1890ff",
        onClick: () => {
          setStatusFilter("");
          setShowSpamOnly(false);
        }, // Reset spam filter khi click stats
        style: {
          cursor: "pointer",
          border:
            !showSpamOnly && statusFilter === "" ? "2px solid #1890ff" : "",
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
        style: {
          cursor: "pointer",
          border:
            !showSpamOnly && statusFilter === "pending"
              ? "2px solid #faad14"
              : "",
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
        style: {
          cursor: "pointer",
          border:
            !showSpamOnly && statusFilter === "approved"
              ? "2px solid #52c41a"
              : "",
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
        style: {
          cursor: "pointer",
          border:
            !showSpamOnly && statusFilter === "rejected"
              ? "2px solid #ff4d4f"
              : "",
        },
      },
    ];
  }, [data, t, statusFilter, showSpamOnly]);

  // --- 2. Fetch Data ---
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
      console.error(err);
      message.error(t("approval_sellers.load_failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.newSeller) {
      setData((prev) => [location.state.newSeller, ...prev]);
    }
    fetchSellers();
  }, []);

  // --- 3. FILTER LOGIC (QUAN TRỌNG NHẤT) ---
  const filteredData = data.filter((item) => {
    // A. Lọc theo search
    const matchesSearch =
      item.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_email?.toLowerCase().includes(searchTerm.toLowerCase());

    // B. Lọc theo trạng thái (Dropdown / Stats Click)
    const matchesStatus = statusFilter ? item.status === statusFilter : true;

    // C. Lọc theo chế độ SPAM (Mới)
    // Nếu đang bật showSpamOnly -> Chỉ lấy item thỏa mãn checkIsSpam
    // Nếu tắt -> Lấy tất cả (true)
    const matchesSpam = showSpamOnly ? checkIsSpam(item) : true;

    return matchesSearch && matchesStatus && matchesSpam;
  });

  // Đếm số lượng spam để hiện lên badge
  const spamCount = data.filter(
    (item) =>
      checkIsSpam(item) && (statusFilter ? item.status === statusFilter : true)
  ).length;

  // --- Handlers (Giữ nguyên) ---
  const handleApprove = async (record) => {
    try {
      await api.post(
        `/sellers/${record.id}/approve/`,
        {},
        { headers: getAuthHeaders() }
      );
      message.success(
        t("approval_sellers.approved", { name: record.store_name })
      );
      fetchSellers();
    } catch (err) {
      console.error(err);
      message.error(t("approval_sellers.approve_failed"));
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
      fetchSellers();
    } catch (err) {
      console.error(err);
      message.error(t("Thao tác thất bại"));
    }
  };

  const handleView = (record) => {
    setSelectedSeller(record);
    setDetailVisible(true);
  };

  const handleBulkApprove = async (ids) => {
    /* ...code cũ... */
  };
  const handleBulkReject = async (ids) => {
    // ...code cũ...
    // Lưu ý: Nút này rất tiện để xóa 1 loạt Spam
    try {
      setLoading(true);
      const promises = ids.map((id) =>
        api.post(`/sellers/${id}/reject/`, {}, { headers: getAuthHeaders() })
      );
      await Promise.all(promises);
      message.success(t(`Đã từ chối ${ids.length} cửa hàng`));
      fetchSellers();
    } catch (error) {
      console.error(error);
      message.error(t("Lỗi thao tác"));
    } finally {
      setLoading(false);
    }
  };

  // --- 5. UI Toolbar Cập nhật ---
  const toolbar = (
    <Space>
      {/* Nút lọc Spam/Vi phạm */}
      <Tooltip
        title={
          showSpamOnly
            ? "Tắt bộ lọc spam"
            : "Chỉ hiện các cửa hàng nghi ngờ (Tên lạ, Test, 123...)"
        }
      >
        <Badge count={showSpamOnly ? 0 : spamCount} offset={[-5, 5]}>
          <Button
            type={showSpamOnly ? "primary" : "default"}
            danger={showSpamOnly} // Màu đỏ khi đang bật
            icon={
              showSpamOnly ? <WarningOutlined /> : <SafetyCertificateOutlined />
            }
            onClick={() => setShowSpamOnly(!showSpamOnly)}
            style={{
              backgroundColor: showSpamOnly ? "#ff4d4f" : "white",
              borderColor: showSpamOnly ? "#ff4d4f" : "#d9d9d9",
              color: showSpamOnly ? "white" : "rgba(0, 0, 0, 0.85)",
            }}
          >
            {showSpamOnly ? "Đang lọc rác" : "Lọc rác/Spam"}
          </Button>
        </Badge>
      </Tooltip>

      <Input
        placeholder={t("Tìm kiếm...")}
        prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: 250, borderRadius: 6 }}
        allowClear
      />
      <Select
        placeholder={t("Lọc trạng thái")}
        value={statusFilter || undefined}
        onChange={(value) => {
          setStatusFilter(value || "");
        }}
        style={{ width: 160, borderRadius: 6 }}
        suffixIcon={<FilterOutlined />}
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

      {/* Hiển thị banner cảnh báo khi đang lọc spam */}
      {showSpamOnly && (
        <div
          style={{
            marginTop: 16,
            marginBottom: 8,
            padding: "8px 12px",
            background: "#fff1f0",
            border: "1px solid #ffa39e",
            borderRadius: 4,
            color: "#cf1322",
            display: "flex",
            alignItems: "center",
          }}
        >
          <WarningOutlined style={{ marginRight: 8 }} />
          <span>
            <b>Chế độ lọc rác:</b> Hệ thống đang hiển thị các cửa hàng có tên
            chứa từ khóa: "test", "demo", "123", "admin"... hoặc tên quá ngắn.
            Bạn có thể chọn tất cả và bấm <b>"Từ chối"</b> để dọn dẹp nhanh.
          </span>
          <Button
            size="small"
            type="link"
            onClick={() => setShowSpamOnly(false)}
          >
            Tắt
          </Button>
        </div>
      )}

      {/* Dòng trạng thái bình thường */}
      {!showSpamOnly && (
        <div
          style={{
            marginTop: 16,
            marginBottom: 8,
            fontStyle: "italic",
            color: "#666",
          }}
        >
          {statusFilter === ""}
          {statusFilter === "pending"}
          {statusFilter === "approved"}
          {statusFilter === "rejected"}
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <SellerTable
          data={filteredData}
          loading={loading}
          onApprove={handleApprove}
          onReject={handleReject}
          onView={handleView}
          onBulkApprove={handleBulkApprove}
          onBulkReject={handleBulkReject}
          onRow={(record) => ({ onClick: () => handleView(record) })}
        />
      </div>

      {selectedSeller && (
        <SellerDetailModal
          visible={detailVisible}
          onClose={() => setDetailVisible(false)}
          seller={selectedSeller}
          onApprove={handleApprove}
          onReject={handleReject}
          onActionSuccess={fetchSellers}
        />
      )}
    </AdminPageLayout>
  );
};

export default ApprovalSellersPage;
