// Custom Hook - Lấy dữ liệu người dùng từ API
import { useState, useEffect } from "react";
import {
  fetchUserBehavior,
  fetchUserViolations,
  fetchUserOrders,
  fetchUserActivityLog,
  fetchUserPayments,
  fetchUserTechnicalInfo,
} from "../api/userApi";

export const useUserData = (userId, visible) => {
  const [behaviorStats, setBehaviorStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [violations, setViolations] = useState([]);
  const [loadingViolations, setLoadingViolations] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const [payments, setPayments] = useState(null);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [technicalInfo, setTechnicalInfo] = useState(null);
  const [loadingTechnical, setLoadingTechnical] = useState(false);

  const resetData = () => {
    setBehaviorStats(null);
    setViolations([]);
    setOrders([]);
    setActivities([]);
    setPayments(null);
    setTechnicalInfo(null);
  };

  useEffect(() => {
    if (!visible || !userId) {
      resetData();
      return;
    }
  }, [visible, userId]);

  // Fetch behavior stats
  const fetchBehaviorStats = async () => {
    if (!userId) return;
    setLoadingStats(true);
    try {
      const data = await fetchUserBehavior(userId);
      setBehaviorStats(data);
    } catch (error) {
      console.error("❌ Lỗi tải thống kê hành vi:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch violations
  const fetchViolationsData = async () => {
    if (!userId) return;
    setLoadingViolations(true);
    try {
      const data = await fetchUserViolations(userId);
      setViolations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Lỗi tải vi phạm:", error);
    } finally {
      setLoadingViolations(false);
    }
  };

  // Fetch orders
  const fetchOrdersData = async () => {
    if (!userId) return;
    setLoadingOrders(true);
    try {
      const data = await fetchUserOrders(userId);
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Lỗi tải đơn hàng:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch activities
  const fetchActivitiesData = async () => {
    if (!userId) return;
    setLoadingActivities(true);
    try {
      const data = await fetchUserActivityLog(userId);
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Lỗi tải hoạt động:", error);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Fetch payments
  const fetchPaymentsData = async () => {
    if (!userId) return;
    setLoadingPayments(true);
    try {
      const data = await fetchUserPayments(userId);
      setPayments(data);
    } catch (error) {
      console.error("❌ Lỗi tải thanh toán:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Fetch technical info
  const fetchTechnicalData = async () => {
    if (!userId) return;
    setLoadingTechnical(true);
    try {
      const data = await fetchUserTechnicalInfo(userId);
      setTechnicalInfo(data);
    } catch (error) {
      console.error("❌ Lỗi tải thông tin kỹ thuật:", error);
    } finally {
      setLoadingTechnical(false);
    }
  };

  return {
    // Stats
    behaviorStats,
    loadingStats,
    fetchBehaviorStats,

    // Violations
    violations,
    loadingViolations,
    fetchViolationsData,

    // Orders
    orders,
    loadingOrders,
    fetchOrdersData,

    // Activities
    activities,
    loadingActivities,
    fetchActivitiesData,

    // Payments
    payments,
    loadingPayments,
    fetchPaymentsData,

    // Technical Info
    technicalInfo,
    loadingTechnical,
    fetchTechnicalData,

    // Reset
    resetData,
  };
};
