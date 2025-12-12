// src/hooks/useWalletLogic.js
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import API from "../../login_register/services/api";

const useWalletLogic = (activeTab) => {
  const [walletBalance, setWalletBalance] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeError, setRechargeError] = useState("");
  const [lastNotificationCheck, setLastNotificationCheck] = useState(
    Date.now()
  );

  const refreshWalletBalance = useCallback(async () => {
    try {
      const res = await API.get("/wallet/my_wallet/");
      setWalletBalance(res.data.balance);
    } catch (err) {
      console.error("Failed to refresh wallet balance:", err);
      // Optional: toast.error("Không thể tải số dư ví!");
    }
  }, []);

  const checkWalletNotifications = useCallback(async () => {
    try {
      const res = await API.get(
        `/wallet/notifications/?since=${lastNotificationCheck}`
      );
      const notifications = res.data;

      notifications.forEach((notification) => {
        if (notification.type === "topup_approved") {
          toast.success(
            `✅ Nạp tiền thành công! Đã cộng ${notification.amount.toLocaleString(
              "vi-VN"
            )} ₫ vào ví.`,
            { autoClose: 6000 }
          );
          refreshWalletBalance();
        } else if (notification.type === "topup_rejected") {
          toast.error(
            `❌ Yêu cầu nạp tiền ${notification.amount.toLocaleString(
              "vi-VN"
            )} ₫ bị từ chối. ${notification.reason || ""}`,
            { autoClose: 6000 }
          );
        }
      });

      if (notifications.length > 0) {
        setLastNotificationCheck(Date.now());
      }
    } catch (err) {
      console.log("Notification check failed:", err);
    }
  }, [lastNotificationCheck, refreshWalletBalance]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || activeTab !== "wallet") return;

    setLoadingWallet(true);
    refreshWalletBalance().finally(() => setLoadingWallet(false));

    // Thiết lập polling kiểm tra thông báo
    const interval = setInterval(checkWalletNotifications, 30000);
    checkWalletNotifications(); // Kiểm tra lần đầu
    return () => clearInterval(interval);
  }, [activeTab, checkWalletNotifications, refreshWalletBalance]);

  const handleRecharge = async () => {
    setRechargeLoading(true);
    setRechargeError("");
    try {
      const amount = Number(rechargeAmount);
      if (!amount || isNaN(amount) || amount < 10000 || amount > 300000000) {
        const msg =
          !amount || isNaN(amount)
            ? "Vui lòng nhập số tiền hợp lệ!"
            : amount < 10000
            ? "Số tiền nạp tối thiểu là 10.000 ₫."
            : "Số tiền nạp tối đa mỗi lần là 300.000.000 ₫.";
        setRechargeError(msg);
        toast.error(msg);
        return;
      }

      await API.post("/wallet/request_topup/", { amount });
      toast.info(
        `📝 Đã gửi yêu cầu nạp tiền ${amount.toLocaleString(
          "vi-VN"
        )} ₫. Vui lòng chờ xét duyệt!`
      );
      setRechargeAmount("");
      refreshWalletBalance();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Có lỗi xảy ra, vui lòng thử lại!";
      setRechargeError(msg);
      toast.error(`❌ ${msg}`);
    } finally {
      setRechargeLoading(false);
    }
  };

  return {
    walletBalance,
    loadingWallet,
    rechargeAmount,
    setRechargeAmount,
    rechargeLoading,
    rechargeError,
    handleRecharge,
    refreshWalletBalance,
  };
};

export default useWalletLogic;