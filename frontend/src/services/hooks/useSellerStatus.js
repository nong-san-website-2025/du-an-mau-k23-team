import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../features/admin/services/axiosInstance";

export default function useSellerStatus() {
  const [storeName, setStoreName] = useState("");
  const [sellerStatus, setSellerStatus] = useState(null);
  const hasFetched = useRef(false); // <--- ref kiểm soát fetch

  useEffect(() => {
    if (hasFetched.current) return; // đã fetch thì không fetch lại
    hasFetched.current = true;

    const token = localStorage.getItem("token");
    if (!token) return;

    let intervalId;

    const fetchSellerStatus = async () => {
      try {
        let seller = null;
        try {
          const resMe = await axiosInstance.get(`/sellers/me/`);
          seller = resMe.data;
        } catch {
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
          return false;
        }

        const status = (seller.status || "").toLowerCase();
        const approvedStatuses = ["approved", "đã duyệt"];
        const pendingStatuses = ["pending", "chờ duyệt"];
        const rejectedStatuses = ["rejected", "đã từ chối"];

        if (approvedStatuses.includes(status)) {
          setStoreName(seller.store_name || "");
          setSellerStatus("approved");
          return true;
        } else if (status === "active") {
          setStoreName(seller.store_name || "");
          setSellerStatus("active");
          return true;
        } else if (pendingStatuses.includes(status)) {
          setSellerStatus("pending");
          setStoreName("");
          return false;
        } else if (rejectedStatuses.includes(status)) {
          setSellerStatus("rejected");
          setStoreName("");
          return false;
        } else {
          setSellerStatus(null);
          setStoreName("");
          return false;
        }
      } catch {
        setSellerStatus(null);
        return false;
      }
    };

    fetchSellerStatus().then((shouldInterval) => {
      // Tạm thời disable interval để tránh fetch liên tục
      // if (shouldInterval) {
      //   intervalId = setInterval(fetchSellerStatus, 10000);
      // }
    });

    return () => clearInterval(intervalId);
  }, []);

  return { storeName, sellerStatus };
}
