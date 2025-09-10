import { useState, useEffect } from "react";
import axiosInstance from "../../features/admin/services/axiosInstance";

export default function useSellerStatus() {
  const [storeName, setStoreName] = useState("");
  const [sellerStatus, setSellerStatus] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let intervalId;

    const fetchSellerStatus = async () => {
      try {
        let seller = null;

        // Try endpoint /sellers/me/
        try {
          const resMe = await axiosInstance.get(`/sellers/me/`);
          seller = resMe.data;
        } catch {
          // Fallback: filter by username
          const res = await axiosInstance.get(`/sellers/`);
          const username = localStorage.getItem("username");
          seller = res.data.find(
            (s) =>
              (s.user_name || s.owner_name || s.user)?.toLowerCase() ===
              username?.toLowerCase()
          );
        }

        if (!seller) {
          setSellerStatus(null);
          setStoreName("");
          return;
        }

        const status = (seller.status || "").toLowerCase();
        const approvedStatuses = ["approved", "đã duyệt"];
        const pendingStatuses = ["pending", "chờ duyệt"];
        const rejectedStatuses = ["rejected", "đã từ chối"];

        if (approvedStatuses.includes(status)) {
          setStoreName(seller.store_name || "");
          setSellerStatus("approved");
        } else if (status === "active") {
          setStoreName(seller.store_name || "");
          setSellerStatus("active");
        } else if (pendingStatuses.includes(status)) {
          setSellerStatus("pending");
          setStoreName("");
        } else if (rejectedStatuses.includes(status)) {
          setSellerStatus("rejected");
          setStoreName("");
        } else {
          setSellerStatus(null);
          setStoreName("");
        }
      } catch {
        setSellerStatus(null);
      }
    };

    fetchSellerStatus();
    intervalId = setInterval(fetchSellerStatus, 10000);

    return () => clearInterval(intervalId);
  }, []);

  return { storeName, sellerStatus };
}
