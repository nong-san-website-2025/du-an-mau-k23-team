// components/UserAdmin/UserDetailRow/UserDetailRow.jsx
// Component wrapper chính - Quản lý tất cả 8 tabs
import React, { useState, useCallback } from "react";
import { Drawer, Tabs, Button, Space } from "antd";
import { X } from "lucide-react";
import UserEditForm from "../../UserEditForm";
import { useUserData } from "../../hooks/useUserData";

// Import tất cả tab components
import BasicInfoTab from "./tabs/BasicInfoTab";
import BehaviorTab from "./tabs/BehaviorTab";
import ViolationsTab from "./tabs/ViolationsTab";
import OrdersTab from "./tabs/OrdersTab";
import ActivityTab from "./tabs/ActivityTab";
import PaymentTab from "./tabs/PaymentTab";
import MembershipTab from "./tabs/MembershipTab";
import TechnicalTab from "./tabs/TechnicalTab";

export default function UserDetailRow({ visible, onClose, user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  // Custom hook - Quản lý tất cả data fetching
  const {
    behaviorStats,
    loadingStats,
    fetchBehaviorStats,
    violations,
    loadingViolations,
    fetchViolationsData,
    orders,
    loadingOrders,
    fetchOrdersData,
    activities,
    loadingActivities,
    fetchActivitiesData,
    payments,
    loadingPayments,
    fetchPaymentsData,
    technicalInfo,
    loadingTechnical,
    fetchTechnicalData,
  } = useUserData(user?.id, visible);

  // Memoize fetch functions để tránh thay đổi dependencies
  const memoFetchBehavior = useCallback(() => {
    fetchBehaviorStats();
  }, [fetchBehaviorStats]);
  const memoFetchViolations = useCallback(() => {
    fetchViolationsData();
  }, [fetchViolationsData]);
  const memoFetchOrders = useCallback(() => {
    fetchOrdersData();
  }, [fetchOrdersData]);
  const memoFetchActivities = useCallback(() => {
    fetchActivitiesData();
  }, [fetchActivitiesData]);
  const memoFetchPayments = useCallback(() => {
    fetchPaymentsData();
  }, [fetchPaymentsData]);
  const memoFetchTechnical = useCallback(() => {
    fetchTechnicalData();
  }, [fetchTechnicalData]);

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleEditSave = (updatedUser) => {
    setIsEditing(false);
    // Có thể refresh dữ liệu ở đây nếu cần
  };

  if (isEditing) {
    return (
      <Drawer
        title={`Sửa ${user?.full_name || user?.username}`}
        placement="right"
        onClose={handleEditCancel}
        open={visible && isEditing}
        width={Math.min(1200, window.innerWidth)}
        bodyStyle={{ padding: 0 }}
      >
        <UserEditForm editUser={user} onCancel={handleEditCancel} onSave={handleEditSave} />
      </Drawer>
    );
  }

  const tabItems = [
    {
      key: "1",
      label: "Thông tin cơ bản",
      children: <BasicInfoTab user={user} loading={false} />,
    },
    {
      key: "2",
      label: "Hành vi",
      children: (
        <BehaviorTab
          userId={user?.id}
          onLoad={memoFetchBehavior}
          loading={loadingStats}
          data={behaviorStats}
        />
      ),
    },
    {
      key: "3",
      label: "Vi phạm",
      children: (
        <ViolationsTab
          userId={user?.id}
          onLoad={memoFetchViolations}
          loading={loadingViolations}
          data={violations}
        />
      ),
    },
    {
      key: "4",
      label: "Đơn hàng",
      children: (
        <OrdersTab
          userId={user?.id}
          onLoad={memoFetchOrders}
          loading={loadingOrders}
          data={orders}
        />
      ),
    },
    {
      key: "5",
      label: "Hoạt động",
      children: (
        <ActivityTab
          userId={user?.id}
          onLoad={memoFetchActivities}
          loading={loadingActivities}
          data={activities}
        />
      ),
    },
    {
      key: "6",
      label: "Thanh toán",
      children: (
        <PaymentTab
          userId={user?.id}
          onLoad={memoFetchPayments}
          loading={loadingPayments}
          data={payments}
        />
      ),
    },
    {
      key: "7",
      label: "Hạng thành viên",
      children: <MembershipTab user={user} />,
    },
    {
      key: "8",
      label: "Kỹ thuật",
      children: (
        <TechnicalTab
          userId={user?.id}
          onLoad={memoFetchTechnical}
          loading={loadingTechnical}
          data={technicalInfo}
        />
      ),
    },
  ];

  return (
    <Drawer
      title={`Chi tiết - ${user?.full_name || user?.username}`}
      placement="right"
      onClose={onClose}
      open={visible}
      width={Math.min(1200, window.innerWidth)}
      bodyStyle={{ padding: 0 }}
      extra={
        <Space>
          <Button type="primary" onClick={() => setIsEditing(true)}>
            Sửa ✏️
          </Button>
          <Button onClick={onClose}>
            <X size={16} />
          </Button>
        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        tabPosition="top"
        size="large"
        style={{ height: "100%" }}
      />
    </Drawer>
  );
}
