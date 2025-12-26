import React, { useState, useEffect, useCallback } from "react";
import { Tabs, message, Tag, Badge } from "antd";
import {
  CarOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  ContainerOutlined,
} from "@ant-design/icons";

import API from "../../login_register/services/api";
import GenericOrderTable from "../components/OrderSeller/GenericOrderTable";
import ButtonAction from "../../../components/ButtonAction";

const ORDER_TABS = {
  ALL: "all",
  PENDING: "pending",
  PROCESSING: "processing",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

const getCache = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export default function SellerOrderPage() {
  const [activeTab, setActiveTab] = useState(ORDER_TABS.ALL);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  // --- 1. STATE & CACHE ---
  const [allOrders, setAllOrders] = useState(() => ({
    [ORDER_TABS.ALL]: getCache(`ORDER_CACHE_${ORDER_TABS.ALL}`),
    [ORDER_TABS.PENDING]: getCache(`ORDER_CACHE_${ORDER_TABS.PENDING}`),
    [ORDER_TABS.PROCESSING]: getCache(`ORDER_CACHE_${ORDER_TABS.PROCESSING}`),
    [ORDER_TABS.DELIVERED]: getCache(`ORDER_CACHE_${ORDER_TABS.DELIVERED}`),
    [ORDER_TABS.CANCELLED]: getCache(`ORDER_CACHE_${ORDER_TABS.CANCELLED}`),
  }));

  const [orderCounts, setOrderCounts] = useState(() => {
    const saved = localStorage.getItem("ORDER_COUNTS_CACHE");
    return saved ? JSON.parse(saved) : { all: 0, pending: 0, processing: 0, delivered: 0, cancelled: 0 };
  });

  // Cập nhật thời gian hiển thị mỗi phút
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // --- 2. API CALLS ---
  const fetchOrderCounts = useCallback(async () => {
    try {
      const [allRes, pendingRes, processingRes] = await Promise.all([
        API.get("orders/seller/all/"),
        API.get("orders/seller/pending/"),
        API.get("orders/seller/processing/"),
      ]);

      const getLen = (res) => (Array.isArray(res.data) ? res.data.length : res.data.count || 0);

      const newCounts = {
        all: getLen(allRes),
        pending: getLen(pendingRes),
        processing: getLen(processingRes),
        delivered: 0, // Cập nhật nếu backend hỗ trợ endpoint riêng
        cancelled: 0,
      };
      setOrderCounts(newCounts);
      localStorage.setItem("ORDER_COUNTS_CACHE", JSON.stringify(newCounts));
    } catch (e) {
      console.error("Lỗi đếm số lượng:", e);
    }
  }, []);

  const fetchOrders = useCallback(async (statusKey) => {
    // Chỉ hiện loading nếu cache trống
    if (!allOrders[statusKey] || allOrders[statusKey].length === 0) {
      setLoading(true);
    }

    let endpoint = "";
    switch (statusKey) {
      case ORDER_TABS.ALL: endpoint = "orders/seller/all/"; break;
      case ORDER_TABS.PENDING: endpoint = "orders/seller/pending/"; break;
      case ORDER_TABS.PROCESSING: endpoint = "orders/seller/processing/"; break;
      case ORDER_TABS.DELIVERED: endpoint = "orders/seller/complete/"; break;
      case ORDER_TABS.CANCELLED: endpoint = "orders/seller/cancelled/"; break;
      default: endpoint = "orders/seller/all/";
    }

    try {
      const res = await API.get(endpoint);
      const rawData = Array.isArray(res.data) ? res.data : res.data.results || [];
      const sortedData = rawData.sort((a, b) => b.id - a.id);

      setAllOrders((prev) => ({ ...prev, [statusKey]: sortedData }));
      localStorage.setItem(`ORDER_CACHE_${statusKey}`, JSON.stringify(sortedData));
    } catch (error) {
      message.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [allOrders]);

  useEffect(() => {
    fetchOrders(activeTab);
    fetchOrderCounts();
  }, [activeTab]);

  // --- 3. HANDLERS ---
  const handleOrderAction = async (id, actionType) => {
    try {
      let endpoint = "";
      switch (actionType) {
        case "approve": endpoint = `orders/${id}/seller/approve/`; break;
        case "reject": endpoint = `orders/${id}/cancel/`; break;
        case "complete": endpoint = `orders/${id}/seller/complete/`; break;
        case "cancel_processing": endpoint = `orders/${id}/cancel/`; break;
        default: return;
      }
      await API.post(endpoint);
      message.success("Thao tác thành công");
      fetchOrders(activeTab);
      fetchOrderCounts();
    } catch (error) {
      message.error("Thao tác thất bại");
    }
  };

  // --- 4. COLUMNS CONFIG ---
  const getTimeTag = (createdAt) => {
    if (!createdAt) return <Tag>-</Tag>;
    const diffMins = Math.floor((new Date() - new Date(createdAt)) / 60000);
    const color = diffMins > 60 ? "#ff4d4f" : diffMins > 30 ? "#faad14" : "#52c41a";
    const text = diffMins < 60 ? `${diffMins} phút trước` : `${Math.floor(diffMins / 60)} giờ trước`;
    return <Tag color="default" style={{ color, borderColor: color, fontWeight: 600 }}>{text}</Tag>;
  };

  const getExtraColumns = () => {
    if (activeTab === ORDER_TABS.ALL) {
      return [{
        title: "Trạng thái",
        dataIndex: "status",
        width: 140,
        align: "center",
        render: (status) => {
          const statusMap = {
            pending: { text: "Chờ xác nhận", color: "orange" },
            processing: { text: "Đang xử lý", color: "blue" },
            shipping: { text: "Đang giao", color: "cyan" },
            delivered: { text: "Đã giao", color: "green" },
            completed: { text: "Hoàn thành", color: "green" },
            cancelled: { text: "Đã hủy", color: "red" },
          };
          const info = statusMap[status] || { text: status, color: "default" };
          return <Tag color={info.color}>{info.text.toUpperCase()}</Tag>;
        },
      }];
    }
    if (activeTab === ORDER_TABS.PENDING) {
      return [{ title: "Chờ", dataIndex: "created_at", width: 140, align: "center", render: getTimeTag }];
    }
    if (activeTab === ORDER_TABS.DELIVERED || activeTab === ORDER_TABS.CANCELLED) {
      return [{
        title: activeTab === ORDER_TABS.DELIVERED ? "Hoàn tất" : "Ngày hủy",
        dataIndex: "updated_at",
        width: 140,
        align: "center",
        render: (t) => <span style={{ color: "#999", fontSize: 12 }}>{t ? new Date(t).toLocaleDateString("vi-VN") : "-"}</span>
      }];
    }
    return [];
  };

  const renderActions = (record) => {
    if (activeTab === ORDER_TABS.ALL) return null;

    if (activeTab === ORDER_TABS.PENDING) {
      return (
        <ButtonAction
          record={record}
          actions={[
            { actionType: "approve", tooltip: "Duyệt", icon: <CheckCircleOutlined />, confirm: { title: "Duyệt đơn?" }, onClick: (r) => handleOrderAction(r.id, "approve") },
            { actionType: "reject", tooltip: "Từ chối", icon: <CloseCircleOutlined />, confirm: { title: "Từ chối?", isDanger: true }, onClick: (r) => handleOrderAction(r.id, "reject") },
          ]}
        />
      );
    }
    if (activeTab === ORDER_TABS.PROCESSING) {
      return (
        <ButtonAction
          record={record}
          actions={[
            { actionType: "approve", tooltip: "Giao xong", icon: <CarOutlined />, confirm: { title: "Hoàn thành đơn?" }, onClick: (r) => handleOrderAction(r.id, "complete") },
            { actionType: "delete", tooltip: "Hủy đơn", icon: <StopOutlined />, confirm: { title: "Hủy đơn?", isDanger: true }, onClick: (r) => handleOrderAction(r.id, "cancel_processing") },
          ]}
        />
      );
    }
    return null;
  };

  const tabItems = [
    { key: ORDER_TABS.ALL, label: <span><ContainerOutlined /> Tất cả ({orderCounts.all})</span> },
    { key: ORDER_TABS.PENDING, label: <span><ClockCircleOutlined /> Chờ xác nhận <Badge count={orderCounts.pending} style={{ backgroundColor: "#52c41a" }} /></span> },
    { key: ORDER_TABS.PROCESSING, label: <span><InboxOutlined /> Đang xử lý <Badge count={orderCounts.processing} style={{ backgroundColor: "#1890ff" }} /></span> },
    { key: ORDER_TABS.DELIVERED, label: <span><CheckCircleOutlined /> Đã giao</span> },
    { key: ORDER_TABS.CANCELLED, label: <span><StopOutlined /> Đã hủy</span> },
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm" style={{ minHeight: "80vh" }}>
      <h2 style={{ marginBottom: 20, fontSize: 24, fontWeight: 700, color: "#001529" }}>
        QUẢN LÝ ĐƠN HÀNG
      </h2>

      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" size="large" items={tabItems} />

      <GenericOrderTable
        title={tabItems.find(t => t.key === activeTab)?.label}
        isLoading={loading}
        data={allOrders[activeTab] || []}
        refetch={() => { fetchOrders(activeTab); fetchOrderCounts(); }}
        extraColumns={getExtraColumns()}
        actionsRenderer={renderActions}
        pagination={{
          pageSize: 10,
          showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} của ${total} đơn`,
          position: ["bottomCenter"],
        }}
      />
    </div>
  );
}