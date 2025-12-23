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

export default function SellerOrderPage() {
  const [activeTab, setActiveTab] = useState(ORDER_TABS.PENDING);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [tick, setTick] = useState(0);

  // --- MỚI: State lưu số lượng badge cho từng tab ---
  const [orderCounts, setOrderCounts] = useState({
    pending: 0,
    processing: 0,
    delivered: 0,
    cancelled: 0
  });

  // --- 1. LOGIC TIMER ---
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // --- 2. HÀM LẤY SỐ LƯỢNG (BADGE) ---
  // Hàm này chạy độc lập để lấy số lượng hiển thị lên Tab
  const fetchOrderCounts = useCallback(async () => {
    try {
      // Gọi song song 2 API quan trọng nhất để lấy số lượng
      const [pendingRes, processingRes] = await Promise.all([
        API.get("orders/seller/pending/"),
        API.get("orders/seller/processing/")
      ]);

      setOrderCounts({
        pending: pendingRes.data.length,
        processing: processingRes.data.length,
        // Nếu cần đếm cả đơn đã giao/hủy thì thêm vào đây, nhưng thường chỉ cần 2 cái đầu để notification
        delivered: 0, 
        cancelled: 0
      });
    } catch (error) {
      console.error("Lỗi lấy số lượng đơn:", error);
    }
  }, []);

  // Gọi hàm đếm số lượng ngay khi trang vừa load
  useEffect(() => {
    fetchOrderCounts();
  }, [fetchOrderCounts]);


  // --- 3. HÀM LẤY DỮ LIỆU BẢNG (TABLE) ---
  const fetchOrders = useCallback(async (statusKey) => {
    setLoading(true);
    let endpoint = "";
    switch (statusKey) {
      case ORDER_TABS.PENDING: endpoint = "orders/seller/pending/"; break;
      case ORDER_TABS.PROCESSING: endpoint = "orders/seller/processing/"; break;
      case ORDER_TABS.DELIVERED: endpoint = "orders/seller/complete/"; break;
      case ORDER_TABS.CANCELLED: endpoint = "orders/seller/cancelled/"; break;
      default: endpoint = "orders/seller/pending/";
    }

    try {
      const res = await API.get(endpoint);
      const sortedData = res.data.sort((a, b) => b.id - a.id);
      setOrders(sortedData);
    } catch (error) {
      message.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  // Gọi API bảng mỗi khi chuyển Tab
  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab, fetchOrders]);


  // --- 4. XỬ LÝ HÀNH ĐỘNG ---
  const handleOrderAction = async (id, actionType) => {
    try {
      let endpoint = "";
      let successMsg = "";

      switch (actionType) {
        case "approve":
          endpoint = `orders/${id}/seller/approve/`;
          successMsg = "Đã duyệt đơn hàng thành công!";
          break;
        case "reject":
          endpoint = `orders/${id}/cancel/`;
          successMsg = "Đã từ chối đơn hàng!";
          break;
        case "complete":
          endpoint = `orders/${id}/seller/complete/`;
          successMsg = "Xác nhận giao hàng thành công!";
          break;
        case "cancel_processing":
          endpoint = `orders/${id}/cancel/`;
          successMsg = "Đã hủy đơn hàng!";
          break;
        default: return;
      }

      await API.post(endpoint);
      message.success(successMsg);
      
      // QUAN TRỌNG: Reload cả bảng và cả số lượng Badge
      fetchOrders(activeTab); 
      fetchOrderCounts(); 

    } catch (error) {
      message.error("Thao tác thất bại, vui lòng thử lại!");
    }
  };

  // --- 5. CẤU HÌNH CỘT ---
  const getTimeTag = (createdAt) => {
    if (!createdAt) return { text: "-", color: "#999" };
    const diffMs = new Date() - new Date(createdAt);
    const diffMins = Math.floor(diffMs / 60000);
    
    let color = "#52c41a"; 
    if (diffMins > 30) color = "#faad14"; 
    if (diffMins > 60) color = "#ff4d4f"; 

    let text = diffMins < 60 ? `${diffMins} phút trước` : `${Math.floor(diffMins/60)} giờ trước`;
    return <Tag color="default" style={{ color, borderColor: color, fontWeight: 600 }}>{text}</Tag>;
  };

  const getExtraColumns = () => {
    if (activeTab === ORDER_TABS.PENDING) {
      return [{
        title: "Thời gian chờ",
        dataIndex: "created_at",
        width: 140,
        align: "center",
        render: (t) => getTimeTag(t),
      }];
    }
    if (activeTab === ORDER_TABS.DELIVERED) {
      return [{
        title: "Hoàn tất vào",
        dataIndex: "updated_at",
        width: 140,
        align: "center",
        render: (t) => <span style={{color: '#666', fontSize: 12}}>{t ? new Date(t).toLocaleDateString("vi-VN") : "-"}</span>
      }];
    }
    if (activeTab === ORDER_TABS.CANCELLED) {
      return [{
        title: "Ngày hủy",
        dataIndex: "updated_at",
        width: 140,
        align: "center",
        render: (t) => <span style={{color: '#999', fontSize: 12}}>{t ? new Date(t).toLocaleDateString("vi-VN") : "-"}</span>
      }];
    }
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
              tooltip: "Duyệt đơn này",
              icon: <CheckCircleOutlined />,
              confirm: { title: "Duyệt đơn hàng ngay?", okText: "Duyệt" },
              onClick: (r) => handleOrderAction(r.id, "approve"),
            },
            {
              actionType: "reject",
              tooltip: "Từ chối đơn",
              icon: <CloseCircleOutlined />,
              confirm: { title: "Từ chối phục vụ đơn này?", isDanger: true, okText: "Từ chối" },
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
              tooltip: "Xác nhận đã giao",
              icon: <CarOutlined />,
              confirm: { title: "Xác nhận khách đã nhận hàng?", okText: "Hoàn thành" },
              onClick: (r) => handleOrderAction(r.id, "complete"),
              show: record.status !== 'shipping'
            },
            {
              actionType: "delete",
              tooltip: "Hủy đơn hàng",
              icon: <StopOutlined />,
              confirm: { title: "Hủy đơn đang xử lý?", isDanger: true },
              onClick: (r) => handleOrderAction(r.id, "cancel_processing"),
            },
          ]}
        />
      );
    }
    return null;
  };

  // --- 6. TAB ITEMS (Sử dụng orderCounts thay vì orders.length) ---
  const tabItems = [
    {
      key: ORDER_TABS.PENDING,
      label: (
        <span className="d-flex align-items-center gap-2">
          <ClockCircleOutlined /> 
          Chờ xác nhận
          {/* Luôn hiển thị Badge dựa trên orderCounts */}
          {orderCounts.pending > 0 && (
            <Badge count={orderCounts.pending} style={{ backgroundColor: '#52c41a', marginLeft: 5 }} />
          )}
        </span>
      ),
    },
    {
      key: ORDER_TABS.PROCESSING,
      label: (
        <span>
          <InboxOutlined /> Đang xử lý
          {orderCounts.processing > 0 && (
             <Badge count={orderCounts.processing} style={{ backgroundColor: '#1890ff', marginLeft: 5 }} />
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

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm" style={{ minHeight: '80vh' }}>
      <h2 style={{ marginBottom: 20, fontSize: 24, fontWeight: 700, color: '#001529' }}>
        QUẢN LÝ ĐƠN HÀNG
      </h2>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        type="card"
        size="large"
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      <GenericOrderTable
        title={
            activeTab === ORDER_TABS.PENDING ? "DANH SÁCH ĐƠN MỚI" :
            activeTab === ORDER_TABS.PROCESSING ? "ĐƠN HÀNG ĐANG XỬ LÝ" :
            activeTab === ORDER_TABS.DELIVERED ? "ĐƠN HOÀN THÀNH" : "ĐƠN ĐÃ HỦY"
        }
        isLoading={loading}
        data={orders}
        refetch={() => {
            fetchOrders(activeTab);
            fetchOrderCounts(); // Refresh count khi user reload bảng thủ công
        }}
        extraColumns={getExtraColumns()}
        actionsRenderer={renderActions}
      />
    </div>
  );
}