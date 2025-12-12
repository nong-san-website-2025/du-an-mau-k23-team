import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../features/admin/services/axiosInstance";

export default function useSellerStatus(shouldFetch = true) {
  const [storeName, setStoreName] = useState("");
  const [sellerStatus, setSellerStatus] = useState(null);
  const hasFetched = useRef(new Set()); // <--- track fetched tokens

  useEffect(() => {
    if (!shouldFetch) {
      setStoreName("");
      setSellerStatus(null);
      return;
    }

    const checkAndFetch = async () => {
      const token = localStorage.getItem("token");
      let username = localStorage.getItem("username");

      // If we have token but no username, fetch it from /users/me/
      if (token && !username) {
        try {
          const meRes = await axiosInstance.get("/users/me/");
          username = meRes.data.username;
          localStorage.setItem("username", username);
        } catch (error) {
          return;
        }
      }

      // Create a unique key for this user session
      const sessionKey = `${token || 'no-token'}-${username || 'no-username'}`;

      if (hasFetched.current.has(sessionKey)) {
        return; // đã fetch cho session này thì không fetch lại
      }

      hasFetched.current.add(sessionKey);

      // Reset state for new session
      setStoreName("");
      setSellerStatus(null);

      if (!token) {
        console.log("useSellerStatus: no token, setting to no seller");
        return;
      }

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
                (s.user_username || s.owner_username || s.user_name || s.owner_name || s.user)?.toLowerCase() ===
                username?.toLowerCase()
            );
          }

          if (!seller) {
            console.log("No seller found for user - setting to no seller");
            setSellerStatus(null);
            setStoreName("");
            return false;
          }

          const status = (seller.status || "").toLowerCase();
          console.log("Seller found:", seller.store_name, "Status:", status, "Raw status:", seller.status);
          console.log("All seller data:", seller);

          const approvedStatuses = ["approved", "đã duyệt", "active", "đang hoạt động"];
          const pendingStatuses = ["pending", "chờ duyệt"];
          const rejectedStatuses = ["rejected", "đã từ chối"];

          if (approvedStatuses.includes(status)) {
            console.log("Setting as approved/active seller with store name:", seller.store_name || "Shop của tôi");
            setStoreName(seller.store_name || "Shop của tôi");
            setSellerStatus(status === "active" || status === "đang hoạt động" ? "active" : "approved");
            return true;
          } else if (pendingStatuses.includes(status)) {
            console.log("Setting as pending seller");
            setSellerStatus("pending");
            setStoreName("");
            return false;
          } else if (rejectedStatuses.includes(status)) {
            console.log("Setting as rejected seller");
            setSellerStatus("rejected");
            setStoreName("");
            return false;
          } else {
            // For any other status (including null/empty), treat as no seller
            console.log("Setting as no seller (unrecognized status:", status, ")");
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
    };

    // Initial check
    checkAndFetch();

    // Listen for storage changes (login/logout)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'username') {
        console.log("useSellerStatus: storage changed for", e.key);
        checkAndFetch();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [shouldFetch]);

  return { storeName, sellerStatus };
}
