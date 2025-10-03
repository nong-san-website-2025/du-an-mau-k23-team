// src/features/users/services/useUserProfile.js
import { useEffect, useState } from "react";
import API from "../../login_register/services/api";

export default function useUserProfile(shouldFetch = true) {
  const [profile, setProfile] = useState(null);
  console.log("profile trong component:", profile);

  useEffect(() => {
    console.log("✅ useUserProfile chạy, shouldFetch =", shouldFetch);

    if (!shouldFetch) {
      console.log("⛔ shouldFetch = false → return null");
      setProfile(null);
      return;
    }

    const token = localStorage.getItem("token");
    console.log("🔑 token lấy từ localStorage:", token);

    if (!token) {
      console.log("⛔ Không có token → return null");
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await API.get("users/me/");
        console.log("👉 API users/me/ trả về:", res.data);
        setProfile(res.data);
      } catch (err) {
        console.error(
          "❌ Lỗi khi fetch profile:",
          err.response?.status,
          err.response?.data || err.message
        );
        setProfile(null);
      }
    };

    fetchProfile();
  }, [shouldFetch]);

  return profile;
}
