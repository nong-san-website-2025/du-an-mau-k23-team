import React, { useState, useEffect, useCallback } from "react";
import { Tabs, message, Tag, Badge } from "antd";
import {
  CarOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
} from "@ant-design/icons";

import API from "../../login_register/services/api";
import GenericOrderTable from "../components/OrderSeller/GenericOrderTable";
import ButtonAction from "../../../components/ButtonAction";

const ORDER_TABS = {
  PENDING: "pending",
  PROCESSING: "processing",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

// Hàm lấy cache an toàn
const getCache = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export default function SellerOrderPage() {
  const [activeTab, setActiveTab] = useState(ORDER_TABS.PENDING);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  // --- 1. STATE CHỨA TOÀN BỘ DỮ LIỆU (CACHE) ---
  const [allOrders, setAllOrders] = useState(() => ({
    [ORDER_TABS.PENDING]: getCache(`ORDER_CACHE_${ORDER_TABS.PENDING}`),
    [ORDER_TABS.PROCESSING]: getCache(`ORDER_CACHE_${ORDER_TABS.PROCESSING}`),
    [ORDER_TABS.DELIVERED]: getCache(`ORDER_CACHE_${ORDER_TABS.DELIVERED}`),
    [ORDER_TABS.CANCELLED]: getCache(`ORDER_CACHE_${ORDER_TABS.CANCELLED}`),
  }));

  const [orderCounts, setOrderCounts] = useState(() => {
    try {
      const saved = localStorage.getItem("ORDER_COUNTS_CACHE");
      return saved
        ? JSON.parse(saved)
        : { pending: 0, processing: 0, delivered: 0, cancelled: 0 };
    } catch {
      return { pending: 0, processing: 0, delivered: 0, cancelled: 0 };
    }
  });

  // Timer tick (cập nhật hiển thị "vừa xong", "1 phút trước")
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // --- 2. FETCH DATA (CHẠY NGẦM) ---
  const fetchOrders = useCallback(
    async (statusKey) => {
      // Chỉ hiện loading nếu chưa có dữ liệu trong cache
      if (!allOrders[statusKey] || allOrders[statusKey].length === 0) {
        setLoading(true);
      }

      let endpoint = "";
      switch (statusKey) {
        case ORDER_TABS.PENDING:
          endpoint = "orders/seller/pending/";
          break;
        case ORDER_TABS.PROCESSING:
          endpoint = "orders/seller/processing/";
          break;
        case ORDER_TABS.DELIVERED:
          endpoint = "orders/seller/complete/";
          break;
        case ORDER_TABS.CANCELLED:
          endpoint = "orders/seller/cancelled/";
          break;
        default:
          endpoint = "orders/seller/pending/";
      }

      try {
        const res = await API.get(endpoint);
        // Backend trả về mảng thì sort, nếu trả về object phân trang (res.data.results) thì cần chỉnh lại
        const rawData = Array.isArray(res.data)
          ? res.data
          : res.data.results || [];
        const sortedData = rawData.sort((a, b) => b.id - a.id);

        setAllOrders((prev) => ({
          ...prev,
          [statusKey]: sortedData,
        }));

        localStorage.setItem(
          `ORDER_CACHE_${statusKey}`,
          JSON.stringify(sortedData)
        );
      } catch (error) {
        console.error("Lỗi fetch:", error);
      } finally {
        setLoading(false);
      }
    },
    [allOrders]
  );

  const fetchOrderCounts = useCallback(async () => {
    try {
      const [pendingRes, processingRes] = await Promise.all([
        API.get("orders/seller/pending/"),
        API.get("orders/seller/processing/"),
      ]);
      const newCounts = {
        pending: Array.isArray(pendingRes.data)
          ? pendingRes.data.length
          : pendingRes.data.count || 0,
        processing: Array.isArray(processingRes.data)
          ? processingRes.data.length
          : processingRes.data.count || 0,
        delivered: 0,
        cancelled: 0,
      };
      setOrderCounts(newCounts);
      localStorage.setItem("ORDER_COUNTS_CACHE", JSON.stringify(newCounts));
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchOrders(activeTab);
    fetchOrderCounts();
  }, [activeTab]);

  // --- ACTION HANDLER ---
  const handleOrderAction = async (id, actionType) => {
    try {
      let endpoint = "";
      switch (actionType) {
        case "approve":
          endpoint = `orders/${id}/seller/approve/`;
          break;
        case "reject":
          endpoint = `orders/${id}/cancel/`;
          break;
        case "complete":
          endpoint = `orders/${id}/seller/complete/`;
          break;
        case "cancel_processing":
          endpoint = `orders/${id}/cancel/`;
          break;
        default:
          return;
      }
      await API.post(endpoint);
      message.success("Thao tác thành công");
      fetchOrders(activeTab);
      fetchOrderCounts();
    } catch (error) {
      message.error("Thao tác thất bại");
    }
  };

  // --- CONFIG COLUMNS ---
  const getTimeTag = (createdAt) => {
    if (!createdAt) return { text: "-", color: "#999" };
    const diffMs = new Date() - new Date(createdAt);
    const diffMins = Math.floor(diffMs / 60000);
    let color =
      diffMins > 60 ? "#ff4d4f" : diffMins > 30 ? "#faad14" : "#52c41a";
    let text =
      diffMins < 60
        ? `${diffMins} phút trước`
        : `${Math.floor(diffMins / 60)} giờ trước`;
    return (
      <Tag
        color="default"
        style={{ color, borderColor: color, fontWeight: 600 }}
      >
        {text}
      </Tag>
    );
  };

  const getExtraColumns = () => {
    if (activeTab === ORDER_TABS.PENDING)
      return [
        {
          title: "Thời gian chờ",
          dataIndex: "created_at",
          width: 140,
          align: "center",
          render: (t) => getTimeTag(t),
        },
      ];
    if (activeTab === ORDER_TABS.DELIVERED)
      return [
        {
          title: "Hoàn tất vào",
          dataIndex: "updated_at",
          width: 140,
          align: "center",
          render: (t) => (
            <span style={{ color: "#666", fontSize: 12 }}>
              {t ? new Date(t).toLocaleDateString("vi-VN") : "-"}
            </span>
          ),
        },
      ];
    if (activeTab === ORDER_TABS.CANCELLED)
      return [
        {
          title: "Ngày hủy",
          dataIndex: "updated_at",
          width: 140,
          align: "center",
          render: (t) => (
            <span style={{ color: "#999", fontSize: 12 }}>
              {t ? new Date(t).toLocaleDateString("vi-VN") : "-"}
            </span>
          ),
        },
      ];
    return [];
  };

  const renderActions = (record) => {
    if (activeTab === ORDER_TABS.PENDING) {
      return (
        <ButtonAction
          record={record}
          actions={[
            {
              actionType: "approve",
              tooltip: "Duyệt",
              icon: <CheckCircleOutlined />,
              confirm: { title: "Duyệt đơn?", okText: "Duyệt" },
              onClick: (r) => handleOrderAction(r.id, "approve"),
            },
            {
              actionType: "reject",
              tooltip: "Từ chối",
              icon: <CloseCircleOutlined />,
              confirm: { title: "Từ chối?", isDanger: true, okText: "Từ chối" },
              onClick: (r) => handleOrderAction(r.id, "reject"),
            },
          ]}
        />
      );
    }
    if (activeTab === ORDER_TABS.PROCESSING) {
      return (
        <ButtonAction
          record={record}
          actions={[
            {
              actionType: "approve",
              tooltip: "Giao xong",
              icon: <CarOutlined />,
              confirm: { title: "Khách đã nhận?", okText: "Hoàn thành" },
              onClick: (r) => handleOrderAction(r.id, "complete"),
              show: record.status !== "shipping",
            },
            {
              actionType: "delete",
              tooltip: "Hủy đơn",
              icon: <StopOutlined />,
              confirm: { title: "Hủy đơn?", isDanger: true },
              onClick: (r) => handleOrderAction(r.id, "cancel_processing"),
            },
          ]}
        />
      );
    }
    return null;
  };

  const tabItems = [
    {
      key: ORDER_TABS.PENDING,
      label: (
        <span className="d-flex align-items-center gap-2">
          <ClockCircleOutlined /> Chờ xác nhận{" "}
          {orderCounts.pending > 0 && (
            <Badge
              count={orderCounts.pending}
              style={{ backgroundColor: "#52c41a", marginLeft: 5 }}
            />
          )}
        </span>
      ),
    },
    {
      key: ORDER_TABS.PROCESSING,
      label: (
        <span>
          <InboxOutlined /> Đang xử lý{" "}
          {orderCounts.processing > 0 && (
            <Badge
              count={orderCounts.processing}
              style={{ backgroundColor: "#1890ff", marginLeft: 5 }}
            />
          )}
        </span>
      ),
    },
    {
      key: ORDER_TABS.DELIVERED,
      label: (
        <span>
          <CheckCircleOutlined /> Đã giao
        </span>
      ),
    },
    {
      key: ORDER_TABS.CANCELLED,
      label: (
        <span>
          <StopOutlined /> Đã hủy
        </span>
      ),
    },
  ];

  const currentTabOrders = allOrders[activeTab] || [];

  return (
    <div
      className="p-4 bg-white rounded-lg shadow-sm"
      style={{ minHeight: "80vh" }}
    >
      <h2
        style={{
          marginBottom: 20,
          fontSize: 24,
          fontWeight: 700,
          color: "#001529",
        }}
      >
        QUẢN LÝ ĐƠN HÀNG
      </h2>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        size="large"
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      <GenericOrderTable
        title={
          activeTab === ORDER_TABS.PENDING
            ? "DANH SÁCH ĐƠN MỚI"
            : activeTab === ORDER_TABS.PROCESSING
              ? "ĐƠN HÀNG ĐANG XỬ LÝ"
              : activeTab === ORDER_TABS.DELIVERED
                ? "ĐƠN HOÀN THÀNH"
                : "ĐƠN ĐÃ HỦY"
        }
        isLoading={loading && currentTabOrders.length === 0}
        data={currentTabOrders}
        refetch={() => {
          fetchOrders(activeTab);
          fetchOrderCounts();
        }}
        extraColumns={getExtraColumns()}
        actionsRenderer={renderActions}
        // --- CẤU HÌNH PHÂN TRANG 10 DÒNG (QUAN TRỌNG) ---
        // Ant Design Table sẽ tự động cắt data thành các trang
        pagination={{
          pageSize: 10, // Mỗi trang 10 dòng
          showSizeChanger: true, // Cho phép đổi thành 20/50 dòng nếu muốn
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (total, range) =>
            `Hiển thị ${range[0]}-${range[1]} của ${total} đơn`,
          position: ["bottomCenter"], // Đặt phân trang ở giữa dưới cùng
        }}
      />
    </div>
  );
}
