// src/features/admin/pages/Seller/ActiveLockedSellersPage.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Input,
  message,
  Row,
  Col,
  Space,
  Card,
  DatePicker,
  Select,
  Button,
  Modal,
} from "antd";
import {
  CheckCircleOutlined,
  LockOutlined,
  ShopOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  CalendarOutlined,
  StopOutlined,
  UnlockOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

// Components (Đảm bảo đường dẫn đúng với cấu trúc dự án của bạn)
import AdminPageLayout from "../../components/AdminPageLayout";
import SellerTable from "../../components/SellerAdmin/SellerTable";
import SellerDetailModal from "../../components/SellerAdmin/SellerDetailModal";
import StatsSection from "../../components/common/StatsSection";

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Option } = Select;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

const ActiveLockedSellersPage = () => {
  const { t } = useTranslation();

  // --- STATE ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [quickFilter, setQuickFilter] = useState("all");

  // Selection & Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // --- 1. LOGIC REAL-TIME (WEBSOCKET) ---
  const socketRef = useRef(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    // Lưu ý: Cần đảm bảo URL WebSocket backend chính xác
    const wsHost = process.env.REACT_APP_WS_URL || "localhost:8000";
    const wsUrl = `ws://${wsHost}/ws/sellers/business/?token=${token}`;

    if (
      !socketRef.current ||
      socketRef.current.readyState === WebSocket.CLOSED
    ) {
      const socket = new WebSocket(wsUrl);
      socket.onopen = () => console.log("✅ Business WebSocket Connected");
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { action, data: sellerData } = msg;
          setData((prevData) => {
            switch (action) {
              case "CREATED":
                if (["active", "locked"].includes(sellerData.status))
                  return [{ ...sellerData, isNew: true }, ...prevData];
                return prevData;
              case "UPDATED":
                if (!["active", "locked"].includes(sellerData.status))
                  return prevData.filter((s) => s.id !== sellerData.id);
                return prevData.map((s) =>
                  s.id === sellerData.id ? { ...s, ...sellerData } : s
                );
              case "DELETED":
                return prevData.filter((s) => s.id !== sellerData.id);
              default:
                return prevData;
            }
          });
        } catch (e) {
          console.error("WS Error", e);
        }
      };
      socketRef.current = socket;
    }
    return () => {
      if (socketRef.current?.readyState === WebSocket.OPEN)
        socketRef.current.close();
    };
  }, []);

  // --- 2. FETCH DATA ---
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

  // --- 3. FILTER LOGIC (DROPDOWN) ---
  const handleQuickFilterChange = (val) => {
    setQuickFilter(val);
    const now = dayjs();

    switch (val) {
      case "all":
        setDateRange(null);
        break;
      case "today":
        setDateRange([now.startOf("day"), now.endOf("day")]);
        break;
      case "7d":
        setDateRange([now.subtract(6, "day").startOf("day"), now.endOf("day")]);
        break;
      case "30d":
        setDateRange([
          now.subtract(29, "day").startOf("day"),
          now.endOf("day"),
        ]);
        break;
      default:
        break;
    }
  };

  const handleRangePickerChange = (dates) => {
    if (dates) {
      setDateRange([dates[0].startOf("day"), dates[1].endOf("day")]);
      setQuickFilter("custom");
    } else {
      setDateRange(null);
      setQuickFilter("all");
    }
  };

  const filteredData = useMemo(() => {
    const s = searchTerm.normalize("NFC").toLowerCase().trim();
    return data.filter((item) => {
      // 1. Status Filter
      if (statusFilter !== "all" && item.status !== statusFilter) return false;

      // 2. Search Filter
      const matchesSearch =
        s === "" ||
        (item.store_name || "").toLowerCase().includes(s) ||
        (item.user_email || "").toLowerCase().includes(s);
      if (!matchesSearch) return false;

      // 3. Date Filter
      if (dateRange && dateRange[0] && dateRange[1]) {
        const createdDate = dayjs(item.created_at);
        if (!createdDate.isValid()) return false;
        // So sánh bao gồm cả đầu và cuối
        if (!createdDate.isBetween(dateRange[0], dateRange[1], null, "[]"))
          return false;
      }

      return true;
    });
  }, [data, searchTerm, statusFilter, dateRange]);

  // --- 4. STATS ---
  const statsItems = useMemo(() => {
    const total = data.length;
    const active = data.filter((item) => item.status === "active").length;
    const locked = data.filter((item) => item.status === "locked").length;
    const newMonth = data.filter((item) => {
      if (!item.created_at) return false;
      const d = dayjs(item.created_at);
      const n = dayjs();
      return d.month() === n.month() && d.year() === n.year();
    }).length;

    // Helper function để tạo style chung
    const getStyle = (isActive, color) => ({
      cursor: "pointer",
      transition: "all 0.3s ease",
      // Hiệu ứng nảy lên khi active
      transform: isActive ? "translateY(-5px)" : "none",
      // Viền màu khi active
      border: isActive ? `1px solid ${color}` : "1px solid transparent",
      // Đổ bóng màu khi active
      boxShadow: isActive
        ? `0 4px 12px ${color}40` // Màu bóng mờ theo màu icon
        : "0 2px 8px rgba(0,0,0,0.05)",
    });

    return [
      {
        title: t("Tổng cửa hàng"),
        value: total,
        icon: <ShopOutlined />,
        color: "#1890ff",
        // Active khi không filter status và không filter nhanh (trừ month)
        active: statusFilter === "all" && quickFilter !== "month",
        onClick: () => {
          setSearchTerm("");
          setStatusFilter("all");
          setDateRange(null);
          setQuickFilter("all");
        },
        get style() {
          return getStyle(this.active, this.color);
        },
      },
      {
        title: t("Đang hoạt động"),
        value: active,
        icon: <CheckCircleOutlined />,
        color: "#52c41a",
        active: statusFilter === "active",
        onClick: () => setStatusFilter("active"),
        get style() {
          return getStyle(this.active, this.color);
        },
      },
      {
        title: t("Tạm ngưng"),
        value: locked,
        icon: <LockOutlined />,
        color: "#faad14",
        active: statusFilter === "locked",
        onClick: () => setStatusFilter("locked"),
        get style() {
          return getStyle(this.active, this.color);
        },
      },
      {
        title: t("Mới tháng này"),
        value: newMonth,
        icon: <RiseOutlined />,
        color: "#722ed1",
        active: quickFilter === "month",
        onClick: () => {
          const s = dayjs().startOf("month");
          const e = dayjs().endOf("month");
          setDateRange([s, e]);
          setQuickFilter("month");
          setStatusFilter("all");
        },
        get style() {
          return getStyle(this.active, this.color);
        },
      },
    ];
  }, [data, t, statusFilter, quickFilter]);

  // --- 5. EXPORT ---
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      message.warning("Không có dữ liệu");
      return;
    }
    const formattedData = filteredData.map((s) => ({
      ID: s.id,
      "Tên cửa hàng": s.store_name,
      "Chủ sở hữu": s.owner_username,
      Email: s.user_email,
      SĐT: s.phone,
      "Trạng thái": s.status === "active" ? "Đang hoạt động" : "Đã khóa",
      "Ngày đăng ký": dayjs(s.created_at).format("DD/MM/YYYY"),
    }));
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CuaHang");
    XLSX.writeFile(workbook, `DS_CuaHang_${dayjs().format("DDMMYYYY")}.xlsx`);
    message.success("Xuất Excel thành công!");
  };

  // --- 6. ACTIONS ---

  // [SỬA] Reload: Reset toàn bộ filter về mặc định và tải lại
  const handleReload = () => {
    // 1. Reset Filters
    setSearchTerm("");
    setStatusFilter("all");
    setDateRange(null);
    setQuickFilter("all");
    setSelectedRowKeys([]); // Bỏ chọn các dòng

    // 2. Fetch Data
    setLoading(true);
    fetchSellers().then(() => {
      message.success("Đã làm mới toàn bộ dữ liệu");
    });
  };

  // Bulk Actions
  const activeSellersSelected = useMemo(
    () =>
      data.filter(
        (s) => selectedRowKeys.includes(s.id) && s.status === "active"
      ),
    [data, selectedRowKeys]
  );
  const lockedSellersSelected = useMemo(
    () =>
      data.filter(
        (s) => selectedRowKeys.includes(s.id) && s.status === "locked"
      ),
    [data, selectedRowKeys]
  );

  const handleBulkLock = () => {
    if (activeSellersSelected.length === 0) return;
    Modal.confirm({
      title: `Khóa tất cả ${activeSellersSelected.length} cửa hàng đã chọn?`,
      content: (
        <div>
          <p>
            Hành động này sẽ tạm ngưng hoạt động kinh doanh của các cửa hàng
            được chọn.
          </p>
          <p style={{ color: "#888", fontSize: 12 }}>
            * Các cửa hàng đã bị khóa trước đó sẽ không bị ảnh hưởng.
          </p>
        </div>
      ),
      okText: "Khóa tất cả",
      okType: "danger",
      cancelText: "Hủy",
      icon: <StopOutlined style={{ color: "red" }} />,
      onOk: async () => {
        setLoading(true);
        try {
          await api.post(
            `/sellers/bulk-lock/`,
            { ids: activeSellersSelected.map((s) => s.id) },
            { headers: getAuthHeaders() }
          );
          fetchSellers();
          message.success(t("Đã khóa tất cả cửa hàng được chọn"));
          setSelectedRowKeys([]);
        } catch (error) {
          message.error(t("Lỗi khóa hàng loạt"));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleBulkUnlock = () => {
    if (lockedSellersSelected.length === 0) return;
    Modal.confirm({
      title: `Mở khóa tất cả ${lockedSellersSelected.length} cửa hàng đã chọn?`,
      content: "Các cửa hàng này sẽ được phép hoạt động trở lại.",
      okText: "Mở khóa tất cả",
      okType: "primary",
      cancelText: "Hủy",
      icon: <UnlockOutlined style={{ color: "#52c41a" }} />,
      onOk: async () => {
        setLoading(true);
        try {
          await Promise.all(
            lockedSellersSelected.map((s) =>
              api.post(
                `/sellers/${s.id}/toggle-lock/`,
                {},
                { headers: getAuthHeaders() }
              )
            )
          );
          fetchSellers();
          message.success(t("Đã mở khóa tất cả cửa hàng được chọn"));
          setSelectedRowKeys([]);
        } catch (error) {
          message.error(t("Lỗi mở khóa hàng loạt"));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleLock = async (record) => {
    try {
      const res = await api.post(
        `/sellers/${record.id}/toggle-lock/`,
        {},
        { headers: getAuthHeaders() }
      );
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

  return (
    <AdminPageLayout title={t("QUẢN LÝ CỬA HÀNG")}>
      <div style={{ marginBottom: 24 }}>
        <StatsSection items={statsItems} loading={loading} />
      </div>

      <Card
        bodyStyle={{ padding: "20px" }}
        style={{ marginBottom: 24, borderRadius: 8 }}
      >
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          {/* CỘT BỘ LỌC (ĐÃ SỬA DROPDOWN) */}
          <Col xs={24} xl={14}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Space wrap size={12}>
                <Input
                  placeholder={t("Tìm tên, email...")}
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 220 }}
                  allowClear
                />

                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ minWidth: 150 }}
                  options={[
                    { value: "all", label: "Tất cả trạng thái" },
                    { value: "active", label: "Đang hoạt động" },
                    { value: "locked", label: "Tạm ngưng" },
                  ]}
                />

                {/* [MỚI] Dropdown chọn thời gian */}
                <Select
                  value={quickFilter}
                  onChange={handleQuickFilterChange}
                  style={{ width: 140 }}
                >
                  <Option value="all">Toàn bộ</Option>
                  <Option value="today">Hôm nay</Option>
                  <Option value="7d">7 ngày qua</Option>
                  <Option value="30d">30 ngày qua</Option>
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

          {/* CỘT HÀNH ĐỘNG */}
          <Col xs={24} xl={10} style={{ textAlign: "right" }}>
            <Space>
              {activeSellersSelected.length > 0 && (
                <Button
                  type="primary"
                  danger
                  icon={<StopOutlined />}
                  onClick={handleBulkLock}
                  style={{ fontWeight: 500 }}
                >
                  Khóa ({activeSellersSelected.length})
                </Button>
              )}

              {lockedSellersSelected.length > 0 && (
                <Button
                  type="primary"
                  icon={<UnlockOutlined />}
                  onClick={handleBulkUnlock}
                  style={{
                    backgroundColor: "#52c41a",
                    borderColor: "#52c41a",
                    fontWeight: 500,
                  }}
                >
                  Mở khóa ({lockedSellersSelected.length})
                </Button>
              )}

              <Button
                icon={<ReloadOutlined />}
                onClick={handleReload}
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

      <div style={{ marginTop: 16 }}>
        <SellerTable
          data={filteredData}
          loading={loading}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          onView={(record) => {
            setSelectedSeller(record);
            setModalVisible(true);
          }}
          onLock={handleLock}
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
