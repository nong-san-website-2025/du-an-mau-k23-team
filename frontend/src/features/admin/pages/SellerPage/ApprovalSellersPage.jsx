// src/features/admin/pages/Seller/ApprovalSellersPage.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Input,
  Select,
  message,
  Space,
  Button,
  Tooltip,
  Badge,
  Card,
  Row,
  Col,
  DatePicker,
  Modal,
} from "antd";
import {
  SearchOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShopOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

// Components
import AdminPageLayout from "../../components/AdminPageLayout";
import SellerTable from "../../components/SellerAdmin/SellerTable";
import SellerDetailModal from "../../components/SellerAdmin/SellerDetailModal";
import StatsSection from "../../components/common/StatsSection";

dayjs.extend(isBetween);
const { Option } = Select;
const { RangePicker } = DatePicker;

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

  // --- STATE ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  // [UPDATED] Using 'timeFilter' state for the dropdown instead of 'quickFilter' radio
  const [timeFilter, setTimeFilter] = useState("all");
  const [showSpamOnly, setShowSpamOnly] = useState(false);

  // Selection & Modal
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // --- 1. REF WEBSOCKET ---
  const socketRef = useRef(null);

  // --- 2. FETCH DATA ---
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
      setSelectedRowKeys([]);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  // --- 3. LOGIC WEBSOCKET ---
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
                  setData((curr) =>
                    curr.map((i) =>
                      i.id === sellerData.id ? { ...i, isNew: false } : i
                    )
                  );
                }, 8000);
                return [newItem, ...prevData];
              }
              return prevData;
            case "UPDATED":
              if (["active", "locked"].includes(sellerData.status))
                return prevData.filter((i) => i.id !== sellerData.id);
              return prevData.map((i) =>
                i.id === sellerData.id ? { ...i, ...sellerData } : i
              );
            case "DELETED":
              return prevData.filter((i) => i.id !== sellerData.id);
            default:
              return prevData;
          }
        });
      };
      socketRef.current = socket;
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  // --- 4. FILTERS ---
  // [UPDATED] Unified handler for time dropdown change
  const handleTimeChange = (val) => {
    setTimeFilter(val);
    const today = dayjs();

    switch (val) {
      case "all":
        setDateRange(null);
        break;
      case "today":
        setDateRange([today.startOf("day"), today.endOf("day")]);
        break;
      case "week":
        // 7 days ago
        setDateRange([
          today.subtract(6, "day").startOf("day"),
          today.endOf("day"),
        ]);
        break;
      case "month":
        // 30 days ago
        setDateRange([
          today.subtract(29, "day").startOf("day"),
          today.endOf("day"),
        ]);
        break;
      default:
        // 'custom': do not automatically set dateRange
        break;
    }
  };

  // [UPDATED] Unified handler for RangePicker change
  const handleRangePickerChange = (dates) => {
    if (dates) {
      setDateRange([dates[0].startOf("day"), dates[1].endOf("day")]);
      setTimeFilter("custom");
    } else {
      setDateRange(null);
      setTimeFilter("all");
    }
  };

  // [UPDATED] Clear filters handler
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateRange(null);
    setTimeFilter("all");
    setShowSpamOnly(false);
  };

  const filteredData = useMemo(() => {
    const s = searchTerm.normalize("NFC").toLowerCase().trim();
    return data.filter((item) => {
      // 1. Lọc theo Tab (Status)
      if (statusFilter !== "all" && item.status !== statusFilter) return false;

      // 2. Lọc theo Search (Tên hoặc Email)
      const searchStr = (item.store_name || "") + (item.user_email || "");
      if (!searchStr.toLowerCase().includes(s)) return false;

      // 3. Lọc theo Ngày (Date Range)
      if (dateRange && dateRange[0] && dateRange[1]) {
        const createdDate = dayjs(item.created_at);
        if (!createdDate.isValid()) return false;
        if (!createdDate.isBetween(dateRange[0], dateRange[1], null, "[]"))
          return false;
      }

      // 4. Lọc theo Spam checkbox
      if (showSpamOnly && !checkIsSpam(item)) return false;

      return true;
    });
  }, [data, searchTerm, statusFilter, dateRange, showSpamOnly]);

  const statsItems = useMemo(() => {
    const total = data.length;
    const pending = data.filter((i) => i.status === "pending").length;
    const approved = data.filter((i) => i.status === "approved").length;
    const rejected = data.filter((i) => i.status === "rejected").length;

    return [
      {
        title: t("Tất cả"), // Đổi tên cho giống Tab tổng
        value: total,
        icon: <ShopOutlined />,
        color: "#1890ff",
        // Active khi đang chọn tất cả
        active: statusFilter === "all",
        onClick: () => setStatusFilter("all"),
      },
      {
        title: t("Đang chờ duyệt"),
        value: pending,
        icon: <ClockCircleOutlined />,
        color: "#faad14",
        // Active khi đang lọc pending
        active: statusFilter === "pending",
        onClick: () => setStatusFilter("pending"),
      },
      {
        title: t("Đã phê duyệt"),
        value: approved,
        icon: <CheckCircleOutlined />,
        color: "#52c41a",
        // Active khi đang lọc approved
        active: statusFilter === "approved",
        onClick: () => setStatusFilter("approved"),
      },
      {
        title: t("Đã từ chối"),
        value: rejected,
        icon: <CloseCircleOutlined />,
        color: "#ff4d4f",
        // Active khi đang lọc rejected
        active: statusFilter === "rejected",
        onClick: () => setStatusFilter("rejected"),
      },
    ];
  }, [data, t, statusFilter]);

  const spamCount = useMemo(
    () => data.filter((i) => checkIsSpam(i)).length,
    [data]
  );

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      message.warning("Không có dữ liệu");
      return;
    }
    const formattedData = filteredData.map((s) => ({
      ID: s.id,
      "Tên cửa hàng": s.store_name,
      Email: s.user_email,
      SĐT: s.phone,
      "Trạng thái": s.status,
      "Ngày đăng ký": dayjs(s.created_at).format("DD/MM/YYYY HH:mm"),
    }));
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DuyetCuaHang");
    XLSX.writeFile(workbook, `DuyetCuaHang_${dayjs().format("DDMMYYYY")}.xlsx`);
    message.success("Xuất Excel thành công!");
  };

  // --- 6. ACTIONS ---
  // [UPDATED] Reload handler
  const handleReload = () => {
    // 1. Reset Filters
    handleClearFilters();
    setSelectedRowKeys([]); // Uncheck items

    // 2. Fetch Data
    setLoading(true);
    fetchSellers().then(() => {
      message.success("Đã làm mới và đặt lại bộ lọc");
    });
  };

  const handleApprove = async (record) => {
    try {
      await api.post(
        `/sellers/${record.id}/approve/`,
        {},
        { headers: getAuthHeaders() }
      );
      message.success(`Đã duyệt: ${record.store_name}`);
      fetchSellers();
    } catch (err) {
      message.error("Lỗi duyệt hồ sơ");
    }
  };

  const handleReject = async (record) => {
    try {
      await api.post(
        `/sellers/${record.id}/reject/`,
        { reason: "Từ chối bởi admin" },
        { headers: getAuthHeaders() }
      );
      message.success("Đã từ chối hồ sơ.");
      fetchSellers();
    } catch (err) {
      message.error("Lỗi thao tác");
    }
  };

  // --- BULK ACTIONS ---
  const pendingSellersSelected = useMemo(
    () =>
      data.filter(
        (s) => selectedRowKeys.includes(s.id) && s.status === "pending"
      ),
    [data, selectedRowKeys]
  );

  const handleBulkApprove = () => {
    if (pendingSellersSelected.length === 0) return;
    Modal.confirm({
      title: `Duyệt ${pendingSellersSelected.length} hồ sơ đã chọn?`,
      content: "Các cửa hàng này sẽ được kích hoạt.",
      okText: "Duyệt tất cả",
      okType: "primary",
      cancelText: "Hủy",
      onOk: async () => {
        setLoading(true);
        try {
          await Promise.all(
            pendingSellersSelected.map((s) =>
              api.post(
                `/sellers/${s.id}/approve/`,
                {},
                { headers: getAuthHeaders() }
              )
            )
          );
          message.success("Đã duyệt thành công.");
          fetchSellers();
        } catch (err) {
          message.error("Lỗi khi duyệt hàng loạt.");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleBulkReject = () => {
    if (pendingSellersSelected.length === 0) return;
    Modal.confirm({
      title: `Từ chối ${pendingSellersSelected.length} hồ sơ đã chọn?`,
      content: "Hành động này sẽ từ chối tất cả hồ sơ đang chọn.",
      okText: "Từ chối tất cả",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        setLoading(true);
        try {
          await Promise.all(
            pendingSellersSelected.map((s) =>
              api.post(
                `/sellers/${s.id}/reject/`,
                { reason: "Từ chối hàng loạt" },
                { headers: getAuthHeaders() }
              )
            )
          );
          message.success("Đã từ chối thành công.");
          fetchSellers();
        } catch (err) {
          message.error("Lỗi khi từ chối hàng loạt.");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <AdminPageLayout title={t("DUYỆT CỬA HÀNG")}>
      <div style={{ marginBottom: 24 }}>
        <StatsSection items={statsItems} loading={loading} />
      </div>
      <Card
        bodyStyle={{ padding: "20px" }}
        style={{ marginBottom: 24, borderRadius: 8 }}
      >
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          {/* FILTER COLUMN [UPDATED] */}
          <Col xs={24} xl={16}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Space wrap size={12} align="center">
                <Input
                  placeholder={t("Tìm kiếm tên, email...")}
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 220 }}
                  allowClear
                />

                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ minWidth: 140 }}
                  options={[
                    { value: "all", label: "Tất cả trạng thái" },
                    { value: "pending", label: "Chờ duyệt" },
                    { value: "approved", label: "Đã duyệt" },
                    { value: "rejected", label: "Từ chối" },
                  ]}
                />

                <Tooltip title={showSpamOnly ? "Tắt lọc rác" : "Hiện spam"}>
                  <Badge count={showSpamOnly ? 0 : spamCount} offset={[-5, 5]}>
                    <Button
                      type={showSpamOnly ? "primary" : "default"}
                      danger={showSpamOnly}
                      icon={
                        showSpamOnly ? (
                          <WarningOutlined />
                        ) : (
                          <SafetyCertificateOutlined />
                        )
                      }
                      onClick={() => setShowSpamOnly(!showSpamOnly)}
                    >
                      {showSpamOnly ? "Đang lọc rác" : "Check Spam"}
                    </Button>
                  </Badge>
                </Tooltip>

                {/* [NEW] Time Filter Dropdown */}
                <Select
                  value={timeFilter}
                  onChange={handleTimeChange}
                  style={{ width: 130 }}
                >
                  <Option value="all">Toàn bộ</Option>
                  <Option value="today">Hôm nay</Option>
                  <Option value="week">7 ngày qua</Option>
                  <Option value="month">30 ngày qua</Option>
                  <Option value="custom">Tùy chọn</Option>
                </Select>

                <RangePicker
                  value={dateRange}
                  onChange={handleRangePickerChange}
                  format="DD/MM/YYYY"
                  placeholder={["Từ ngày", "Đến ngày"]}
                  style={{ width: 240 }}
                />
              </Space>
            </Space>
          </Col>

          {/* ACTION COLUMN */}
          <Col xs={24} xl={8} style={{ textAlign: "right" }}>
            <Space>
              {pendingSellersSelected.length > 0 && (
                <>
                  <Button
                    type="primary"
                    style={{
                      backgroundColor: "#52c41a",
                      borderColor: "#52c41a",
                    }}
                    icon={<CheckOutlined />}
                    onClick={handleBulkApprove}
                  >
                    Duyệt ({pendingSellersSelected.length})
                  </Button>
                  <Button
                    type="primary"
                    danger
                    icon={<CloseOutlined />}
                    onClick={handleBulkReject}
                  >
                    Từ chối ({pendingSellersSelected.length})
                  </Button>
                </>
              )}
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReload}
                loading={loading}
                title="Làm mới và xóa bộ lọc"
              >
                Làm mới
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
                Xuất Excel
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {showSpamOnly && (
        <div
          style={{
            marginBottom: 16,
            padding: "8px 12px",
            background: "#fff1f0",
            border: "1px solid #ffa39e",
            borderRadius: 4,
            color: "#cf1322",
          }}
        >
          <WarningOutlined style={{ marginRight: 8 }} /> <b>Chế độ lọc rác:</b>{" "}
          Hệ thống đang hiển thị các cửa hàng nghi ngờ dựa trên từ khóa.
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <SellerTable
          data={filteredData}
          loading={loading}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          onApprove={handleApprove}
          onReject={handleReject}
          // Not passing onSetPending or onLock to hide undo and lock buttons
          onView={(record) => {
            setSelectedSeller(record);
            setDetailVisible(true);
          }}
          onRow={(record) => ({
            onClick: () => {
              setSelectedSeller(record);
              setDetailVisible(true);
            },
          })}
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
